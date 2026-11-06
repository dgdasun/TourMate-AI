package com.tourmate.service;

import com.tourmate.dto.PlanRequest;
import com.tourmate.dto.PlanResponse;
import com.tourmate.dto.PlanResponse.CostBreakdown;
import com.tourmate.dto.PlanResponse.DayPlan;
import com.tourmate.dto.PlanResponse.Stop;
import com.tourmate.entity.Destination;
import com.tourmate.entity.TripPlan;
import com.tourmate.enums.BudgetLevel;
import com.tourmate.enums.Category;
import com.tourmate.enums.TransportMode;
import com.tourmate.repository.DestinationRepository;
import com.tourmate.repository.TripPlanRepository;
import com.tourmate.util.GeoUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Personalised itinerary generation. Every destination gets a match score from the traveller's
 * interests, the monsoon-aware weather for their travel month, the expected crowd level and its
 * sustainability rating. A greedy route builder then picks the best next stop while penalising
 * long drives, which keeps the route geographically sensible.
 */
@Service
public class PlannerService {

    /** Most visitors arrive at Bandaranaike International Airport, near Colombo. */
    private static final double START_LAT = 7.1808;
    private static final double START_LON = 79.8841;

    /** Each 100 km of driving costs a candidate this many score points (out of 1). */
    private static final double DISTANCE_PENALTY_PER_100KM = 0.22;

    private static final Set<TransportMode> PRIVATE_VEHICLES = EnumSet.of(TransportMode.CAR, TransportMode.EV, TransportMode.TUK_TUK);

    private final DestinationRepository destinationRepository;
    private final TripPlanRepository tripPlanRepository;
    private final CrowdService crowdService;
    private final AiService aiService;

    public PlannerService(DestinationRepository destinationRepository, TripPlanRepository tripPlanRepository,
                          CrowdService crowdService, AiService aiService) {
        this.destinationRepository = destinationRepository;
        this.tripPlanRepository = tripPlanRepository;
        this.crowdService = crowdService;
        this.aiService = aiService;
    }

    public PlanResponse plan(PlanRequest req) {
        int month = req.month() != null ? req.month() : LocalDate.now().getMonthValue();
        Set<Category> interests = req.interests() == null || req.interests().isEmpty()
                ? EnumSet.allOf(Category.class) : EnumSet.copyOf(req.interests());
        BudgetLevel budget = req.budget() != null ? req.budget() : BudgetLevel.MID_RANGE;
        TransportMode transport = req.transport() != null ? req.transport() : TransportMode.CAR;
        int travellers = req.travellers() != null ? req.travellers() : 2;
        int stopsPerDay = switch (req.pace() == null ? "BALANCED" : req.pace().toUpperCase(Locale.ROOT)) {
            case "RELAXED" -> 1;
            case "PACKED" -> 3;
            default -> 2;
        };
        YearMonth travelMonth = nextOccurrence(month);

        // score every destination once
        Map<Long, Double> scores = new HashMap<>();
        Map<Long, String> crowd = new HashMap<>();
        List<Destination> candidates = new ArrayList<>(destinationRepository.findAll());
        for (Destination d : candidates) {
            String level = crowdService.expectedDailyLevel(d, travelMonth);
            crowd.put(d.getId(), level);
            scores.put(d.getId(), score(d, interests, month, level));
        }

        // greedy route: best score minus distance penalty from where we are now
        int wanted = Math.min(req.days() * stopsPerDay, candidates.size());
        List<Destination> route = new ArrayList<>();
        double lat = START_LAT;
        double lon = START_LON;
        while (route.size() < wanted && !candidates.isEmpty()) {
            final double fromLat = lat;
            final double fromLon = lon;
            Destination next = candidates.stream()
                    .max(Comparator.comparingDouble(d -> scores.get(d.getId())
                            - GeoUtil.roadKm(fromLat, fromLon, d.getLatitude(), d.getLongitude()) / 100 * DISTANCE_PENALTY_PER_100KM))
                    .orElseThrow();
            route.add(next);
            candidates.remove(next);
            lat = next.getLatitude();
            lon = next.getLongitude();
        }

        // split the route into days
        List<DayPlan> days = new ArrayList<>();
        double totalKm = 0;
        double entryFees = 0;
        lat = START_LAT;
        lon = START_LON;
        for (int day = 0; day < req.days(); day++) {
            int from = Math.min(day * stopsPerDay, route.size());
            int to = Math.min(from + stopsPerDay, route.size());
            List<Stop> stops = new ArrayList<>();
            double dayKm = 0;
            for (Destination d : route.subList(from, to)) {
                dayKm += GeoUtil.roadKm(lat, lon, d.getLatitude(), d.getLongitude());
                lat = d.getLatitude();
                lon = d.getLongitude();
                entryFees += d.getEntryFeeUsd();
                stops.add(new Stop(d.getId(), d.getName(), d.getCategory(), d.getProvince(),
                        (int) Math.round(scores.get(d.getId()) * 100), d.getClimateZone().suitability(month),
                        crowd.get(d.getId()), d.getEntryFeeUsd(), d.getAvgVisitHours(),
                        reason(d, interests, month, crowd.get(d.getId()))));
            }
            if (day == req.days() - 1) {
                dayKm += GeoUtil.roadKm(lat, lon, START_LAT, START_LON); // back to the airport
            }
            String base = stops.isEmpty() ? (day == req.days() - 1 ? "Departure" : "Free day") : stops.get(stops.size() - 1).name();
            days.add(new DayPlan(day + 1, base, stops, GeoUtil.round(dayKm, 0),
                    GeoUtil.round(dayKm / transport.avgSpeedKmh(), 1)));
            totalKm += dayKm;
        }

        CostBreakdown cost = cost(req.days(), travellers, budget, transport, totalKm, entryFees);
        double carbon = carbonKg(transport, totalKm, travellers);
        double carCarbon = carbonKg(TransportMode.CAR, totalKm, travellers);

        String monthName = ForecastService.monthName(month);
        PlanResponse draft = new PlanResponse(req.days(), monthName, travellers, transport.label(), days, cost,
                GeoUtil.round(totalKm, 0), GeoUtil.round(carbon, 1), GeoUtil.round(Math.max(0, carCarbon - carbon), 1),
                ecoTips(transport, route, month), null, false);

        String aiSummary = aiService.complete(
                        "You are TourMate AI, a friendly Sri Lanka travel expert. Write in plain text, no markdown headings.",
                        List.of(), summaryPrompt(draft, budget))
                .orElse(null);

        save(req, month, interests, budget, transport, route, cost, carbon);

        return new PlanResponse(draft.days(), draft.month(), draft.travellers(), draft.transport(), draft.itinerary(),
                draft.cost(), draft.totalDistanceKm(), draft.carbonKg(), draft.carbonSavedVsCarKg(), draft.ecoTips(),
                aiSummary != null ? aiSummary : offlineSummary(draft, route), aiSummary != null);
    }

