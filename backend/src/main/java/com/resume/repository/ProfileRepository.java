package com.resume.repository;

import com.resume.model.Profile;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    /** Row lock for applying an accepted suggestion (read, compare, write). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Profile p where p.id = :id")
    Optional<Profile> findByIdForUpdate(@Param("id") Long id);
}
