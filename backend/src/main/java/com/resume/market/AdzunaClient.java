package com.resume.market;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Reads listings from the Adzuna search API: one request per company and target role,
 * the first page only (see docs/RESEARCH.md for the terms and what is and is not confirmed about limits).
 *
 * <p>Failure handling: a 5-second connect and 10-second read timeout; a rate-limit answer
 * (429), a server error (5xx) or a network error is tried again with a doubling wait, up
 * to {@code max-attempts}; a refused key (401, 403, or Adzuna's 410 "Authorisation
 * failed") and any other 4xx are not retried. Error messages name the company and the
 * status only. The request address carries the credentials, so it is never put in a
 * message, and the underlying exception (whose text includes the address) is never logged.
 */
@Component
public class AdzunaClient implements ListingsClient {
    static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    static final Duration READ_TIMEOUT = Duration.ofSeconds(10);
    /** The longest a Retry-After header is honoured for. */
    static final long RETRY_AFTER_MAX_MILLIS = 60_000;

    private static final String PATH = "/jobs/{country}/search/1?app_id={appId}&app_key={appKey}"
            + "&content-type=application/json&results_per_page={perPage}";
    private static final String FILTERS = "&company={company}&max_days_old={maxDaysOld}&sort_by=date";

    /** Waiting, replaceable in tests. */
    @FunctionalInterface
    public interface Sleeper {
        void sleep(long millis) throws InterruptedException;
    }

    private record Attempt(List<Listing> listings, String error, boolean retry, long waitMillis) {
        static Attempt ok(List<Listing> listings) { return new Attempt(listings, null, false, 0); }
        static Attempt fatal(String error) { return new Attempt(null, error, false, 0); }
        static Attempt again(String error, long waitMillis) { return new Attempt(null, error, true, waitMillis); }
    }

    private final MarketResearchSettings settings;
    private final ObjectMapper mapper;
    private final RestClient http;
    private final Sleeper sleeper;

    @Autowired
    public AdzunaClient(MarketResearchSettings settings, ObjectMapper mapper) {
        this(settings, mapper, RestClient.builder().requestFactory(requestFactory()), Thread::sleep);
    }

    AdzunaClient(MarketResearchSettings settings, ObjectMapper mapper, RestClient.Builder builder, Sleeper sleeper) {
        this.settings = settings;
        this.mapper = mapper;
        this.http = builder.build();
        this.sleeper = sleeper;
    }

    private static JdkClientHttpRequestFactory requestFactory() {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build());
        factory.setReadTimeout(READ_TIMEOUT);
        return factory;
    }

    @Override
    public Page fetch(AllowList.Company company, TargetRoles.Role role) {
        String last = "no attempt was made";
        for (int attempt = 1; attempt <= settings.maxAttempts(); attempt++) {
            Attempt result = attempt(company, role);
            if (result.listings() != null) return new Page(result.listings(), attempt);
            last = result.error();
            if (!result.retry()) throw new ListingsException(last, attempt);
            if (attempt == settings.maxAttempts()) break;

            long backoff = settings.backoffMillis() * (1L << (attempt - 1));
            try {
                sleeper.sleep(Math.max(backoff, result.waitMillis()));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new ListingsException("Interrupted while waiting to retry " + company.name()
                        + " (" + role.name() + ")", attempt);
            }
        }
        throw new ListingsException(last + " (after " + settings.maxAttempts() + " attempts)", settings.maxAttempts());
    }

    private Attempt attempt(AllowList.Company company, TargetRoles.Role role) {
        String who = "Adzuna request for " + company.name() + " (" + role.name() + ")";
        // The role's search decides the keywords: what, what_phrase and category are each optional.
        TargetRoles.Search search = role.search();
        Map<String, Object> values = new HashMap<>();
        values.put("country", settings.country());
        values.put("appId", settings.appId());
        values.put("appKey", settings.appKey());
        values.put("perPage", settings.resultsPerPage());
        values.put("company", company.searchName());
        values.put("maxDaysOld", settings.maxDaysOld());
        StringBuilder template = new StringBuilder(settings.baseUrl()).append(PATH);
        if (search.what() != null) {
            template.append("&what={what}");
            values.put("what", search.what());
        }
        if (search.whatPhrase() != null) {
            template.append("&what_phrase={whatPhrase}");
            values.put("whatPhrase", search.whatPhrase());
        }
        if (search.category() != null) {
            template.append("&category={category}");
            values.put("category", search.category());
        }
        template.append(FILTERS);
        try {
            return http.get()
                    .uri(template.toString(), values)
                    .header(HttpHeaders.ACCEPT, "application/json")
                    .exchange((request, response) -> {
                        int status = response.getStatusCode().value();
                        if (status == 200) {
                            String body = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
                            return parse(who, body);
                        }
                        if (status == 429) {
                            return Attempt.again(who + " was rate limited (HTTP 429)",
                                    retryAfterMillis(response.getHeaders().getFirst(HttpHeaders.RETRY_AFTER)));
                        }
                        if (status >= 500) return Attempt.again(who + " failed: HTTP " + status, 0);
                        if (status == 401 || status == 403 || status == 410) {
                            return Attempt.fatal(who + " was refused (HTTP " + status
                                    + "): check ADZUNA_APP_ID and ADZUNA_APP_KEY");
                        }
                        return Attempt.fatal(who + " failed: HTTP " + status);
                    });
        } catch (RuntimeException e) {
            // Timeouts and connection errors. The exception's own text contains the request
            // address (and so the credentials): keep only its type.
            return Attempt.again(who + " failed: network error (" + e.getClass().getSimpleName() + ")", 0);
        }
    }

    private Attempt parse(String who, String body) {
        JsonNode results;
        try {
            results = mapper.readTree(body).path("results");
        } catch (RuntimeException e) {
            return Attempt.fatal(who + " returned a response that is not JSON");
        }
        if (!results.isArray()) return Attempt.fatal(who + " returned a response without a results list");

        List<Listing> listings = new ArrayList<>();
        for (JsonNode item : results) {
            String title = text(item.path("title"));
            if (title.isEmpty()) continue;
            listings.add(new Listing(text(item.path("id")), title,
                    text(item.path("company").path("display_name")), text(item.path("description"))));
        }
        return Attempt.ok(listings);
    }

    /** A text or number field as plain text, with any markup removed; anything else is empty. */
    private static String text(JsonNode node) {
        if (node == null || !(node.isString() || node.isNumber())) return "";
        return node.asString().replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").strip();
    }

    /** Retry-After in seconds, capped; 0 when absent or not a number (a date is ignored). */
    static long retryAfterMillis(String header) {
        if (header == null) return 0;
        try {
            long seconds = Long.parseLong(header.strip());
            return seconds <= 0 ? 0 : Math.min(seconds * 1000, RETRY_AFTER_MAX_MILLIS);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
