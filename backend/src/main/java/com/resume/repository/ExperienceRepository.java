package com.resume.repository;

import com.resume.model.Experience;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExperienceRepository extends JpaRepository<Experience, Long> {
    List<Experience> findAllByOrderBySortOrderAsc();

    /** Row lock for applying an accepted suggestion (read, compare, write). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Experience e where e.id = :id")
    Optional<Experience> findByIdForUpdate(@Param("id") Long id);
}
