package com.tourmate.enums;

/**
 * Sri Lanka has two monsoons that hit different coasts at different times of year,
 * so the best time to visit depends on the zone a destination sits in.
 * Each zone holds a weather-suitability score (0..1) for every month, Jan..Dec.
 */
public enum ClimateZone {
    // South-west monsoon (May-Sep) brings rain to the west and south coasts
    WEST_SOUTH(1.0, 1.0, 1.0, 0.9, 0.4, 0.3, 0.4, 0.5, 0.4, 0.5, 0.7, 0.95),
    // North-east monsoon (Nov-Feb) brings rain to the east coast
    EAST(0.4, 0.5, 0.7, 0.9, 1.0, 1.0, 1.0, 1.0, 0.95, 0.7, 0.3, 0.3),
    CULTURAL_TRIANGLE(0.85, 0.95, 0.95, 0.9, 0.85, 0.85, 0.9, 0.9, 0.85, 0.7, 0.6, 0.7),
    HILL_COUNTRY(1.0, 1.0, 0.95, 0.85, 0.6, 0.5, 0.55, 0.6, 0.6, 0.55, 0.6, 0.85),
    NORTH(0.8, 0.9, 0.95, 0.9, 0.9, 0.9, 0.95, 0.95, 0.9, 0.6, 0.4, 0.5);

    private final double[] monthly;

    ClimateZone(double... monthly) {
        this.monthly = monthly;
    }

    /** @param month 1..12 */
    public double suitability(int month) {
        return monthly[month - 1];
    }
}
