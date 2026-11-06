package com.tourmate.dto;

import com.tourmate.entity.Review;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public record ReviewDto(
        Long id,
        Long destinationId,
        String destinationName,
        String visitorName,
        String country,
        int rating,
        String comment,
        double sentimentScore,
        String sentimentLabel,
        List<String> aspects,
        LocalDateTime createdAt) {

    public static ReviewDto from(Review r) {
        List<String> aspects = r.getAspects() == null || r.getAspects().isBlank()
                ? List.of()
                : Arrays.asList(r.getAspects().split(","));
        return new ReviewDto(r.getId(), r.getDestination().getId(), r.getDestination().getName(),
                r.getVisitorName(), r.getCountry(), r.getRating(), r.getComment(),
                r.getSentimentScore(), r.getSentimentLabel(), aspects, r.getCreatedAt());
    }
}
