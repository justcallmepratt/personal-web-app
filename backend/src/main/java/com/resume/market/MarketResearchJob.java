package com.resume.market;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.Optional;
import java.util.TimeZone;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Schedules the weekly run and takes the manual trigger.
 *
 * <p>Off by default. When the application is ready this logs one line saying whether the
 * job is on, and if it is off, why. Nothing here can stop the application from starting:
 * the schedule is set up after startup, inside a catch, and a bad cron expression falls
 * back to the default.
 *
 * <p>The API runs as one instance, so one flag is enough to make sure two runs never
 * overlap: a trigger that arrives while a run is going is refused, not queued. The
 * database's unique week is the backstop.
 */
@Component
public class MarketResearchJob {
    private static final Logger log = LoggerFactory.getLogger(MarketResearchJob.class);

    public enum Trigger { STARTED, ALREADY_RUNNING, DISABLED }

    private final MarketResearchSettings settings;
    private final MarketResearchService service;
    private final Clock clock;
    private final AtomicBoolean running = new AtomicBoolean();
    private volatile ThreadPoolTaskScheduler scheduler;

    @Autowired
    public MarketResearchJob(MarketResearchSettings settings, MarketResearchService service) {
        this(settings, service, Clock.systemUTC());
    }

    MarketResearchJob(MarketResearchSettings settings, MarketResearchService service, Clock clock) {
        this.settings = settings;
        this.service = service;
        this.clock = clock;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        try {
            Optional<String> off = service.disabledReason();
            if (off.isPresent()) {
                log.info("Market research is disabled: {}", off.get());
                return;
            }
            ThreadPoolTaskScheduler created = new ThreadPoolTaskScheduler();
            created.setPoolSize(1);
            created.setThreadNamePrefix("market-research-");
            created.setDaemon(true);
            created.initialize();

            String cron = settings.cron();
            CronTrigger trigger;
            try {
                trigger = new CronTrigger(cron, TimeZone.getTimeZone(ZoneOffset.UTC));
            } catch (IllegalArgumentException e) {
                log.warn("Market research: MARKET_RESEARCH_CRON is not a valid cron expression; using '{}'",
                        MarketResearchSettings.DEFAULT_CRON);
                cron = MarketResearchSettings.DEFAULT_CRON;
                trigger = new CronTrigger(cron, TimeZone.getTimeZone(ZoneOffset.UTC));
            }
            created.schedule(this::scheduledRun, trigger);
            scheduler = created;
            log.info("Market research is enabled: schedule '{}' (UTC)", cron);
        } catch (RuntimeException e) {
            log.error("Market research is disabled: it could not be scheduled ({})", e.getClass().getSimpleName());
        }
    }

    @PreDestroy
    public void stop() {
        ThreadPoolTaskScheduler current = scheduler;
        scheduler = null;
        if (current != null) current.shutdown();
    }

    /** Starts a run for the current week in the background, unless one is going or the job is off. */
    public Trigger trigger(boolean force) {
        ThreadPoolTaskScheduler current = scheduler;
        if (current == null || service.disabledReason().isPresent()) return Trigger.DISABLED;
        if (!running.compareAndSet(false, true)) return Trigger.ALREADY_RUNNING;
        try {
            current.execute(() -> runAndRelease(force));
        } catch (RuntimeException e) {
            running.set(false);
            log.error("Market research: the run could not be started ({})", e.getClass().getSimpleName());
            return Trigger.DISABLED;
        }
        return Trigger.STARTED;
    }

    public boolean running() { return running.get(); }

    /** The Monday of the current week, UTC. */
    public LocalDate currentWeek() {
        return LocalDate.now(clock).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    void scheduledRun() {
        if (!running.compareAndSet(false, true)) {
            log.info("Market research: the scheduled run was skipped because a run is already going");
            return;
        }
        runAndRelease(false);
    }

    private void runAndRelease(boolean force) {
        try {
            service.run(currentWeek(), force);
        } catch (Throwable e) {
            log.error("Market research run FAILED unexpectedly", e);
        } finally {
            running.set(false);
        }
    }
}