    private static double score(Destination d, Set<Category> interests, int month, String crowdLevel) {
        double interest = interests.contains(d.getCategory()) ? 1.0 : 0.25;
        double weather = d.getClimateZone().suitability(month);
        double crowdComfort = switch (crowdLevel) {
            case "LOW" -> 1.0;
            case "MODERATE" -> 0.8;
            case "HIGH" -> 0.5;
            default -> 0.3;
        };
        return 0.45 * interest + 0.30 * weather + 0.15 * crowdComfort + 0.10 * d.getEcoScore() / 5.0;
    }

    private static String reason(Destination d, Set<Category> interests, int month, String crowdLevel) {
        List<String> parts = new ArrayList<>();
        if (interests.contains(d.getCategory())) {
            parts.add("matches your interest in " + pretty(d.getCategory()));
        }
        double weather = d.getClimateZone().suitability(month);
        parts.add(weather >= 0.85 ? "great weather in " + ForecastService.monthName(month)
                : weather >= 0.6 ? "fair weather, some showers possible" : "monsoon season - pack rain gear");
        parts.add(switch (crowdLevel) {
            case "LOW" -> "low crowds expected";
            case "MODERATE" -> "moderate crowds";
            default -> "busy season - go early";
        });
        if (d.getEcoScore() >= 4) {
            parts.add("eco-friendly choice");
        }
        String text = String.join(", ", parts);
        return Character.toUpperCase(text.charAt(0)) + text.substring(1);
    }

    private static CostBreakdown cost(int days, int travellers, BudgetLevel budget, TransportMode transport,
                                      double km, double entryFeesPerPerson) {
        int rooms = (travellers + 1) / 2;
        int nights = Math.max(0, days - 1);
        double accommodation = nights * rooms * budget.accommodationPerNight();
        double food = days * travellers * budget.foodPerDay();
        double entry = entryFeesPerPerson * travellers;
        double transportCost = PRIVATE_VEHICLES.contains(transport)
                ? km * transport.costPerKm() * vehicles(transport, travellers)
                : km * transport.costPerKm() * travellers;
        double total = accommodation + food + entry + transportCost;
        return new CostBreakdown(GeoUtil.round(accommodation, 0), GeoUtil.round(food, 0), GeoUtil.round(entry, 0),
                GeoUtil.round(transportCost, 0), GeoUtil.round(total, 0), GeoUtil.round(total / travellers, 0));
    }

