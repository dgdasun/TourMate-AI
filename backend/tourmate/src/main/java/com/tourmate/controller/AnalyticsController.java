package com.tourmate.controller;

import com.tourmate.dto.DestinationInsights;
import com.tourmate.dto.ForecastResponse;
import com.tourmate.dto.OverviewResponse;
import com.tourmate.service.AnalyticsService;
import com.tourmate.service.ForecastService;
import com.tourmate.service.ReviewService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final ForecastService forecastService;
    private final ReviewService reviewService;

    public AnalyticsController(AnalyticsService analyticsService, ForecastService forecastService,
                               ReviewService reviewService) {
        this.analyticsService = analyticsService;
        this.forecastService = forecastService;
        this.reviewService = reviewService;
    }

    @GetMapping("/overview")
    public OverviewResponse overview() {
        return analyticsService.overview();
    }

    @GetMapping("/forecast/{destinationId}")
    public ForecastResponse forecast(@PathVariable Long destinationId) {
        return forecastService.forecast(destinationId);
    }

    @GetMapping("/insights/{destinationId}")
    public DestinationInsights insights(@PathVariable Long destinationId) {
        return reviewService.insights(destinationId);
    }
}
