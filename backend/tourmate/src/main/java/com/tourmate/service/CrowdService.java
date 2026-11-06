package com.tourmate.service;

import com.tourmate.dto.BestTimeResponse;
import com.tourmate.dto.CrowdStatus;
import com.tourmate.entity.CheckIn;
import com.tourmate.entity.Destination;
import com.tourmate.exception.NotFoundException;
import com.tourmate.repository.CheckInRepository;
import com.tourmate.repository.DestinationRepository;
import com.tourmate.util.GeoUtil;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Visitor-flow management: estimates how crowded each destination is right now from the demand
 * forecast, a typical arrival-by-hour curve and live visitor check-ins, then points travellers to
 * the quietest hour or a similar, less crowded place nearby.
 */
@Service
public class CrowdService {

    private static final int OPEN_HOUR = 6;
    private static final int CLOSE_HOUR = 18;

    /** Share of a day's visitors present in each hour from 06:00 to 17:00 (sums to 1). */
    private static final double[] HOURLY_SHARE = {0.03, 0.05, 0.08, 0.11, 0.13, 0.12, 0.09, 0.08, 0.09, 0.10, 0.08, 0.04};

    /** Comfortable visitors in one hour, as a share of the daily capacity. */
    private static final double PEAK_HOUR_CAPACITY_SHARE = 0.10;

    private static final double ALTERNATIVE_RADIUS_KM = 150;

    private final DestinationRepository destinationRepository;
    private final CheckInRepository checkInRepository;
    private final ForecastService forecastService;

    public CrowdService(DestinationRepository destinationRepository, CheckInRepository checkInRepository,
                        ForecastService forecastService) {
        this.destinationRepository = destinationRepository;
        this.checkInRepository = checkInRepository;
        this.forecastService = forecastService;
    }

    public List<CrowdStatus> currentCrowds() {
        return crowdsAt(LocalDateTime.now());
    }

    /** Crowd estimate for any moment today, e.g. to preview how busy places will be this afternoon. */
    public List<CrowdStatus> crowdsAt(LocalDateTime now) {
        List<Destination> all = destinationRepository.findAll();
        Map<Long, Long> recentCheckIns = recentCheckIns(now.minusHours(2));

        Map<Long, CrowdStatus> raw = new HashMap<>();
        for (Destination d : all) {
            double expected = expectedVisitorsAt(d, now.toLocalDate(), now.getHour());
            // live check-ins over the last two hours nudge the model towards what is really happening
            double live = recentCheckIns.getOrDefault(d.getId(), 0L) / 2.0;
            int visitors = (int) Math.round(expected + live);
            int capacity = hourlyCapacity(d);
            double occupancy = isOpen(now.getHour()) ? (double) visitors / capacity : 0;
            raw.put(d.getId(), new CrowdStatus(d.getId(), d.getName(), d.getCategory(), d.getProvince(),
                    isOpen(now.getHour()) ? visitors : 0, capacity, GeoUtil.round(occupancy, 2),
                    level(occupancy, now.getHour()), null, null));
        }

        List<CrowdStatus> result = new ArrayList<>();
        for (Destination d : all) {
            CrowdStatus status = raw.get(d.getId());
            Destination alternative = status.occupancy() >= 0.7 ? findAlternative(d, all, raw) : null;
            result.add(alternative == null ? status : new CrowdStatus(status.destinationId(), status.name(),
                    status.category(), status.province(), status.estimatedVisitorsNow(), status.hourlyCapacity(),
                    status.occupancy(), status.level(), alternative.getId(), alternative.getName()));
        }
        result.sort(Comparator.comparingDouble(CrowdStatus::occupancy).reversed());
        return result;
    }

    public BestTimeResponse bestTime(Long destinationId, LocalDate date) {
        Destination d = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new NotFoundException("Destination " + destinationId + " not found"));
        int capacity = hourlyCapacity(d);

