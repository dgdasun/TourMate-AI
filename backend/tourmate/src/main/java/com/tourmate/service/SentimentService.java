package com.tourmate.service;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Lexicon-based sentiment and aspect analysis of visitor reviews. It runs locally (no API calls)
 * so every review is scored instantly, and it handles negation ("not clean") and intensifiers
 * ("very crowded").
 */
@Service
public class SentimentService {

    public record Result(double score, String label, Set<String> aspects, Set<String> negativeAspects) {
    }

    private static final Set<String> POSITIVE = Set.of(
            "amazing", "awesome", "beautiful", "best", "breathtaking", "calm", "clean", "delicious", "enjoyed",
            "excellent", "fantastic", "friendly", "gorgeous", "great", "good", "helpful", "incredible", "love",
            "loved", "lovely", "magical", "memorable", "nice", "peaceful", "perfect", "pleasant", "recommend",
            "relaxing", "safe", "spectacular", "stunning", "superb", "welcoming", "wonderful", "worth", "happy",
            "impressive", "affordable", "organized", "well");
    private static final Set<String> NEGATIVE = Set.of(
            "awful", "bad", "boring", "crowded", "dangerous", "dirty", "disappointed", "disappointing", "expensive",
            "filthy", "horrible", "litter", "noisy", "overcrowded", "overpriced", "poor", "rude", "scam", "smelly",
            "terrible", "unsafe", "waste", "worst", "garbage", "plastic", "chaotic", "hate", "slow", "broken",
            "delay", "delayed", "queue", "packed");
    private static final Set<String> NEGATIONS = Set.of("not", "no", "never", "hardly", "isn't", "wasn't", "didn't", "don't");
    private static final Set<String> INTENSIFIERS = Set.of("very", "really", "extremely", "so", "super", "absolutely", "too");

    /** Aspect name -> words that signal it. Order matters only for display. */
    private static final Map<String, List<String>> ASPECTS = new LinkedHashMap<>();

    static {
        ASPECTS.put("cleanliness", List.of("clean", "dirty", "garbage", "litter", "plastic", "toilet", "filthy", "smelly", "waste"));
        ASPECTS.put("crowds", List.of("crowd", "crowded", "busy", "queue", "packed", "overcrowded", "quiet", "peaceful"));
        ASPECTS.put("price", List.of("price", "expensive", "cheap", "fee", "ticket", "cost", "overpriced", "affordable", "worth"));
        ASPECTS.put("service", List.of("staff", "guide", "service", "friendly", "rude", "helpful", "welcoming", "hospitality"));
        ASPECTS.put("nature", List.of("wildlife", "elephant", "leopard", "view", "views", "scenery", "beach", "forest", "waterfall", "whale", "birds", "sunset"));
        ASPECTS.put("access", List.of("road", "parking", "train", "tuk", "access", "traffic", "bus", "transport", "signage"));
        ASPECTS.put("safety", List.of("safe", "unsafe", "scam", "police", "dangerous", "security"));
        ASPECTS.put("culture", List.of("history", "temple", "heritage", "culture", "ancient", "ruins", "buddha", "fort"));
        ASPECTS.put("food", List.of("food", "restaurant", "delicious", "curry", "seafood", "tea"));
    }

    /**
     * @param rating star rating 1..5, blended in so a short comment still gets a sensible score
     */
    public Result analyse(String text, int rating) {
        String[] words = text.toLowerCase(Locale.ROOT).replaceAll("[^a-z' ]", " ").trim().split("\\s+");

        double raw = 0;
        int hits = 0;
        Set<String> aspects = new LinkedHashSet<>();
        Set<String> negativeAspects = new LinkedHashSet<>();

        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            double polarity = POSITIVE.contains(w) ? 1 : NEGATIVE.contains(w) ? -1 : 0;
            if (polarity != 0) {
                if (precededBy(words, i, INTENSIFIERS)) {
                    polarity *= 1.5;
                }
                if (precededBy(words, i, NEGATIONS)) {
                    polarity *= -0.8;
                }
                raw += polarity;
                hits++;
            }
            for (Map.Entry<String, List<String>> aspect : ASPECTS.entrySet()) {
                if (aspect.getValue().contains(w)) {
                    aspects.add(aspect.getKey());
                    if (polarity < 0) {
                        negativeAspects.add(aspect.getKey());
                    }
                }
            }
        }

        double textScore = hits == 0 ? 0 : Math.max(-1, Math.min(1, raw / Math.sqrt(hits * 2.0)));
        double ratingScore = (rating - 3) / 2.0;
        double score = hits == 0 ? ratingScore : 0.6 * textScore + 0.4 * ratingScore;
        score = Math.round(score * 100) / 100.0;

        String label = score > 0.2 ? "POSITIVE" : score < -0.2 ? "NEGATIVE" : "NEUTRAL";
        return new Result(score, label, aspects, negativeAspects);
    }

    /** True if one of the two words before position i is in the set. */
    private static boolean precededBy(String[] words, int i, Set<String> set) {
        return (i >= 1 && set.contains(words[i - 1])) || (i >= 2 && set.contains(words[i - 2]));
    }
}
