package com.tourmate.service;

import com.tourmate.dto.ChatRequest;
import com.tourmate.dto.ChatRequest.ChatTurn;
import com.tourmate.dto.ChatResponse;
import com.tourmate.dto.CrowdStatus;
import com.tourmate.entity.Destination;
import com.tourmate.enums.Category;
import com.tourmate.repository.DestinationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 24/7 visitor assistance. With a Claude API key it answers free-form questions grounded in the
 * TourMate destination catalogue; without one it falls back to a built-in knowledge base that
 * covers the questions visitors ask most (visas, money, transport, weather, safety, etiquette).
 */
@Service
public class AssistantService {

    private static final int MAX_HISTORY_TURNS = 10;

    private static final List<String> DEFAULT_SUGGESTIONS = List.of(
            "When is the best time to visit the beaches?",
            "How do I get a visa (ETA)?",
            "Which wildlife parks should I visit?",
            "Emergency numbers in Sri Lanka");

    private final AiService aiService;
    private final DestinationRepository destinationRepository;
    private final CrowdService crowdService;

    public AssistantService(AiService aiService, DestinationRepository destinationRepository, CrowdService crowdService) {
        this.aiService = aiService;
        this.destinationRepository = destinationRepository;
        this.crowdService = crowdService;
    }

    public ChatResponse chat(ChatRequest request) {
        List<Destination> destinations = destinationRepository.findAll();
        Optional<String> ai = aiService.complete(systemPrompt(destinations, request.language()), sanitise(request.history()), request.message());
        if (ai.isPresent()) {
            return new ChatResponse(ai.get(), true, DEFAULT_SUGGESTIONS);
        }
        return offlineAnswer(request.message(), destinations);
    }

    private String systemPrompt(List<Destination> destinations, String language) {
        int month = LocalDate.now().getMonthValue();
        String catalogue = destinations.stream()
                .map(d -> String.format(Locale.ENGLISH, "- %s (%s, %s province): %s Entry fee ~US$%.0f. Weather this month: %s.",
                        d.getName(), PlannerService.pretty(d.getCategory()), d.getProvince(), d.getDescription(),
                        d.getEntryFeeUsd(), weatherWord(d.getClimateZone().suitability(month))))
                .collect(Collectors.joining("\n"));
        return """
                You are TourMate AI, the virtual visitor assistant for tourism in Sri Lanka, built for the
                Sri Lanka Tourism Development Authority's vision of smart, sustainable tourism.
                Today is %s.

                How to answer:
                - Be warm, concise (under 180 words) and practical. Use short bullet lists when listing places or steps.
                - Ground destination advice in the catalogue below, and mention the weather this month when relevant.
                - Encourage responsible travel: respecting temples and wildlife, reducing plastic, supporting local businesses.
                - Don't invent prices, visa fees or regulations. When unsure, point to official sources such as
                  eta.gov.lk (visas) and sltda.gov.lk (licensed tour operators and hotels).
                - For emergencies give: Police 119, Ambulance (Suwa Seriya) 1990, Tourist hotline 1912.
                - If a question is unrelated to travel in Sri Lanka, briefly say so and offer travel help instead.
                - Reply in %s, keeping place names recognisable.

                Destination catalogue:
                %s
                """.formatted(LocalDate.now(), language == null || language.isBlank() ? "English" : language, catalogue);
    }

    /** Keeps the last few turns and makes sure they alternate user/assistant starting with user, as the API requires. */
    private static List<ChatTurn> sanitise(List<ChatTurn> history) {
        List<ChatTurn> result = new ArrayList<>();
        if (history == null) {
            return result;
        }
        List<ChatTurn> recent = history.subList(Math.max(0, history.size() - MAX_HISTORY_TURNS), history.size());
        String expected = "user";
        for (ChatTurn turn : recent) {
            if (turn == null || turn.content() == null || turn.content().isBlank() || !expected.equals(turn.role())) {
                continue;
            }
            result.add(turn);
            expected = "user".equals(expected) ? "assistant" : "user";
        }
        // the new message is a user turn, so history must end with the assistant
        if (!result.isEmpty() && "user".equals(result.get(result.size() - 1).role())) {
            result.remove(result.size() - 1);
        }
        return result;
    }

