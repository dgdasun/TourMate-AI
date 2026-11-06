package com.tourmate.dto;

import com.tourmate.enums.Category;
import com.tourmate.enums.ClimateZone;
import jakarta.validation.constraints.*;

public record DestinationRequest(
        @NotBlank String name,
        @NotBlank String province,
        @NotNull Category category,
        @NotNull ClimateZone climateZone,
        @Size(max = 1000) String description,
        @DecimalMin("5.5") @DecimalMax("10.0") double latitude,
        @DecimalMin("79.5") @DecimalMax("82.0") double longitude,
        @PositiveOrZero double entryFeeUsd,
        @Positive double avgVisitHours,
        @Positive int dailyCapacity,
        @Min(1) @Max(5) int ecoScore,
        String tags) {
}
