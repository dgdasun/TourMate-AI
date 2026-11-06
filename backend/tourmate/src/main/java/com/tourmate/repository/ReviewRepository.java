package com.tourmate.repository;

import com.tourmate.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByDestinationIdOrderByCreatedAtDesc(Long destinationId);

    List<Review> findTop20ByOrderByCreatedAtDesc();

    void deleteByDestinationId(Long destinationId);
}
