package com.tourmate.dto;

import com.tourmate.enums.Category;

/**
 * @param occupancy estimated visitors now divided by the comfortable hourly capacity
 * @param level     LOW, MODERATE, HIGH, VERY_HIGH or CLOSED
 */
public record CrowdStatus(
        Long destinationId,
        String name,
        Category category,
        String province,
        int estimatedVisitorsNow,
        int hourlyCapacity,
        double occupancy,
        String level,
        Long alternativeId,
        String alternativeName) {
}
