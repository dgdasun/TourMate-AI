package com.tourmate.repository;

import com.tourmate.entity.TripPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TripPlanRepository extends JpaRepository<TripPlan, Long> {
    List<TripPlan> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<TripPlan> findByIdAndUserId(Long id, Long userId);
}
