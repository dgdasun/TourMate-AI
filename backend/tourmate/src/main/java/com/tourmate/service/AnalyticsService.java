package com.tourmate.service;

import com.tourmate.dto.FootprintResponse;
import com.tourmate.dto.OverviewResponse;
import com.tourmate.dto.ReviewDto;
import com.tourmate.entity.Destination;
import com.tourmate.entity.Review;
import com.tourmate.entity.TripPlan;
import com.tourmate.entity.VisitStat;
import com.tourmate.enums.TransportMode;
import com.tourmate.repository.CheckInRepository;
import com.tourmate.repository.DestinationRepository;
import com.tourmate.repository.ReviewRepository;
import com.tourmate.repository.TripPlanRepository;
import com.tourmate.repository.VisitStatRepository;
import com.tourmate.util.GeoUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    /** A mature tree absorbs roughly 21 kg of CO2 per year. */
    private static final double KG_CO2_PER_TREE_YEAR = 21.0;

    private final DestinationRepository destinationRepository;
    private final ReviewRepository reviewRepository;
    private final TripPlanRepository tripPlanRepository;
    private final CheckInRepository checkInRepository;
    private final VisitStatRepository visitStatRepository;
    private final ForecastService forecastService;
    private final CrowdService crowdService;
    private final AiService aiService;

    public AnalyticsService(DestinationRepository destinationRepository, ReviewRepository reviewRepository,
                            TripPlanRepository tripPlanRepository, CheckInRepository checkInRepository,
                            VisitStatRepository visitStatRepository, ForecastService forecastService,
                            CrowdService crowdService, AiService aiService) {
        this.destinationRepository = destinationRepository;
        this.reviewRepository = reviewRepository;
        this.tripPlanRepository = tripPlanRepository;
        this.checkInRepository = checkInRepository;
        this.visitStatRepository = visitStatRepository;
        this.forecastService = forecastService;
        this.crowdService = crowdService;
        this.aiService = aiService;
    }

    public OverviewResponse overview() {
        List<Destination> destinations = destinationRepository.findAll();
        List<Review> reviews = reviewRepository.findAll();
        List<TripPlan> plans = tripPlanRepository.findAll();

        Map<String, Long> byCategory = destinations.stream()
                .collect(Collectors.groupingBy(d -> d.getCategory().name(), TreeMap::new, Collectors.counting()));
        Map<String, Long> sentiment = new LinkedHashMap<>();
        for (String label : List.of("POSITIVE", "NEUTRAL", "NEGATIVE")) {
            sentiment.put(label, reviews.stream().filter(r -> label.equals(r.getSentimentLabel())).count());
        }
        Map<String, Long> interests = plans.stream()
                .filter(p -> p.getInterests() != null && !p.getInterests().isBlank())
                .flatMap(p -> Arrays.stream(p.getInterests().split(",")))
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));

        List<ReviewDto> recent = reviewRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .limit(5).map(ReviewDto::from).toList();

        return new OverviewResponse(
                destinations.size(),
                reviews.size(),
                GeoUtil.round(reviews.stream().mapToInt(Review::getRating).average().orElse(0), 2),
                GeoUtil.round(reviews.stream().mapToDouble(Review::getSentimentScore).average().orElse(0), 2),
                plans.size(),
                checkInRepository.countByCreatedAtAfter(LocalDate.now().atStartOfDay()),
                aiService.isEnabled(),
                byCategory,
                sentiment,
                interests,
                nationalTrend(destinations),
                crowdService.currentCrowds().stream().limit(5).toList(),
                recent);
    }

    /** Last 12 months of actual visitors across all destinations, then 6 months of forecast. */
    private List<OverviewResponse.NationalPoint> nationalTrend(List<Destination> destinations) {
        Map<YearMonth, Integer> actual = new TreeMap<>();
        for (VisitStat s : visitStatRepository.findAll()) {
            actual.merge(YearMonth.of(s.getStatYear(), s.getStatMonth()), s.getVisitors(), Integer::sum);
        }
        List<OverviewResponse.NationalPoint> points = new ArrayList<>();
        if (actual.isEmpty()) {
            return points;
        }
        YearMonth last = actual.keySet().stream().max(Comparator.naturalOrder()).orElseThrow();
        for (YearMonth ym = last.minusMonths(11); !ym.isAfter(last); ym = ym.plusMonths(1)) {
            points.add(new OverviewResponse.NationalPoint(ForecastService.period(ym.getYear(), ym.getMonthValue()),
                    actual.get(ym), null));
        }
        for (int i = 1; i <= 6; i++) {
            YearMonth ym = last.plusMonths(i);
            double total = destinations.stream().mapToDouble(d -> forecastService.expectedMonthlyVisitors(d, ym)).sum();
            points.add(new OverviewResponse.NationalPoint(ForecastService.period(ym.getYear(), ym.getMonthValue()),
                    null, (int) Math.round(total)));
        }
        return points;
    }

    public FootprintResponse footprint(double distanceKm, int travellers) {
        if (distanceKm <= 0 || distanceKm > 5000) {
            throw new IllegalArgumentException("distanceKm must be between 0 and 5000");
        }
        int people = Math.max(1, Math.min(travellers, 50));
        List<FootprintResponse.ModeFootprint> modes = new ArrayList<>();
        for (TransportMode mode : TransportMode.values()) {
            double co2 = PlannerService.carbonKg(mode, distanceKm, people);
            boolean perVehicle = mode == TransportMode.CAR || mode == TransportMode.EV || mode == TransportMode.TUK_TUK;
            int vehicles = mode == TransportMode.TUK_TUK ? (people + 2) / 3 : (people + 3) / 4;
            double cost = distanceKm * mode.costPerKm() * (perVehicle ? vehicles : people);
            modes.add(new FootprintResponse.ModeFootprint(mode.name(), mode.label(), GeoUtil.round(co2, 1),
                    GeoUtil.round(cost, 1), GeoUtil.round(distanceKm / mode.avgSpeedKmh(), 1),
                    GeoUtil.round(co2 / KG_CO2_PER_TREE_YEAR, 1)));
        }
        modes.sort(Comparator.comparingDouble(FootprintResponse.ModeFootprint::co2Kg));
        FootprintResponse.ModeFootprint best = modes.get(0);
        FootprintResponse.ModeFootprint car = modes.stream().filter(m -> m.mode().equals("CAR")).findFirst().orElseThrow();
        String recommendation = String.format("Choosing the %s instead of a private car saves %.1f kg CO2 - "
                        + "about what %.1f trees absorb in a year.", best.label().toLowerCase(),
                car.co2Kg() - best.co2Kg(), (car.co2Kg() - best.co2Kg()) / KG_CO2_PER_TREE_YEAR);
        return new FootprintResponse(distanceKm, people, modes, recommendation);
    }
}
