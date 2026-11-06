package com.tourmate.service;

import com.tourmate.dto.DestinationInsights;
import com.tourmate.dto.ReviewDto;
import com.tourmate.dto.ReviewRequest;
import com.tourmate.entity.Destination;
import com.tourmate.entity.Review;
import com.tourmate.exception.NotFoundException;
import com.tourmate.repository.DestinationRepository;
import com.tourmate.repository.ReviewRepository;
import com.tourmate.util.GeoUtil;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private static final Map<String, String> ASPECT_ACTIONS = Map.of(
            "cleanliness", "Add more waste bins and schedule extra cleaning at peak hours.",
            "crowds", "Introduce timed entry slots and promote early-morning visits.",
            "price", "Review ticket pricing and clearly communicate what the fee includes.",
            "service", "Run visitor-service training for staff and guides.",
            "access", "Improve signage, parking and last-mile transport options.",
            "safety", "Increase tourist police presence and publish scam warnings at the entrance.",
            "food", "Work with local vendors to improve food quality and hygiene.",
            "nature", "Strengthen conservation rules and limit vehicles near wildlife.",
            "culture", "Add multilingual interpretation boards and guided heritage tours.");

    private final ReviewRepository reviewRepository;
    private final DestinationRepository destinationRepository;
    private final SentimentService sentimentService;

    public ReviewService(ReviewRepository reviewRepository, DestinationRepository destinationRepository,
                         SentimentService sentimentService) {
        this.reviewRepository = reviewRepository;
        this.destinationRepository = destinationRepository;
        this.sentimentService = sentimentService;
    }

    public ReviewDto create(ReviewRequest req) {
        Destination d = destinationRepository.findById(req.destinationId())
                .orElseThrow(() -> new NotFoundException("Destination " + req.destinationId() + " not found"));
        return ReviewDto.from(reviewRepository.save(build(d, req.visitorName(), req.country(), req.rating(), req.comment())));
    }

    /** Builds a review with its sentiment and aspects already analysed (used by the seeder too). */
    public Review build(Destination d, String name, String country, int rating, String comment) {
        SentimentService.Result result = sentimentService.analyse(comment, rating);
        Review r = new Review();
        r.setDestination(d);
        r.setVisitorName(name);
        r.setCountry(country);
        r.setRating(rating);
        r.setComment(comment);
        r.setSentimentScore(result.score());
        r.setSentimentLabel(result.label());
        List<String> aspects = new ArrayList<>(result.aspects());
        // mark aspects mentioned negatively with a "-" prefix so insights can find problems
        aspects.replaceAll(a -> result.negativeAspects().contains(a) ? "-" + a : a);
        r.setAspects(String.join(",", aspects));
        return r;
    }

    public List<ReviewDto> list(Long destinationId) {
        List<Review> reviews = destinationId == null
                ? reviewRepository.findTop20ByOrderByCreatedAtDesc()
                : reviewRepository.findByDestinationIdOrderByCreatedAtDesc(destinationId);
        return reviews.stream().map(ReviewDto::from).toList();
    }

    public DestinationInsights insights(Long destinationId) {
        Destination d = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new NotFoundException("Destination " + destinationId + " not found"));
        List<Review> reviews = reviewRepository.findByDestinationIdOrderByCreatedAtDesc(destinationId);

        Map<String, Long> sentiment = new LinkedHashMap<>();
        for (String label : List.of("POSITIVE", "NEUTRAL", "NEGATIVE")) {
            sentiment.put(label, reviews.stream().filter(r -> label.equals(r.getSentimentLabel())).count());
        }
        List<String> rawAspects = reviews.stream()
                .filter(r -> r.getAspects() != null && !r.getAspects().isBlank())
                .flatMap(r -> Arrays.stream(r.getAspects().split(",")))
                .toList();
        Map<String, Long> mentions = sortedCounts(rawAspects.stream().map(a -> a.replace("-", "")).toList());
        Map<String, Long> negative = sortedCounts(rawAspects.stream().filter(a -> a.startsWith("-")).map(a -> a.substring(1)).toList());

        List<String> recommendations = new ArrayList<>();
        negative.keySet().stream().limit(3).forEach(a -> recommendations.add(ASPECT_ACTIONS.getOrDefault(a, "Investigate visitor concerns about " + a + ".")));
        if (recommendations.isEmpty()) {
            recommendations.add("Visitors are happy - use the best reviews in digital marketing campaigns.");
        }

        double avgRating = reviews.stream().mapToInt(Review::getRating).average().orElse(0);
        double avgSentiment = reviews.stream().mapToDouble(Review::getSentimentScore).average().orElse(0);
        return new DestinationInsights(d.getId(), d.getName(), reviews.size(), GeoUtil.round(avgRating, 2),
                GeoUtil.round(avgSentiment, 2), sentiment, mentions, negative, recommendations);
    }

    private static Map<String, Long> sortedCounts(List<String> values) {
        return values.stream()
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));
    }
}
