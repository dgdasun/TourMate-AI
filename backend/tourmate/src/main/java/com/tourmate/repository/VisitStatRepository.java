package com.tourmate.repository;

import com.tourmate.entity.VisitStat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VisitStatRepository extends JpaRepository<VisitStat, Long> {
    List<VisitStat> findByDestinationIdOrderByStatYearAscStatMonthAsc(Long destinationId);

    void deleteByDestinationId(Long destinationId);
}