    private ChatResponse offlineAnswer(String message, List<Destination> destinations) {
        String q = message.toLowerCase(Locale.ROOT);
        int month = LocalDate.now().getMonthValue();

        // a specific destination beats a general topic
        Optional<Destination> named = destinations.stream()
                .filter(d -> q.contains(d.getName().toLowerCase(Locale.ROOT))
                        || q.contains(d.getName().split("[ (]")[0].toLowerCase(Locale.ROOT)))
                .findFirst();
        if (named.isPresent()) {
            return answer(describe(named.get(), month),
                    "Best time to visit " + named.get().getName().split("[ (]")[0] + "?", "Plan a trip including it", "Emergency numbers in Sri Lanka");
        }

        if (containsAny(q, "emergency", "police", "ambulance", "stolen", "lost my", "hospital", "help me")) {
            return answer("""
                    Emergency numbers in Sri Lanka:
                    • Police: 119
                    • Ambulance (Suwa Seriya, free): 1990
                    • Tourist hotline (SLTDA): 1912
                    • Fire & rescue: 110
                    If your passport is lost or stolen, file a police report first, then contact your embassy in Colombo.""",
                    "Is Sri Lanka safe for tourists?", "How do I get a visa (ETA)?");
        }
        if (containsAny(q, "visa", "eta", "passport", "immigration")) {
            return answer("""
                    Most visitors need an Electronic Travel Authorization (ETA) before arriving.
                    • Apply online only through the official portal: eta.gov.lk
                    • Have your passport (valid 6+ months), return ticket and accommodation details ready.
                    • Fees and eligible countries change from time to time, so always check the official site rather than third-party agents.""",
                    "What currency is used?", "Emergency numbers in Sri Lanka");
        }
        if (containsAny(q, "currency", "money", "rupee", "lkr", "atm", "card", "tip", "cash", "exchange")) {
            return answer("""
                    The currency is the Sri Lankan Rupee (LKR).
                    • ATMs are common in towns; cards are accepted at hotels and larger restaurants.
                    • Carry cash for tuk-tuks, small shops, temples and rural areas.
                    • Exchange money at banks or licensed money changers and keep the receipt.
                    • Tipping ~10% is appreciated where no service charge is added; drivers and guides are usually tipped per day.""",
                    "How do I get around?", "Is Sri Lanka safe for tourists?");
        }
        if (containsAny(q, "weather", "monsoon", "best time", "when to", "rain", "season", "climate")) {
            return answer("""
                    Sri Lanka has two monsoons, so there's always a sunny coast:
                    • West & south coast (Galle, Mirissa, Bentota): best December - April
                    • East coast (Trincomalee, Arugam Bay, Pasikudah): best May - September
                    • Cultural Triangle (Sigiriya, Dambulla, Polonnaruwa): good most of the year, wettest Oct - Dec
                    • Hill country (Ella, Nuwara Eliya): driest January - April
                    Right now the best-weather picks are: %s.""".formatted(bestWeatherNow(destinations, month)),
                    "Which beaches are best right now?", "Plan a 7-day trip");
        }
        if (containsAny(q, "train", "bus", "tuk", "transport", "getting around", "get around", "taxi", "uber", "pickme", "drive")) {
            return answer("""
                    Getting around Sri Lanka:
                    • Train: cheap, low-carbon and scenic - the Kandy-Nanu Oya-Ella line is famous. Reserve seats early in peak season.
                    • Bus: very cheap and covers the whole island; express A/C buses run between major cities.
                    • Tuk-tuk: great for short trips; use metered tuk-tuks or a ride-hailing app (e.g. PickMe, Uber in Colombo).
                    • Private car with driver: most comfortable for multi-day tours; book through SLTDA-registered operators.""",
                    "How much CO2 does my trip produce?", "Plan a 7-day trip");
        }
        if (containsAny(q, "temple", "dress", "etiquette", "culture", "custom", "respect", "buddha")) {
            return answer("""
                    Temple etiquette in Sri Lanka:
                    • Cover shoulders and knees; remove shoes and hats before entering.
                    • Never pose with your back to a Buddha statue or touch it - this is taken very seriously.
                    • Avoid pointing your feet at people or statues.
                    • Ask before photographing monks or locals, and don't use flash inside shrines.
                    Greet people with "Ayubowan" (Sinhala) or "Vanakkam" (Tamil) - it is always appreciated!""",
                    "What food should I try?", "Tell me about Temple of the Tooth");
        }
        if (containsAny(q, "food", "eat", "dish", "cuisine", "restaurant", "hungry")) {
            return answer("""
                    Sri Lankan dishes to try:
                    • Rice & curry - several small curries with rice, the national everyday meal
                    • Hoppers (appa) and string hoppers - great for breakfast
                    • Kottu roti - chopped flatbread stir-fry, the classic street food
                    • Fish ambul thiyal (sour fish curry) on the south coast
                    • Jaffna crab curry in the north
                    • Finish with curd and kithul treacle, and a cup of Ceylon tea in the hills.""",
                    "Temple etiquette", "Plan a 7-day trip");
        }
        if (containsAny(q, "safe", "scam", "danger", "solo")) {
            return answer("""
                    Sri Lanka is generally safe and welcoming. A few tips:
                    • Agree tuk-tuk fares before the ride or use a meter/app.
                    • Be wary of unsolicited "guides" and gem-shop detours.
                    • Swim only at beaches with flags or lifeguards - currents can be strong during the monsoon.
                    • Book tours and hotels through SLTDA-registered providers (see sltda.gov.lk).
                    Emergency: Police 119, Ambulance 1990, Tourist hotline 1912.""",
                    "Emergency numbers in Sri Lanka", "How do I get around?");
        }
        if (containsAny(q, "eco", "sustainab", "green", "plastic", "carbon", "environment")) {
            List<String> eco = destinations.stream().filter(d -> d.getEcoScore() >= 5).map(Destination::getName).limit(4).toList();
            return answer("""
                    Travelling sustainably in Sri Lanka:
                    • Take the train or bus for long distances - up to 80%% less CO2 than a private car.
                    • Carry a refillable bottle and say no to plastic bags and straws.
                    • Choose ethical wildlife operators - never ride elephants or feed wild animals.
                    • Stay in locally owned guesthouses and eat local.
                    Top eco-rated places: %s.
                    Use the Sustainability page to compare the footprint of each transport option.""".formatted(String.join(", ", eco)),
                    "How do I get around?", "Which wildlife parks should I visit?");
        }

        Optional<Category> category = categoryFromText(q);
        if (category.isPresent()) {
            return answer(recommend(category.get(), destinations, month),
                    "Plan a trip around these", "When is the best time to visit?", "Which places are crowded right now?");
        }
        if (containsAny(q, "crowd", "busy", "quiet")) {
            List<CrowdStatus> crowds = crowdService.currentCrowds();
            String busy = crowds.stream().limit(3).map(c -> c.name() + " (" + c.level().toLowerCase(Locale.ROOT).replace('_', ' ') + ")")
                    .collect(Collectors.joining(", "));
            String quiet = crowds.stream().skip(Math.max(0, crowds.size() - 3)).map(CrowdStatus::name).collect(Collectors.joining(", "));
            return answer("Busiest right now: " + busy + ".\nQuietest right now: " + quiet
                    + ".\nOpen the Live Crowds page for the best hour to visit each place.", DEFAULT_SUGGESTIONS.toArray(String[]::new));
        }
        if (containsAny(q, "hi", "hello", "hey", "ayubowan", "vanakkam", "good morning")) {
            return answer("Ayubowan! 🙏 I'm TourMate AI, your Sri Lanka travel assistant. Ask me about destinations, "
                    + "the best time to travel, transport, visas, food, culture or safety.", DEFAULT_SUGGESTIONS.toArray(String[]::new));
        }

        return answer("""
                I'm running in offline mode, so I can help best with questions about:
                • Destinations (e.g. "Tell me about Sigiriya"), beaches, wildlife, hiking or heritage
                • The best time to visit and the monsoons
                • Visas, money, transport, food, etiquette, safety and emergency numbers
                Try one of the suggestions below!""", DEFAULT_SUGGESTIONS.toArray(String[]::new));
    }

