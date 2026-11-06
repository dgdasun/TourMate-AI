package com.tourmate.dto;

import java.util.List;
import java.util.Map;

public record OverviewResponse(
        long totalDestinations,
        long totalReviews,
        double avgRating,
        double avgSentiment,
        long tripsPlanned,
        long checkInsToday,
        boolean aiEnabled,
        Map<String, Long> destinationsByCategory,
        Map<String, Long> sentimentBreakdown,
        Map<String, Long> popularInterests,
        List<NationalPoint> nationalTrend,
        List<CrowdStatus> busiestNow,
        List<ReviewDto> recentReviews) {

    /** Total visitors across all destinations for a month: actual for history, forecast for the future. */
    public record NationalPoint(String period, Integer actual, Integer forecast) {
    }
}
