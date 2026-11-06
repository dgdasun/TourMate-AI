package com.tourmate.dto;

import java.util.List;

public record FootprintResponse(double distanceKm, int travellers, List<ModeFootprint> modes, String recommendation) {

    /** @param treesToOffset trees needed for one year to absorb this CO2 */
    public record ModeFootprint(String mode, String label, double co2Kg, double costUsd, double hours,
                                double treesToOffset) {
    }
}
