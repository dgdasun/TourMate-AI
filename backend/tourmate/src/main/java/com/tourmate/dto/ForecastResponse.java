package com.tourmate.dto;

import java.util.List;

/**
 * @param growthRatePct annual underlying growth after removing seasonality
 * @param mapePct       mean absolute percentage error of the model on the history (lower is better)
 */
public record ForecastResponse(
        Long destinationId,
        String destinationName,
        List<Point> points,
        double growthRatePct,
        double mapePct,
        String peakMonth,
        String quietMonth,
        String insight) {

    /** One month: {@code actual} is set for history, {@code forecast} for future months. */
    public record Point(String period, int year, int month, Integer actual, Integer fitted, Integer forecast) {
    }
}
