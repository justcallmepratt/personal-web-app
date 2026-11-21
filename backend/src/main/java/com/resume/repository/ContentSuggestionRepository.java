package com.resume.repository;

import com.resume.model.ContentSuggestion;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ContentSuggestionRepository extends JpaRepository<ContentSuggestion, Long> {
    // Newest first; the id breaks ties between rows created in the same instant.
    List<ContentSuggestion> findTop200ByOrderByCreatedAtDescIdDesc();

    List<ContentSuggestion> findTop200ByStatusOrderByCreatedAtDescIdDesc(String status);

    List<ContentSuggestion> findByTargetTypeAndTargetIdAndFieldAndStatus(
            String targetType, Long targetId, String field, String status);

    /** Row lock, so two decisions on the same suggestion cannot both go through. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from ContentSuggestion s where s.id = :id")
    Optional<ContentSuggestion> findByIdForUpdate(@Param("id") Long id);
}
