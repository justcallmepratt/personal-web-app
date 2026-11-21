package com.resume.market;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MarketResearchSettingsTest {

    @Test
    void isOffUnlessTheFlagAndBothCredentialsAreSet() {
        TestSettings off = TestSettings.on();
        off.enabled = "false";
        assertThat(off.build().disabledReason()).contains("MARKET_RESEARCH_ENABLED is not true");
        assertThat(off.build().enabled()).isFalse();

        TestSettings unset = TestSettings.on();
        unset.enabled = null;
        assertThat(unset.build().disabledReason()).contains("MARKET_RESEARCH_ENABLED is not true");

        TestSettings typo = TestSettings.on();
        typo.enabled = "yes";
        assertThat(typo.build().disabledReason()).isPresent();

        TestSettings noId = TestSettings.on();
        noId.appId = " ";
        assertThat(noId.build().disabledReason()).contains("ADZUNA_APP_ID and ADZUNA_APP_KEY are not both set");

        TestSettings noKey = TestSettings.on();
        noKey.appKey = null;
        assertThat(noKey.build().disabledReason()).contains("ADZUNA_APP_ID and ADZUNA_APP_KEY are not both set");

        TestSettings on = TestSettings.on();
        on.enabled = " TRUE ";
        assertThat(on.build().disabledReason()).isEmpty();
        assertThat(on.build().enabled()).isTrue();
    }

    @Test
    void defaultsAreTheDocumentedOnes() {
        MarketResearchSettings s = TestSettings.defaults();

        assertThat(s.appId()).isEqualTo("test-id");
        assertThat(s.appKey()).isEqualTo("test-key");
        assertThat(s.cron()).isEqualTo("0 0 6 * * MON");
        assertThat(s.country()).isEqualTo("us");
        assertThat(s.minListings()).isEqualTo(30);
        assertThat(s.minMentions()).isEqualTo(5);
        assertThat(s.minSharePercent()).isEqualTo(20);
        assertThat(s.maxSuggestionsPerRun()).isEqualTo(3);
        assertThat(s.maxPendingSuggestions()).isEqualTo(5);
        assertThat(s.maxDaysOld()).isEqualTo(30);
        assertThat(s.resultsPerPage()).isEqualTo(50);
        assertThat(s.maxAttempts()).isEqualTo(3);
        assertThat(s.backoffMillis()).isEqualTo(2000);
        assertThat(s.pauseMillis()).isEqualTo(3000);
    }

    @Test
    void aValueThatIsNotAUsableNumber_fallsBackToTheDefaultInsteadOfFailing() {
        TestSettings raw = TestSettings.on();
        raw.minListings = "thirty";
        raw.minMentions = "";
        raw.minSharePercent = "250";
        raw.maxSuggestionsPerRun = "-1";
        raw.maxPendingSuggestions = null;
        raw.maxAttempts = "0";
        raw.resultsPerPage = "500";
        raw.pauseMillis = "1e3";

        MarketResearchSettings s = raw.build();

        assertThat(s.minListings()).isEqualTo(30);
        assertThat(s.minMentions()).isEqualTo(5);
        assertThat(s.minSharePercent()).isEqualTo(20);
        assertThat(s.maxSuggestionsPerRun()).isEqualTo(3);
        assertThat(s.maxPendingSuggestions()).isEqualTo(5);
        assertThat(s.maxAttempts()).isEqualTo(3);
        assertThat(s.resultsPerPage()).isEqualTo(50);
        assertThat(s.pauseMillis()).isEqualTo(3000);
    }

    @Test
    void usableValuesAreKept_includingZeroSuggestions() {
        TestSettings raw = TestSettings.on();
        raw.minListings = " 10 ";
        raw.maxSuggestionsPerRun = "0";
        raw.backoffMillis = "0";

        MarketResearchSettings s = raw.build();

        assertThat(s.minListings()).isEqualTo(10);
        assertThat(s.maxSuggestionsPerRun()).isZero();
        assertThat(s.backoffMillis()).isZero();
    }

    @Test
    void blankOrOddTextSettingsFallBackToo() {
        TestSettings raw = TestSettings.on();
        raw.cron = "  ";
        raw.baseUrl = null;
        raw.country = "USA";
        MarketResearchSettings s = raw.build();
        assertThat(s.cron()).isEqualTo(MarketResearchSettings.DEFAULT_CRON);
        assertThat(s.baseUrl()).isEqualTo(MarketResearchSettings.DEFAULT_BASE_URL);
        assertThat(s.country()).isEqualTo("us");

        TestSettings custom = TestSettings.on();
        custom.cron = "0 30 7 * * TUE";
        custom.baseUrl = "https://example.test/api//";
        custom.country = "gb";
        assertThat(custom.build().cron()).isEqualTo("0 30 7 * * TUE");
        assertThat(custom.build().baseUrl()).isEqualTo("https://example.test/api");
        assertThat(custom.build().country()).isEqualTo("gb");
    }
}
