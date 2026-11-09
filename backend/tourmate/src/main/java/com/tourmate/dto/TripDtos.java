package com.tourmate.dto;

import com.tourmate.entity.TripPlan;
import com.tourmate.enums.BudgetLevel;
import com.tourmate.enums.Category;
import com.tourmate.enums.TransportMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Request and response bodies for building, evaluating and saving trips. */
public final class TripDtos {

    private TripDtos() {
    }

    public static final int MAX_DAYS = 21;
    public static final int MAX_STOPS_PER_DAY = 8;

    /** One place in the itinerary, with the traveller's optional note. */
    public record StopInput(@NotNull Long destinationId, @Size(max = 300) String note) {
    }

    /** An itinerary the traveller built or edited: stops per day, in visiting order. */
    public record EvaluateRequest(
            @NotNull @Size(min = 1, max = MAX_DAYS) List<@NotNull @Size(max = MAX_STOPS_PER_DAY) List<@NotNull Long>> days,
            @Min(1) @Max(12) Integer month,
            @Min(1) @Max(20) Integer travellers,
            BudgetLevel budget,
            TransportMode transport,
            List<Category> interests) {
    }

    public record TripRequest(
            @NotBlank @Size(max = 100) String title,
            @Size(max = 2000) String notes,
            @NotNull @Size(min = 1, max = MAX_DAYS) List<@NotNull @Size(max = MAX_STOPS_PER_DAY) List<@Valid @NotNull StopInput>> days,
            @NotNull @Min(1) @Max(12) Integer month,
            @NotNull @Min(1) @Max(20) Integer travellers,
            @NotNull BudgetLevel budget,
            @NotNull TransportMode transport,
            List<Category> interests) {

        public List<List<Long>> dayIds() {
            return days.stream().map(d -> d.stream().map(StopInput::destinationId).toList()).toList();
        }
    }

    public record TripSummary(Long id, String title, int days, int travelMonth, Integer travellers, String budget,
                              String transport, String destinations, double totalCostUsd, double carbonKg,
                              LocalDateTime createdAt, LocalDateTime updatedAt) {
        public static TripSummary from(TripPlan t) {
            return new TripSummary(t.getId(), t.getTitle() != null ? t.getTitle() : t.getDays() + "-day trip",
                    t.getDays(), t.getTravelMonth(), t.getTravellers(), t.getBudget(), t.getTransport(),
                    t.getDestinations(), t.getTotalCostUsd(), t.getCarbonKg(), t.getCreatedAt(), t.getUpdatedAt());
        }
    }

    /** Everything needed to reopen a saved trip in the editor. */
    public record TripDetail(Long id, String title, String notes, int month, int travellers, BudgetLevel budget,
                             TransportMode transport, List<String> interests, List<List<StopInput>> days,
                             LocalDateTime createdAt, LocalDateTime updatedAt) {
        public static TripDetail from(TripPlan t) {
            List<List<StopInput>> days = new ArrayList<>();
            for (int i = 0; i < t.getDays(); i++) {
                days.add(new ArrayList<>());
            }
            t.getStops().forEach(s -> days.get(s.getDayNumber() - 1).add(new StopInput(s.getDestination().getId(), s.getNote())));
            List<String> interests = t.getInterests() == null || t.getInterests().isBlank()
                    ? List.of() : List.of(t.getInterests().split(","));
            return new TripDetail(t.getId(), t.getTitle(), t.getNotes(), t.getTravelMonth(),
                    t.getTravellers() != null ? t.getTravellers() : 2,
                    t.getBudget() != null ? BudgetLevel.valueOf(t.getBudget()) : BudgetLevel.MID_RANGE,
                    t.getTransport() != null ? TransportMode.valueOf(t.getTransport()) : TransportMode.CAR,
                    interests, days, t.getCreatedAt(), t.getUpdatedAt());
        }
    }
}
