package com.tourmate.enums;

/** Cost per km (USD, per traveller group) and emissions per km (kg CO2e, per traveller). */
public enum TransportMode {
    CAR("Private car / taxi", 0.35, 0.171, 45),
    EV("Electric vehicle", 0.25, 0.047, 45),
    TUK_TUK("Tuk-tuk", 0.30, 0.100, 30),
    BUS("Public bus", 0.02, 0.027, 30),
    TRAIN("Train", 0.03, 0.035, 35);

    private final String label;
    private final double costPerKm;
    private final double co2PerKm;
    private final double avgSpeedKmh;

    TransportMode(String label, double costPerKm, double co2PerKm, double avgSpeedKmh) {
        this.label = label;
        this.costPerKm = costPerKm;
        this.co2PerKm = co2PerKm;
        this.avgSpeedKmh = avgSpeedKmh;
    }

    public String label() { return label; }
    public double costPerKm() { return costPerKm; }
    public double co2PerKm() { return co2PerKm; }
    public double avgSpeedKmh() { return avgSpeedKmh; }
}
