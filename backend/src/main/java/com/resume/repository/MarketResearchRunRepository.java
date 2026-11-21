package com.resume.repository;

import com.resume.model.MarketResearchRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface MarketResearchRunRepository extends JpaRepository<MarketResearchRun, Long> {
    Optional<MarketResearchRun> findByWeekStart(LocalDate weekStart);

    /** The newest week with the given status. */
    Optional<MarketResearchRun> findFirstByStatusOrderByWeekStartDesc(String status);

    /** The newest week, whatever its status. */
    Optional<MarketResearchRun> findFirstByOrderByWeekStartDesc();
}
