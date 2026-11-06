package com.tourmate.dto;

import com.tourmate.enums.Category;

import java.util.List;

public record PlanResponse(
        int days,
        String month,
        int travellers,
        String transport,
        List<DayPlan> itinerary,
        CostBreakdown cost,
        double totalDistanceKm,
        double carbonKg,
        double carbonSavedVsCarKg,
        List<String> ecoTips,
        String aiSummary,
        boolean aiPowered) {

    public record DayPlan(int day, String baseTown, List<Stop> stops, double travelKm, double travelHours) {
    }

    /**
     * @param matchScore   0..100, how well this stop fits the traveller
     * @param weatherScore 0..1 suitability of the weather in the travel month
     */
    public record Stop(Long destinationId, String name, Category category, String province,
                       int matchScore, double weatherScore, String expectedCrowd,
                       double entryFeeUsd, double visitHours, String reason) {
    }

    public record CostBreakdown(double accommodation, double food, double entryFees, double transport,
                                double total, double perPerson) {
    }
}
