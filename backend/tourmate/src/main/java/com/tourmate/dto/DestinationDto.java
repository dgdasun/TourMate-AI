package com.tourmate.dto;

import com.tourmate.entity.Destination;
import com.tourmate.enums.Category;
import com.tourmate.enums.ClimateZone;

import java.time.Month;
import java.time.format.TextStyle;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.IntStream;

public record DestinationDto(
        Long id,
        String name,
        String province,
        Category category,
        ClimateZone climateZone,
        String description,
        double latitude,
        double longitude,
        double entryFeeUsd,
        double avgVisitHours,
        int dailyCapacity,
        int ecoScore,
        List<String> tags,
        double weatherScore,
        List<String> bestMonths) {

    private static final double GOOD_WEATHER = 0.85;

    /** @param month month (1..12) the weather score refers to */
    public static DestinationDto from(Destination d, int month) {
        List<String> best = IntStream.rangeClosed(1, 12)
                .filter(m -> d.getClimateZone().suitability(m) >= GOOD_WEATHER)
                .mapToObj(m -> Month.of(m).getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                .toList();
        List<String> tags = d.getTags() == null || d.getTags().isBlank()
                ? List.of()
                : Arrays.stream(d.getTags().split(",")).map(String::trim).toList();
        return new DestinationDto(d.getId(), d.getName(), d.getProvince(), d.getCategory(), d.getClimateZone(),
                d.getDescription(), d.getLatitude(), d.getLongitude(), d.getEntryFeeUsd(), d.getAvgVisitHours(),
                d.getDailyCapacity(), d.getEcoScore(), tags, d.getClimateZone().suitability(month), best);
    }
}
