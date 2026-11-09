package com.tourmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A trip the traveller chose to save - built by hand or started from an AI suggestion and then edited.
 * The summary columns (destinations, cost, carbon) are recalculated on every save and feed the analytics.
 */
@Entity
@Table(name = "trip_plans")
@Getter
@Setter
@NoArgsConstructor
public class TripPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Who owns the trip; null for trips planned before accounts existed. */
    private Long userId;

    private String title;

    @Column(length = 2000)
    private String notes;

    private int days;
    private int travelMonth;
    private Integer travellers;
    private String interests;
    private String budget;
    private String transport;

    /** Comma separated stop names in visiting order, for lists and analytics. */
    @Column(length = 2000)
    private String destinations;

    private double totalCostUsd;
    private double carbonKg;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayNumber ASC, position ASC")
    private List<TripStop> stops = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;
}
