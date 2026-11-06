package com.tourmate.util;

import com.tourmate.entity.Destination;

public final class GeoUtil {

    private static final double EARTH_RADIUS_KM = 6371.0;

    /** Sri Lankan roads wind around hills and coasts; straight-line distance under-estimates by ~35%. */
    private static final double ROAD_FACTOR = 1.35;

    private GeoUtil() {
    }

    public static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public static double roadKm(double lat1, double lon1, double lat2, double lon2) {
        return haversineKm(lat1, lon1, lat2, lon2) * ROAD_FACTOR;
    }

    public static double roadKm(Destination a, Destination b) {
        return roadKm(a.getLatitude(), a.getLongitude(), b.getLatitude(), b.getLongitude());
    }

    public static double round(double value, int places) {
        double scale = Math.pow(10, places);
        return Math.round(value * scale) / scale;
    }
}
