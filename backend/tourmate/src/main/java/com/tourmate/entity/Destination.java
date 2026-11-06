package com.tourmate.entity;

import com.tourmate.enums.Category;
import com.tourmate.enums.ClimateZone;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "destinations")
@Getter
@Setter
@NoArgsConstructor
public class Destination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String province;

    @Enumerated(EnumType.STRING)
    private Category category;

    @Enumerated(EnumType.STRING)
    private ClimateZone climateZone;

    @Column(length = 1000)
    private String description;

    private double latitude;
    private double longitude;

    /** Foreign-visitor entry fee in USD (0 if free). */
    private double entryFeeUsd;

    /** Typical hours a visitor spends here. */
    private double avgVisitHours;

    /** Comfortable number of visitors per day, used for crowd management. */
    private int dailyCapacity;

    /** 1 (low) .. 5 (excellent) sustainability rating. */
    private int ecoScore;

    /** Comma separated keywords, e.g. "surfing,whales". */
    private String tags;

    public Destination(String name, String province, Category category, ClimateZone climateZone,
                       String description, double latitude, double longitude, double entryFeeUsd,
                       double avgVisitHours, int dailyCapacity, int ecoScore, String tags) {
        this.name = name;
        this.province = province;
        this.category = category;
        this.climateZone = climateZone;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.entryFeeUsd = entryFeeUsd;
        this.avgVisitHours = avgVisitHours;
        this.dailyCapacity = dailyCapacity;
        this.ecoScore = ecoScore;
        this.tags = tags;
    }
}
