package com.tourmate.repository;

import com.tourmate.entity.TripStop;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripStopRepository extends JpaRepository<TripStop, Long> {
    void deleteByDestinationId(Long destinationId);
}