    private String describe(Destination d, int month) {
        String level = crowdService.currentCrowds().stream()
                .filter(c -> c.destinationId().equals(d.getId()))
                .map(c -> c.level().toLowerCase(Locale.ROOT).replace('_', ' '))
                .findFirst().orElse("unknown");
        String fee = d.getEntryFeeUsd() > 0 ? String.format(Locale.ENGLISH, "about US$%.0f", d.getEntryFeeUsd()) : "free";
        return String.format(Locale.ENGLISH, """
                %s (%s province, %s)
                %s
                • Weather in %s: %s
                • Entry fee for foreign visitors: %s
                • Plan to spend around %.0f hour(s)
                • Crowd level right now: %s
                • Sustainability rating: %d/5""",
                d.getName(), d.getProvince(), PlannerService.pretty(d.getCategory()), d.getDescription(),
                ForecastService.monthName(month), weatherWord(d.getClimateZone().suitability(month)), fee,
                d.getAvgVisitHours(), level, d.getEcoScore());
    }

    private static String recommend(Category category, List<Destination> destinations, int month) {
        String list = destinations.stream()
                .filter(d -> d.getCategory() == category)
                .sorted(Comparator.comparingDouble((Destination d) -> d.getClimateZone().suitability(month)).reversed())
                .map(d -> "• " + d.getName() + " - " + weatherWord(d.getClimateZone().suitability(month)) + " weather now")
                .collect(Collectors.joining("\n"));
        return "Top " + PlannerService.pretty(category) + " destinations, best weather first for "
                + ForecastService.monthName(month) + ":\n" + list;
    }

