package com.tourmate.repository;

import com.tourmate.entity.TripPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TripPlanRepository extends JpaRepository<TripPlan, Long> {
    List<TripPlan> findTop10ByOrderByCreatedAtDesc();
}
