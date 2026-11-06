package com.tourmate.config;

import com.tourmate.entity.CheckIn;
import com.tourmate.entity.Destination;
import com.tourmate.entity.Review;
import com.tourmate.entity.VisitStat;
import com.tourmate.enums.Category;
import com.tourmate.repository.CheckInRepository;
import com.tourmate.repository.DestinationRepository;
import com.tourmate.repository.ReviewRepository;
import com.tourmate.repository.VisitStatRepository;
import com.tourmate.service.ReviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

import static com.tourmate.enums.Category.*;
import static com.tourmate.enums.ClimateZone.CULTURAL_TRIANGLE;
import static com.tourmate.enums.ClimateZone.EAST;
import static com.tourmate.enums.ClimateZone.HILL_COUNTRY;
import static com.tourmate.enums.ClimateZone.NORTH;
import static com.tourmate.enums.ClimateZone.WEST_SOUTH;

/**
 * Loads demo data on first start (only when the destinations table is empty): 24 real Sri Lankan
 * destinations, 36 months of visitor statistics for the forecasting model, and sample reviews.
 * Visitor numbers are synthetic but follow Sri Lanka's real arrival seasonality and monsoon pattern.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final int HISTORY_MONTHS = 36;
    private static final double ANNUAL_GROWTH = 1.12;
    /** Relative international arrivals per month, Jan..Dec (peak Dec-Mar, mini-peak Jul-Aug). */
    private static final double[] NATIONAL_SEASONALITY = {1.25, 1.2, 1.15, 0.95, 0.7, 0.7, 0.95, 1.05, 0.85, 0.85, 1.0, 1.35};

    /** Average demand as a share of daily capacity: famous hotspots overflow, remote places stay quiet. */
    private static final Map<String, Double> POPULARITY = Map.ofEntries(
            Map.entry("Sigiriya", 0.85), Map.entry("Temple", 0.8), Map.entry("Galle", 0.75), Map.entry("Ella", 0.85),
            Map.entry("Yala", 0.85), Map.entry("Mirissa", 0.75), Map.entry("Colombo", 0.6), Map.entry("Nuwara", 0.6),
            Map.entry("Dambulla", 0.65), Map.entry("Bentota", 0.55), Map.entry("Hikkaduwa", 0.6), Map.entry("Udawalawe", 0.55),
            Map.entry("Polonnaruwa", 0.5), Map.entry("Anuradhapura", 0.45), Map.entry("Horton", 0.6), Map.entry("Adam's", 0.5),
            Map.entry("Minneriya", 0.4), Map.entry("Trincomalee", 0.45), Map.entry("Arugam", 0.5), Map.entry("Pasikudah", 0.35),
            Map.entry("Sinharaja", 0.4), Map.entry("Kitulgala", 0.4), Map.entry("Jaffna", 0.3), Map.entry("Wilpattu", 0.3));

    private final DestinationRepository destinationRepository;
    private final VisitStatRepository visitStatRepository;
    private final ReviewRepository reviewRepository;
    private final CheckInRepository checkInRepository;
    private final ReviewService reviewService;

    public DataSeeder(DestinationRepository destinationRepository, VisitStatRepository visitStatRepository,
                      ReviewRepository reviewRepository, CheckInRepository checkInRepository,
                      ReviewService reviewService) {
        this.destinationRepository = destinationRepository;
        this.visitStatRepository = visitStatRepository;
        this.reviewRepository = reviewRepository;
        this.checkInRepository = checkInRepository;
        this.reviewService = reviewService;
    }

    @Override
    public void run(String... args) {
        if (destinationRepository.count() > 0) {
            return;
        }
        List<Destination> destinations = destinationRepository.saveAll(destinations());
        seedVisitHistory(destinations);
        seedReviews(destinations);
        seedCheckIns(destinations);
        log.info("Seeded {} destinations with visitor history and reviews", destinations.size());
    }

    private static List<Destination> destinations() {
        return List.of(
                new Destination("Sigiriya Rock Fortress", "Central", HERITAGE, CULTURAL_TRIANGLE,
                        "A 5th-century palace atop a 200 m rock, with famous frescoes, mirror wall and water gardens. UNESCO World Heritage Site.",
                        7.9570, 80.7603, 36, 4, 5000, 4, "unesco,climb,frescoes,views"),
                new Destination("Temple of the Tooth (Kandy)", "Central", CULTURAL, HILL_COUNTRY,
                        "Sri Dalada Maligawa houses the sacred tooth relic of the Buddha; the heart of Kandy and the Esala Perahera festival.",
                        7.2936, 80.6413, 10, 2, 6000, 4, "temple,buddhism,perahera,unesco"),
                new Destination("Galle Fort", "Southern", HERITAGE, WEST_SOUTH,
                        "A 17th-century Dutch fort with ramparts, lighthouse, boutique cafes and colonial streets. UNESCO World Heritage Site.",
                        6.0267, 80.2170, 0, 3, 7000, 4, "colonial,unesco,sunset,walking"),
                new Destination("Ella & Nine Arches Bridge", "Uva", Category.HILL_COUNTRY, HILL_COUNTRY,
                        "Misty hill town with the iconic Nine Arches railway bridge, Little Adam's Peak and Ravana Falls.",
                        6.8768, 81.0608, 0, 5, 4500, 4, "train,hiking,tea,bridge"),
                new Destination("Yala National Park", "Southern", WILDLIFE, WEST_SOUTH,
                        "Sri Lanka's most visited park, with one of the highest leopard densities in the world, plus elephants and sloth bears.",
                        6.3725, 81.5185, 25, 5, 2500, 3, "safari,leopard,elephant"),
                new Destination("Mirissa Beach", "Southern", BEACH, WEST_SOUTH,
                        "Palm-fringed crescent beach famous for blue whale watching, Coconut Tree Hill and laid-back sunsets.",
                        5.9483, 80.4716, 0, 4, 4000, 3, "whale,beach,sunset,surfing"),
                new Destination("Arugam Bay", "Eastern", BEACH, EAST,
                        "World-class surf point break on the east coast with a relaxed village vibe and nearby lagoons.",
                        6.8400, 81.8368, 0, 4, 2500, 4, "surfing,beach,lagoon"),
                new Destination("Polonnaruwa Ancient City", "North Central", HERITAGE, CULTURAL_TRIANGLE,
                        "Medieval royal capital with the Gal Vihara rock-carved Buddhas, best explored by bicycle. UNESCO World Heritage Site.",
                        7.9403, 81.0188, 25, 4, 3000, 5, "unesco,cycling,ruins,buddha"),
                new Destination("Anuradhapura Sacred City", "North Central", HERITAGE, CULTURAL_TRIANGLE,
                        "Ancient capital with giant dagobas and the Sri Maha Bodhi, the world's oldest documented tree. UNESCO World Heritage Site.",
                        8.3114, 80.4037, 25, 5, 4000, 4, "unesco,stupa,pilgrimage"),
                new Destination("Dambulla Cave Temple", "Central", CULTURAL, CULTURAL_TRIANGLE,
                        "Five cave shrines filled with over 150 Buddha statues and painted ceilings, dating back 2,000 years.",
                        7.8567, 80.6492, 10, 2, 3500, 4, "caves,temple,unesco"),
                new Destination("Nuwara Eliya", "Central", Category.HILL_COUNTRY, HILL_COUNTRY,
                        "'Little England' - cool climate, colonial bungalows, Gregory Lake and rolling tea estates.",
                        6.9497, 80.7891, 0, 4, 4000, 3, "tea,cool,lake,colonial"),
                new Destination("Horton Plains & World's End", "Central", NATURE, HILL_COUNTRY,
                        "High-altitude plateau with a 9 km loop trail to the 870 m World's End cliff and Baker's Falls.",
                        6.8020, 80.8070, 25, 4, 1500, 5, "hiking,cloud forest,waterfall"),
                new Destination("Adam's Peak (Sri Pada)", "Sabaragamuwa", ADVENTURE, HILL_COUNTRY,
                        "Sacred 2,243 m mountain climbed overnight by pilgrims of four faiths to watch the sunrise. Season Dec-May.",
                        6.8096, 80.4994, 0, 7, 3000, 4, "pilgrimage,hiking,sunrise"),
                new Destination("Trincomalee & Nilaveli", "Eastern", BEACH, EAST,
                        "Natural harbour, Koneswaram temple and white-sand beaches; snorkel at Pigeon Island National Park.",
                        8.5874, 81.2152, 0, 5, 3000, 4, "snorkel,beach,temple,diving"),
                new Destination("Pasikudah", "Eastern", BEACH, EAST,
                        "Shallow, calm turquoise bay that stays waist-deep far from shore - ideal for families.",
                        7.9293, 81.5606, 0, 4, 2000, 3, "family,beach,calm"),
                new Destination("Udawalawe National Park", "Sabaragamuwa", WILDLIFE, WEST_SOUTH,
                        "Best place in Asia to see wild elephant herds year-round; visit the Elephant Transit Home too.",
                        6.4743, 80.8985, 25, 4, 2000, 4, "safari,elephant,conservation"),
                new Destination("Minneriya National Park", "North Central", WILDLIFE, CULTURAL_TRIANGLE,
                        "Home of 'The Gathering' - hundreds of elephants around the ancient reservoir from July to September.",
                        8.0361, 80.8183, 25, 4, 1500, 4, "safari,elephant,gathering"),
                new Destination("Sinharaja Forest Reserve", "Sabaragamuwa", NATURE, WEST_SOUTH,
                        "Last primary tropical rainforest in Sri Lanka, rich in endemic birds. UNESCO World Heritage Site.",
                        6.4089, 80.4211, 15, 5, 800, 5, "rainforest,birds,unesco,endemic"),
                new Destination("Kitulgala", "Sabaragamuwa", ADVENTURE, WEST_SOUTH,
                        "White-water rafting on the Kelani River, canyoning and jungle treks; filming site of 'The Bridge on the River Kwai'.",
                        6.9890, 80.4175, 0, 4, 1200, 4, "rafting,canyoning,jungle"),
                new Destination("Colombo City", "Western", CITY, WEST_SOUTH,
                        "Vibrant capital: Galle Face Green, Gangaramaya Temple, Pettah markets, Lotus Tower and great dining.",
                        6.9271, 79.8612, 0, 5, 15000, 2, "shopping,food,nightlife,museum"),
                new Destination("Jaffna", "Northern", CULTURAL, NORTH,
                        "Tamil cultural capital with Nallur Kandaswamy Kovil, Jaffna Fort, island ferries and famous crab curry.",
                        9.6615, 80.0255, 0, 5, 2500, 4, "hindu,food,islands,culture"),
                new Destination("Bentota", "Southern", BEACH, WEST_SOUTH,
                        "Golden beaches and a river estuary for water sports, plus the Brief Garden and turtle hatcheries.",
                        6.4210, 79.9980, 0, 4, 3500, 3, "watersports,beach,river,turtles"),
                new Destination("Wilpattu National Park", "North Western", WILDLIFE, NORTH,
                        "Largest and wildest national park, dotted with natural lakes (villus); quieter leopard safaris.",
                        8.4560, 80.0130, 25, 5, 800, 5, "safari,leopard,quiet"),
                new Destination("Hikkaduwa", "Southern", BEACH, WEST_SOUTH,
                        "Lively surf town with a coral reef sanctuary, sea turtles close to shore and beachside nightlife.",
                        6.1395, 80.1063, 0, 4, 3500, 3, "surfing,coral,turtles,nightlife"));
    }

    private void seedVisitHistory(List<Destination> destinations) {
        YearMonth end = YearMonth.now().minusMonths(1);
        YearMonth start = end.minusMonths(HISTORY_MONTHS - 1);
        List<VisitStat> stats = new ArrayList<>();
        for (Destination d : destinations) {
            Random random = new Random(d.getName().hashCode());
            double popularity = POPULARITY.entrySet().stream()
                    .filter(e -> d.getName().startsWith(e.getKey()))
                    .mapToDouble(Map.Entry::getValue)
                    .findFirst().orElse(0.5);
            double base = d.getDailyCapacity() * 30 * popularity;
            for (int t = 0; t < HISTORY_MONTHS; t++) {
                YearMonth ym = start.plusMonths(t);
                int m = ym.getMonthValue();
                double weather = 0.55 + 0.45 * d.getClimateZone().suitability(m);
                double growth = Math.pow(ANNUAL_GROWTH, (t - (HISTORY_MONTHS - 1)) / 12.0);
                double noise = 0.9 + random.nextDouble() * 0.2;
                double special = d.getName().startsWith("Minneriya") && m >= 7 && m <= 9 ? 1.6 : 1.0; // "The Gathering"
                int visitors = (int) Math.round(base * NATIONAL_SEASONALITY[m - 1] * weather * growth * noise * special);
                stats.add(new VisitStat(d, ym.getYear(), m, visitors));
            }
        }
        visitStatRepository.saveAll(stats);
    }

    private void seedReviews(List<Destination> destinations) {
        Map<String, List<String[]>> samples = Map.of(
                "Sigiriya", List.<String[]>of(
                        new String[]{"Emma", "United Kingdom", "5", "Breathtaking views from the top, absolutely worth the climb. Go early to avoid the heat."},
                        new String[]{"Lukas", "Germany", "3", "Amazing history but very crowded at 10am and the queue on the stairs was slow."},
                        new String[]{"Priya", "India", "4", "Beautiful frescoes and gardens. Ticket is expensive but well organized."}),
                "Temple", List.<String[]>of(
                        new String[]{"Kenji", "Japan", "5", "Peaceful and spiritual. Staff were friendly and helpful with dress rules."},
                        new String[]{"Sarah", "Australia", "4", "Lovely temple, beautiful evening puja. Can be busy on weekends."}),
                "Galle", List.<String[]>of(
                        new String[]{"Olivia", "USA", "5", "Stunning sunset on the ramparts and delicious food in the cafes. Loved walking around."},
                        new String[]{"Marco", "Italy", "4", "Charming colonial streets, great for photos. Parking was difficult."}),
                "Ella", List.<String[]>of(
                        new String[]{"Chloe", "France", "5", "The train ride and Nine Arches Bridge were magical. Wonderful hiking and views."},
                        new String[]{"Tom", "Netherlands", "3", "Beautiful but too crowded at the bridge, and some plastic litter on the trail."}),
                "Yala", List.<String[]>of(
                        new String[]{"Daniel", "Canada", "4", "We saw a leopard and elephants! Guide was excellent."},
                        new String[]{"Anna", "Sweden", "2", "Too many jeeps chasing one leopard, very chaotic and not respectful to wildlife."}),
                "Mirissa", List.<String[]>of(
                        new String[]{"Jack", "UK", "5", "Saw blue whales! Beautiful beach and relaxing atmosphere."},
                        new String[]{"Mia", "Germany", "2", "Whale boat was overcrowded and the beach had garbage in places."}),
                "Sinharaja", List.<String[]>of(
                        new String[]{"Liam", "Ireland", "5", "Incredible rainforest with endemic birds. Our local guide was superb."}),
                "Arugam", List.<String[]>of(
                        new String[]{"Noah", "Australia", "5", "Best surf in Sri Lanka, friendly locals and great food."}),
                "Polonnaruwa", List.<String[]>of(
                        new String[]{"Sofia", "Spain", "5", "Cycling between the ancient ruins was a highlight. Gal Vihara is stunning."}),
                "Colombo", List.<String[]>of(
                        new String[]{"Ravi", "Singapore", "4", "Great food and shopping, but traffic is really bad in the evening."}));

        List<Review> reviews = new ArrayList<>();
        Random random = new Random(42);
        for (Destination d : destinations) {
            samples.entrySet().stream()
                    .filter(e -> d.getName().startsWith(e.getKey()))
                    .flatMap(e -> e.getValue().stream())
                    .forEach(s -> {
                        Review r = reviewService.build(d, s[0], s[1], Integer.parseInt(s[2]), s[3]);
                        r.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(60)).minusHours(random.nextInt(24)));
                        reviews.add(r);
                    });
        }
        reviewRepository.saveAll(reviews);
    }

    private void seedCheckIns(List<Destination> destinations) {
        Random random = new Random(7);
        List<CheckIn> checkIns = new ArrayList<>();
        for (Destination d : destinations) {
            int count = random.nextInt(6);
            for (int i = 0; i < count; i++) {
                CheckIn c = new CheckIn(d, 1 + random.nextInt(5));
                c.setCreatedAt(LocalDateTime.now().minusMinutes(random.nextInt(600)));
                checkIns.add(c);
            }
        }
        checkInRepository.saveAll(checkIns);
    }
}
