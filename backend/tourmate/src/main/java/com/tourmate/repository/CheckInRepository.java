package com.tourmate.repository;

import com.tourmate.entity.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface CheckInRepository extends JpaRepository<CheckIn, Long> {

    /** Rows of [destinationId, visitorCount] for check-ins since the given time. */
    @Query("select c.destination.id, sum(c.groupSize) from CheckIn c where c.createdAt >= :since group by c.destination.id")
    List<Object[]> sumVisitorsSince(LocalDateTime since);

    long countByCreatedAtAfter(LocalDateTime since);

    void deleteByDestinationId(Long destinationId);
}
