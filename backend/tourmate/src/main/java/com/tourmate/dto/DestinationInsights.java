package com.tourmate.dto;

import java.util.List;
import java.util.Map;

/** What a destination manager needs at a glance: visitor sentiment and what people talk about. */
public record DestinationInsights(
        Long destinationId,
        String destinationName,
        int reviewCount,
        double avgRating,
        double avgSentiment,
        Map<String, Long> sentimentBreakdown,
        Map<String, Long> aspectMentions,
        Map<String, Long> negativeAspects,
        List<String> recommendations) {
}