    private static String bestWeatherNow(List<Destination> destinations, int month) {
        return destinations.stream()
                .sorted(Comparator.comparingDouble((Destination d) -> d.getClimateZone().suitability(month)).reversed()
                        .thenComparing(Destination::getEcoScore, Comparator.reverseOrder()))
                .limit(4)
                .map(Destination::getName)
                .collect(Collectors.joining(", "));
    }

    private static Optional<Category> categoryFromText(String q) {
        Map<Category, List<String>> words = Map.of(
                Category.BEACH, List.of("beach", "surf", "snorkel", "diving", "whale", "sea"),
                Category.WILDLIFE, List.of("wildlife", "safari", "leopard", "elephant", "animals", "national park"),
                Category.HERITAGE, List.of("heritage", "ancient", "ruins", "history", "unesco", "fort"),
                Category.HILL_COUNTRY, List.of("hill", "tea", "mountain", "cool"),
                Category.ADVENTURE, List.of("adventure", "hike", "hiking", "rafting", "trek", "climb"),
                Category.NATURE, List.of("nature", "rainforest", "forest", "waterfall", "birds"),
                Category.CULTURAL, List.of("cultural", "festival", "religious"),
                Category.CITY, List.of("city", "shopping", "nightlife"));
        return words.entrySet().stream()
                .filter(e -> e.getValue().stream().anyMatch(q::contains))
                .map(Map.Entry::getKey)
                .findFirst();
    }

    private static String weatherWord(double suitability) {
        return suitability >= 0.85 ? "excellent" : suitability >= 0.6 ? "fair (some showers)" : "monsoon rains likely";
    }

    private static boolean containsAny(String text, String... words) {
        for (String w : words) {
            if (w.length() <= 3 ? text.matches("(?s).*\\b" + w + "\\b.*") : text.contains(w)) {
                return true;
            }
        }
        return false;
    }

    private static ChatResponse answer(String text, String... suggestions) {
        return new ChatResponse(text, false, List.of(suggestions));
    }
}