    /** CO2 for the trip: private vehicles are counted per vehicle, public transport per passenger. */
    static double carbonKg(TransportMode transport, double km, int travellers) {
        return PRIVATE_VEHICLES.contains(transport)
                ? km * transport.co2PerKm() * vehicles(transport, travellers)
                : km * transport.co2PerKm() * travellers;
    }

    private static int vehicles(TransportMode transport, int travellers) {
        int seats = transport == TransportMode.TUK_TUK ? 3 : 4;
        return (travellers + seats - 1) / seats;
    }

    private static List<String> ecoTips(TransportMode transport, List<Destination> route, int month) {
        List<String> tips = new ArrayList<>();
        if (transport == TransportMode.CAR) {
            tips.add("Switching to the train for the Kandy-Ella stretch is one of the world's most scenic rides and cuts emissions by ~80%.");
        }
        if (route.stream().anyMatch(d -> d.getCategory() == Category.WILDLIFE)) {
            tips.add("Choose safari operators that keep a respectful distance from animals and limit jeeps per sighting.");
        }
        if (route.stream().anyMatch(d -> d.getCategory() == Category.BEACH)) {
            tips.add("Use reef-safe sunscreen and pick whale-watching operators that follow the Department of Wildlife guidelines.");
        }
        tips.add("Carry a refillable bottle - many guesthouses offer filtered water, reducing plastic waste.");
        tips.add("Eat at locally owned restaurants and buy crafts directly from artisans so tourism income stays in the community.");
        if (month >= 5 && month <= 9) {
            tips.add("May-September is the off-season on the south-west coast: fewer crowds and lower prices if you head east instead.");
        }
        return tips;
    }

    private static String summaryPrompt(PlanResponse plan, BudgetLevel budget) {
        String stops = plan.itinerary().stream()
                .map(d -> "Day " + d.day() + ": " + (d.stops().isEmpty() ? "rest / travel"
                        : d.stops().stream().map(Stop::name).collect(Collectors.joining(", "))))
                .collect(Collectors.joining("\n"));
        return String.format(Locale.ENGLISH, """
                Here is a %d-day Sri Lanka itinerary for %d traveller(s) in %s, travelling by %s on a %s budget:
                %s

                Write a warm, practical overview in about 120 words: what makes this route special, then 3 short
                local tips (etiquette, food to try, or timing) specific to these places and this month.
                """, plan.days(), plan.travellers(), plan.month(), plan.transport(),
                budget.name().toLowerCase(Locale.ROOT).replace('_', '-'), stops);
    }

    private static String offlineSummary(PlanResponse plan, List<Destination> route) {
        Map<Category, Long> mix = route.stream().collect(Collectors.groupingBy(Destination::getCategory, Collectors.counting()));
        String highlights = mix.entrySet().stream()
                .sorted(Map.Entry.<Category, Long>comparingByValue().reversed())
                .limit(3)
                .map(e -> pretty(e.getKey()))
                .collect(Collectors.joining(", "));
        return String.format(Locale.ENGLISH,
                "Your %d-day journey covers %d places with a focus on %s, travelling about %.0f km by %s. "
                        + "Stops were chosen for good %s weather and manageable crowds, and ordered to minimise driving. "
                        + "Start early each day - most sites are quietest before 09:00 and the light is beautiful. "
                        + "Dress modestly (shoulders and knees covered) at temples, and remove shoes and hats before entering.",
                plan.days(), route.size(), highlights.isEmpty() ? "relaxation" : highlights, plan.totalDistanceKm(),
                plan.transport().toLowerCase(Locale.ROOT), plan.month());
    }

    private void save(PlanRequest req, int month, Set<Category> interests, BudgetLevel budget, TransportMode transport,
                      List<Destination> route, CostBreakdown cost, double carbon) {
        TripPlan plan = new TripPlan();
        plan.setDays(req.days());
        plan.setTravelMonth(month);
        plan.setInterests(interests.stream().map(Enum::name).collect(Collectors.joining(",")));
        plan.setBudget(budget.name());
        plan.setTransport(transport.name());
        plan.setDestinations(route.stream().map(Destination::getName).collect(Collectors.joining(", ")));
        plan.setTotalCostUsd(cost.total());
        plan.setCarbonKg(GeoUtil.round(carbon, 1));
        tripPlanRepository.save(plan);
    }

    /** The next time this calendar month comes round (this month counts). */
    private static YearMonth nextOccurrence(int month) {
        YearMonth now = YearMonth.now();
        YearMonth candidate = YearMonth.of(now.getYear(), month);
        return candidate.isBefore(now) ? candidate.plusYears(1) : candidate;
    }

    static String pretty(Category category) {
        return category.name().replace('_', ' ').toLowerCase(Locale.ROOT);
    }
}
