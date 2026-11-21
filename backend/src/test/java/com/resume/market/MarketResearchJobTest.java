package com.resume.market;

import com.resume.market.MarketResearchJob.Trigger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
class MarketResearchJobTest {

    /** A Saturday; its week starts on Monday 2026-11-16. */
    private static final Clock SATURDAY = Clock.fixed(Instant.parse("2026-11-21T23:30:00Z"), ZoneOffset.UTC);
    private static final LocalDate WEEK = LocalDate.of(2026, 11, 16);

    private final MarketResearchService service = mock(MarketResearchService.class);
    private MarketResearchJob job;

    private MarketResearchJob job(TestSettings settings) {
        job = new MarketResearchJob(settings.build(), service, SATURDAY);
        return job;
    }

    private void on() {
        when(service.disabledReason()).thenReturn(Optional.empty());
    }

    private void waitUntilIdle() throws InterruptedException {
        for (int i = 0; i < 200 && job.running(); i++) Thread.sleep(10);
        assertThat(job.running()).isFalse();
    }

    @AfterEach
    void stop() {
        if (job != null) job.stop();
    }

    // ── switched off ─────────────────────────────────────────────────────────

    @Test
    void whenDisabled_itLogsOneClearLine_schedulesNothing_andRefusesATrigger(CapturedOutput output) {
        when(service.disabledReason()).thenReturn(Optional.of("MARKET_RESEARCH_ENABLED is not true"));

        job(TestSettings.on()).start();

        assertThat(output.getOut().split("Market research is disabled: MARKET_RESEARCH_ENABLED is not true", -1))
                .as("the line appears exactly once").hasSize(2);
        assertThat(output.getOut()).doesNotContain("Market research is enabled");
        assertThat(job.trigger(false)).isEqualTo(Trigger.DISABLED);
        assertThat(job.trigger(true)).isEqualTo(Trigger.DISABLED);
        assertThat(job.running()).isFalse();
        verify(service, never()).run(any(), anyBoolean());
    }

    @Test
    void beforeStartup_aTriggerIsRefused() {
        on();
        assertThat(job(TestSettings.on()).trigger(false)).isEqualTo(Trigger.DISABLED);
    }

    @Test
    void aFailureWhileSettingUp_neverEscapes(CapturedOutput output) {
        when(service.disabledReason()).thenThrow(new IllegalStateException("boom"));

        assertThatCode(() -> job(TestSettings.on()).start()).doesNotThrowAnyException();

        assertThat(output.getOut()).contains("Market research is disabled: it could not be scheduled");
    }

    // ── switched on ──────────────────────────────────────────────────────────

    @Test
    void whenEnabled_itLogsTheSchedule_andATriggerRunsTheCurrentWeekInTheBackground(CapturedOutput output)
            throws Exception {
        on();
        job(TestSettings.on()).start();

        assertThat(output.getOut()).contains("Market research is enabled: schedule '0 0 6 * * MON' (UTC)");
        assertThat(job.currentWeek()).isEqualTo(WEEK);

        assertThat(job.trigger(false)).isEqualTo(Trigger.STARTED);
        verify(service, timeout(2000)).run(WEEK, false);
        waitUntilIdle();

        assertThat(job.trigger(true)).isEqualTo(Trigger.STARTED);
        verify(service, timeout(2000)).run(WEEK, true);
        waitUntilIdle();
    }

    @Test
    void aCronExpressionThatIsNotValid_fallsBackToTheDefaultInsteadOfFailing(CapturedOutput output) {
        on();
        TestSettings settings = TestSettings.on();
        settings.cron = "every monday";

        assertThatCode(() -> job(settings).start()).doesNotThrowAnyException();

        assertThat(output.getOut()).contains("MARKET_RESEARCH_CRON is not a valid cron expression")
                .contains("Market research is enabled: schedule '0 0 6 * * MON' (UTC)");
        assertThat(job.trigger(false)).isEqualTo(Trigger.STARTED);
    }

    @Test
    void aSecondTriggerWhileARunIsGoing_isRefused_andSoIsTheSchedule() throws Exception {
        on();
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        when(service.run(any(), anyBoolean())).thenAnswer(call -> {
            started.countDown();
            release.await(5, TimeUnit.SECONDS);
            return null;
        });
        job(TestSettings.on()).start();

        assertThat(job.trigger(false)).isEqualTo(Trigger.STARTED);
        assertThat(started.await(2, TimeUnit.SECONDS)).isTrue();
        assertThat(job.running()).isTrue();

        assertThat(job.trigger(false)).isEqualTo(Trigger.ALREADY_RUNNING);
        assertThat(job.trigger(true)).isEqualTo(Trigger.ALREADY_RUNNING);
        job.scheduledRun();

        release.countDown();
        waitUntilIdle();
        verify(service, times(1)).run(any(), anyBoolean());

        // Free again afterwards.
        assertThat(job.trigger(false)).isEqualTo(Trigger.STARTED);
        verify(service, timeout(2000).times(2)).run(any(), anyBoolean());
    }

    @Test
    void theScheduledRunNeverForces_andAFailureInsideARunFreesTheJob() throws Exception {
        on();
        job(TestSettings.on()).start();

        job.scheduledRun();
        verify(service).run(WEEK, false);
        assertThat(job.running()).isFalse();

        when(service.run(any(), anyBoolean())).thenThrow(new IllegalStateException("boom"));
        assertThatCode(job::scheduledRun).doesNotThrowAnyException();
        assertThat(job.running()).isFalse();
    }

    @Test
    void ifTheJobIsSwitchedOffLater_aTriggerIsRefused() {
        on();
        job(TestSettings.on()).start();
        when(service.disabledReason()).thenReturn(Optional.of("the skills dictionary is empty"));

        assertThat(job.trigger(false)).isEqualTo(Trigger.DISABLED);
        verify(service, never()).run(any(), anyBoolean());
    }

    @Test
    void afterShutdown_aTriggerIsRefused_andStoppingTwiceIsHarmless() {
        on();
        job(TestSettings.on()).start();

        job.stop();
        job.stop();

        assertThat(job.trigger(false)).isEqualTo(Trigger.DISABLED);
    }

    @Test
    void theWeekStartsOnMonday_utc() {
        MarketResearchJob monday = new MarketResearchJob(TestSettings.defaults(), service,
                Clock.fixed(Instant.parse("2026-11-16T00:00:00Z"), ZoneOffset.UTC));
        MarketResearchJob sunday = new MarketResearchJob(TestSettings.defaults(), service,
                Clock.fixed(Instant.parse("2026-11-15T23:59:59Z"), ZoneOffset.UTC));

        assertThat(monday.currentWeek()).isEqualTo(LocalDate.of(2026, 11, 16));
        assertThat(sunday.currentWeek()).isEqualTo(LocalDate.of(2026, 11, 9));
        assertThat(new MarketResearchJob(TestSettings.defaults(), service).currentWeek().getDayOfWeek().getValue())
                .isEqualTo(1);
    }
}
