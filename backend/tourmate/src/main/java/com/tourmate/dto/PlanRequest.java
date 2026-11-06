package com.tourmate.dto;

import com.tourmate.enums.BudgetLevel;
import com.tourmate.enums.Category;
import com.tourmate.enums.TransportMode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.List;

/**
 * @param month      travel month 1..12 (defaults to the current month)
 * @param pace       RELAXED (1 stop/day), BALANCED (2) or PACKED (3)
 * @param travellers number of people travelling together
 */
public record PlanRequest(
        @Min(1) @Max(14) int days,
        @Min(1) @Max(12) Integer month,
        List<Category> interests,
        BudgetLevel budget,
        TransportMode transport,
        String pace,
        @Min(1) @Max(20) Integer travellers) {
}
