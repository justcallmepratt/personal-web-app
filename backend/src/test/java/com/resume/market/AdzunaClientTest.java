package com.resume.market;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/** The Adzuna client against a mocked HTTP layer: no request leaves the machine. */
class AdzunaClientTest {

    private static final String SECRET = "s3cr3t-key-value";
    private static final AllowList.Company COMPANY =
            new AllowList.Company("Example Bank", "Example Bank & Co", Set.of("example bank"));
    private static final TargetRoles.Role ROLE = new TargetRoles.Role("software-developer", "software developer",
            Set.of("software engineer"), new TargetRoles.Search("software", null, "it-jobs"));
    private static final TargetRoles.Role PHRASE_ROLE = new TargetRoles.Role("forward-deployed-engineer",
            "forward deployed engineer", Set.of("forward deployed engineer"),
            new TargetRoles.Search(null, "forward deployed", null));

    private static final String TWO_RESULTS = """
            {"count": 2, "results": [
              {"id": "101", "title": "Senior <strong>Software</strong> Engineer",
               "description": "Java,  Spring Boot and <b>Kafka</b>…",
               "company": {"display_name": "Example Bank"}, "redirect_url": "https://example.test/1"},
              {"id": 102, "title": "Java Developer", "description": "SQL", "company": {"display_name": "Example Bank N.A."}},
              {"id": "103", "description": "no title"},
              {"id": "104", "title": {"odd": true}, "description": "title is not text"},
              {"id": "105", "title": "Developer"}
            ]}""";

    private final List<Long> sleeps = new ArrayList<>();
    private MockRestServiceServer server;
    private AdzunaClient client;

    @BeforeEach
    void setUp() {
        TestSettings settings = TestSettings.on();
        settings.appKey = SECRET;
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new AdzunaClient(settings.build(), JsonMapper.builder().build(), builder, sleeps::add);
    }

    @AfterEach
    void clearInterrupt() {
        Thread.interrupted();
    }

    @Test
    void sendsOneFilteredRequestForTheCompany_andReadsTheListings() {
        server.expect(ExpectedCount.once(), requestTo(startsWith("https://adzuna.test/v1/api/jobs/us/search/1?")))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("Accept", "application/json"))
                .andExpect(queryParam("app_id", "test-id"))
                .andExpect(queryParam("app_key", SECRET))
                .andExpect(queryParam("content-type", "application/json"))
                .andExpect(queryParam("results_per_page", "50"))
                .andExpect(queryParam("what", "software"))
                .andExpect(queryParam("category", "it-jobs"))
                .andExpect(queryParam("company", "Example%20Bank%20%26%20Co"))
                .andExpect(queryParam("max_days_old", "30"))
                .andExpect(queryParam("sort_by", "date"))
                .andRespond(withSuccess(TWO_RESULTS, MediaType.APPLICATION_JSON));

        ListingsClient.Page page = client.fetch(COMPANY, ROLE);

