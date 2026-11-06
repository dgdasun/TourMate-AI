package com.tourmate.enums;

/** Typical per-person daily spend (USD) on accommodation and food. */
public enum BudgetLevel {
    BUDGET(25, 15),
    MID_RANGE(80, 35),
    LUXURY(250, 90);

    private final double accommodationPerNight;
    private final double foodPerDay;

    BudgetLevel(double accommodationPerNight, double foodPerDay) {
        this.accommodationPerNight = accommodationPerNight;
        this.foodPerDay = foodPerDay;
    }

    public double accommodationPerNight() { return accommodationPerNight; }
    public double foodPerDay() { return foodPerDay; }
}
