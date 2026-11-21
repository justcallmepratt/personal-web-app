package com.resume.repository;

import com.resume.model.MarketRoleTotal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface MarketRoleTotalRepository extends JpaRepository<MarketRoleTotal, Long> {
    /** In the order the roles were saved (the order of the roles file). */
    List<MarketRoleTotal> findByRunIdOrderByIdAsc(Long runId);

    /** Runs at once (not at flush), so the same roles can be inserted again in the same transaction. */
    @Transactional
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from MarketRoleTotal t where t.runId = :runId")
    int deleteByRunId(@Param("runId") Long runId);
}
