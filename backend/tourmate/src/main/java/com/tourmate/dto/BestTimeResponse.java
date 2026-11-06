package com.tourmate.dto;

import java.util.List;

public record BestTimeResponse(Long destinationId, String destinationName, String date, int hourlyCapacity,
                               List<HourSlot> hours, int bestHour, String advice) {

    public record HourSlot(int hour, int expectedVisitors, double occupancy, String level) {
    }
}