        assertThat(page.apiCalls()).isEqualTo(1);
        assertThat(page.listings()).containsExactly(
                new Listing("101", "Senior Software Engineer", "Example Bank", "Java, Spring Boot and Kafka …"),
                new Listing("102", "Java Developer", "Example Bank N.A.", "SQL"),
                new Listing("105", "Developer", "", ""));
        assertThat(sleeps).isEmpty();
        server.verify();
    }

    @Test
    void theRolesSearchDecidesTheKeywords_aPhraseSearchSendsNoKeywordsOrCategory() {
        server.expect(ExpectedCount.once(), requestTo(allOf(
                        startsWith("https://adzuna.test/v1/api/jobs/us/search/1?"),
                        not(containsString("&what=")), not(containsString("category=")))))
                .andExpect(queryParam("what_phrase", "forward%20deployed"))
                .andExpect(queryParam("company", "Example%20Bank%20%26%20Co"))
                .andExpect(queryParam("max_days_old", "30"))
                .andRespond(withSuccess("{\"results\":[{\"id\":\"9\",\"title\":\"Forward Deployed Engineer\","
                        + "\"company\":{\"display_name\":\"Example Bank\"},\"description\":\"Python\"}]}",
                        MediaType.APPLICATION_JSON));

        ListingsClient.Page page = client.fetch(COMPANY, PHRASE_ROLE);

        assertThat(page.listings()).containsExactly(
                new Listing("9", "Forward Deployed Engineer", "Example Bank", "Python"));
        server.verify();
    }

    @Test
    void aFailureNamesTheCompanyAndTheRole() {
        server.expect(requestTo(startsWith("https://adzuna.test/"))).andRespond(withStatus(HttpStatus.NOT_FOUND));

        ListingsException e = catchThrowableOfType(ListingsException.class, () -> client.fetch(COMPANY, PHRASE_ROLE));

        assertThat(e).hasMessage("Adzuna request for Example Bank (forward deployed engineer) failed: HTTP 404");
    }

    @Test
    void anEmptyResultListIsNotAnError() {
        server.expect(requestTo(startsWith("https://adzuna.test/"))).andRespond(
                withSuccess("{\"count\":0,\"results\":[]}", MediaType.APPLICATION_JSON));

        assertThat(client.fetch(COMPANY, ROLE).listings()).isEmpty();
    }

    @Test
    void aRateLimitAnswerIsRetried_afterTheLongerOfBackoffAndRetryAfter() {
        server.expect(ExpectedCount.once(), requestTo(startsWith("https://adzuna.test/")))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).header("Retry-After", "7"));
        server.expect(ExpectedCount.once(), requestTo(startsWith("https://adzuna.test/")))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        server.expect(ExpectedCount.once(), requestTo(startsWith("https://adzuna.test/")))
                .andRespond(withSuccess(TWO_RESULTS, MediaType.APPLICATION_JSON));

        ListingsClient.Page page = client.fetch(COMPANY, ROLE);

        assertThat(page.apiCalls()).isEqualTo(3);
        assertThat(page.listings()).hasSize(3);
        // 7 s from the header beats the 2 s backoff; then the doubled backoff, 4 s.
        assertThat(sleeps).containsExactly(7000L, 4000L);
        server.verify();
    }

    @Test
    void aRateLimitThatNeverClears_failsAfterTheLastAttempt() {
        server.expect(ExpectedCount.times(3), requestTo(startsWith("https://adzuna.test/")))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        ListingsException e = catchThrowableOfType(ListingsException.class, () -> client.fetch(COMPANY, ROLE));

        assertThat(e).hasMessageContaining("rate limited (HTTP 429)").hasMessageContaining("after 3 attempts");
        assertThat(e.apiCalls()).isEqualTo(3);
        assertThat(sleeps).containsExactly(2000L, 4000L);
        server.verify();
    }

    @Test
    void serverErrorsAreRetriedWithADoublingWait_thenTheRunIsToldItFailed() {
        server.expect(ExpectedCount.times(3), requestTo(startsWith("https://adzuna.test/")))
                .andRespond(withStatus(HttpStatus.BAD_GATEWAY));

        ListingsException e = catchThrowableOfType(ListingsException.class, () -> client.fetch(COMPANY, ROLE));

        assertThat(e).hasMessage("Adzuna request for Example Bank (software developer) failed: HTTP 502 (after 3 attempts)");
        assertThat(e.apiCalls()).isEqualTo(3);
        assertThat(sleeps).containsExactly(2000L, 4000L);
        server.verify();
    }

    @Test
    void aServerErrorFollowedByAGoodAnswerSucceeds() {
        server.expect(ExpectedCount.once(), requestTo(startsWith("https://adzuna.test/")))
                .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));
        server.expect(ExpectedCount.once(), requestTo(startsWith("https://adzuna.test/")))
                .andRespond(withSuccess(TWO_RESULTS, MediaType.APPLICATION_JSON));

        assertThat(client.fetch(COMPANY, ROLE).apiCalls()).isEqualTo(2);
        assertThat(sleeps).containsExactly(2000L);
    }

    @Test
    void aRefusedKeyIsNotRetried_andTheMessageSaysWhatToCheck() {
        for (HttpStatus status : List.of(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.GONE)) {
            server.reset();
            server.expect(ExpectedCount.once(), requestTo(startsWith("https://adzuna.test/")))
                    .andRespond(withStatus(status).body("{\"exception\":\"AUTH_FAIL\",\"display\":\"Authorisation failed\"}"));

            ListingsException e = catchThrowableOfType(ListingsException.class, () -> client.fetch(COMPANY, ROLE));

            assertThat(e).hasMessageContaining("was refused (HTTP " + status.value() + ")")
                    .hasMessageContaining("ADZUNA_APP_ID and ADZUNA_APP_KEY");
            assertThat(e.apiCalls()).isEqualTo(1);
            server.verify();
        }
        assertThat(sleeps).isEmpty();
    }

    @Test
    void anotherClientErrorIsNotRetried() {
        server.expect(ExpectedCount.once(), requestTo(startsWith("https://adzuna.test/")))
                .andRespond(withStatus(HttpStatus.BAD_REQUEST));

        ListingsException e = catchThrowableOfType(ListingsException.class, () -> client.fetch(COMPANY, ROLE));

        assertThat(e).hasMessage("Adzuna request for Example Bank (software developer) failed: HTTP 400");
        assertThat(sleeps).isEmpty();
        server.verify();
    }

    @Test
    void aNetworkErrorIsRetried_andTheCredentialsNeverReachTheMessage() {
        server.expect(ExpectedCount.times(3), requestTo(startsWith("https://adzuna.test/")))
                .andRespond(withException(new IOException("timeout calling https://adzuna.test/?app_key=" + SECRET)));

        ListingsException e = catchThrowableOfType(ListingsException.class, () -> client.fetch(COMPANY, ROLE));

        assertThat(e).hasMessageContaining("network error").hasMessageContaining("after 3 attempts");
        assertThat(e.getMessage()).doesNotContain(SECRET).doesNotContain("app_key").doesNotContain("https://");
        assertThat(e.getCause()).isNull();
        assertThat(e.apiCalls()).isEqualTo(3);
        assertThat(sleeps).containsExactly(2000L, 4000L);
    }

    @Test
    void noErrorMessageEverContainsTheKey() {
        for (HttpStatus status : List.of(HttpStatus.BAD_REQUEST, HttpStatus.GONE, HttpStatus.NOT_FOUND)) {
            server.reset();
            server.expect(requestTo(startsWith("https://adzuna.test/"))).andRespond(withStatus(status));
            ListingsException e = catchThrowableOfType(ListingsException.class, () -> client.fetch(COMPANY, ROLE));
            assertThat(e.getMessage()).doesNotContain(SECRET).doesNotContain("test-id");
        }
    }

    @Test
    void aBodyThatIsNotTheExpectedJsonFailsWithoutARetry() {
        server.expect(ExpectedCount.once(), requestTo(startsWith("https://adzuna.test/")))
                .andRespond(withSuccess("<html>maintenance</html>", MediaType.TEXT_HTML));
        ListingsException notJson = catchThrowableOfType(ListingsException.class, () -> client.fetch(COMPANY, ROLE));
        assertThat(notJson).hasMessageContaining("not JSON");
        assertThat(notJson.apiCalls()).isEqualTo(1);

        server.reset();
        server.expect(ExpectedCount.once(), requestTo(startsWith("https://adzuna.test/")))
                .andRespond(withSuccess("{\"exception\":\"X\"}", MediaType.APPLICATION_JSON));
        ListingsException noList = catchThrowableOfType(ListingsException.class, () -> client.fetch(COMPANY, ROLE));
        assertThat(noList).hasMessageContaining("without a results list");
        assertThat(sleeps).isEmpty();
    }

    @Test
    void anInterruptWhileWaitingStopsTheRetries() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer interrupted = MockRestServiceServer.bindTo(builder).build();
        interrupted.expect(ExpectedCount.once(), requestTo(startsWith("https://adzuna.test/")))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));
        AdzunaClient impatient = new AdzunaClient(TestSettings.defaults(), JsonMapper.builder().build(), builder,
                millis -> { throw new InterruptedException(); });

        ListingsException e = catchThrowableOfType(ListingsException.class, () -> impatient.fetch(COMPANY, ROLE));

        assertThat(e).hasMessageContaining("Interrupted");
        assertThat(e.apiCalls()).isEqualTo(1);
        assertThat(Thread.currentThread().isInterrupted()).isTrue();
        interrupted.verify();
    }

    @Test
    void retryAfter_isReadAsSeconds_cappedAtAMinute_andIgnoredWhenItIsNotANumber() {
        assertThat(AdzunaClient.retryAfterMillis(null)).isZero();
        assertThat(AdzunaClient.retryAfterMillis("soon")).isZero();
        assertThat(AdzunaClient.retryAfterMillis("Wed, 21 Oct 2026 07:28:00 GMT")).isZero();
        assertThat(AdzunaClient.retryAfterMillis("-3")).isZero();
        assertThat(AdzunaClient.retryAfterMillis("0")).isZero();
        assertThat(AdzunaClient.retryAfterMillis(" 5 ")).isEqualTo(5000);
        assertThat(AdzunaClient.retryAfterMillis("86400")).isEqualTo(AdzunaClient.RETRY_AFTER_MAX_MILLIS);
    }

    @Test
    void theProductionConstructorSetsTimeouts_withoutMakingARequest() {
        assertThat(new AdzunaClient(TestSettings.defaults(), JsonMapper.builder().build())).isNotNull();
        assertThat(AdzunaClient.CONNECT_TIMEOUT.toSeconds()).isEqualTo(5);
        assertThat(AdzunaClient.READ_TIMEOUT.toSeconds()).isEqualTo(10);
    }
}