        List<BestTimeResponse.HourSlot> slots = new ArrayList<>();
        int bestHour = OPEN_HOUR;
        double best = Double.MAX_VALUE;
        for (int hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
            double visitors = expectedVisitorsAt(d, date, hour);
            double occupancy = visitors / capacity;
            slots.add(new BestTimeResponse.HourSlot(hour, (int) Math.round(visitors), GeoUtil.round(occupancy, 2),
                    level(occupancy, hour)));
            // ignore the first and last hour: technically quiet, but often not a great visit
            if (hour > OPEN_HOUR && hour < CLOSE_HOUR - 1 && occupancy < best) {
                best = occupancy;
                bestHour = hour;
            }
        }

        double peak = slots.stream().mapToDouble(BestTimeResponse.HourSlot::occupancy).max().orElse(0);
        String advice = String.format("Arrive around %02d:00 for the calmest visit. Avoid 09:00-12:00 when %s is %s.",
                bestHour, d.getName(), peak >= 1 ? "usually over capacity" : "at its busiest");
        if (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            advice += " Weekends are ~25% busier - a weekday visit is quieter.";
        }
        return new BestTimeResponse(d.getId(), d.getName(), date.toString(), capacity, slots, bestHour, advice);
    }

    /** Expected crowd level for a whole day in a given month, used by the trip planner. */
    public String expectedDailyLevel(Destination d, YearMonth ym) {
        double daily = forecastService.expectedMonthlyVisitors(d, ym) / ym.lengthOfMonth();
        double ratio = daily / d.getDailyCapacity();
        return ratio < 0.5 ? "LOW" : ratio < 0.8 ? "MODERATE" : ratio < 1.0 ? "HIGH" : "VERY_HIGH";
    }

    public void checkIn(Long destinationId, int groupSize) {
        Destination d = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new NotFoundException("Destination " + destinationId + " not found"));
        checkInRepository.save(new CheckIn(d, Math.max(1, Math.min(groupSize, 50))));
    }

    private double expectedVisitorsAt(Destination d, LocalDate date, int hour) {
        if (!isOpen(hour)) {
            return 0;
        }
        YearMonth ym = YearMonth.from(date);
        double daily = forecastService.expectedMonthlyVisitors(d, ym) / ym.lengthOfMonth();
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            daily *= 1.25;
        }
        return daily * HOURLY_SHARE[hour - OPEN_HOUR];
    }

    private Destination findAlternative(Destination crowded, List<Destination> all, Map<Long, CrowdStatus> status) {
        return all.stream()
                .filter(d -> !d.getId().equals(crowded.getId()))
                .filter(d -> d.getCategory() == crowded.getCategory())
                // noticeably quieter right now, not just quiet in absolute terms
                .filter(d -> status.get(d.getId()).occupancy() <= status.get(crowded.getId()).occupancy() - 0.2)
                .filter(d -> GeoUtil.roadKm(crowded, d) <= ALTERNATIVE_RADIUS_KM)
                .min(Comparator.comparingDouble(d -> status.get(d.getId()).occupancy()))
                .orElse(null);
    }

    private Map<Long, Long> recentCheckIns(LocalDateTime since) {
        Map<Long, Long> result = new HashMap<>();
        for (Object[] row : checkInRepository.sumVisitorsSince(since)) {
            result.put((Long) row[0], ((Number) row[1]).longValue());
        }
        return result;
    }

    private static int hourlyCapacity(Destination d) {
        return Math.max(1, (int) Math.round(d.getDailyCapacity() * PEAK_HOUR_CAPACITY_SHARE));
    }

    private static boolean isOpen(int hour) {
        return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
    }

    private static String level(double occupancy, int hour) {
        if (!isOpen(hour)) {
            return "CLOSED";
        }
        return occupancy < 0.4 ? "LOW" : occupancy < 0.7 ? "MODERATE" : occupancy < 1.0 ? "HIGH" : "VERY_HIGH";
    }
}
