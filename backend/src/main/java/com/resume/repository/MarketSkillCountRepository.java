package com.resume.repository;

import com.resume.model.MarketSkillCount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface MarketSkillCountRepository extends JpaRepository<MarketSkillCount, Long> {
    /** Most mentioned first; the name breaks ties so the order is stable. */
    List<MarketSkillCount> findByRunIdOrderByListingsMentionedDescSkillAsc(Long runId);

    /** Runs at once (not at flush), so the same skills can be inserted again in the same transaction. */
    @Transactional
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from MarketSkillCount c where c.runId = :runId")
    int deleteByRunId(@Param("runId") Long runId);
}
