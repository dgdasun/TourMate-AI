package com.tourmate.controller;

import com.tourmate.dto.BestTimeResponse;
import com.tourmate.dto.CrowdStatus;
import com.tourmate.dto.FootprintResponse;
import com.tourmate.service.AnalyticsService;
import com.tourmate.service.CrowdService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MobilityController {

    private final CrowdService crowdService;
    private final AnalyticsService analyticsService;

    public MobilityController(CrowdService crowdService, AnalyticsService analyticsService) {
        this.crowdService = crowdService;
        this.analyticsService = analyticsService;
    }

    @GetMapping("/mobility/crowds")
    public List<CrowdStatus> crowds(@RequestParam(required = false) Integer hour) {
        if (hour == null) {
            return crowdService.currentCrowds();
        }
        if (hour < 0 || hour > 23) {
            throw new IllegalArgumentException("hour must be between 0 and 23");
        }
        return crowdService.crowdsAt(LocalDate.now().atTime(hour, 0));
    }

    @GetMapping("/mobility/best-time/{destinationId}")
    public BestTimeResponse bestTime(@PathVariable Long destinationId,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return crowdService.bestTime(destinationId, date != null ? date : LocalDate.now());
    }

    @PostMapping("/mobility/check-in")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> checkIn(@RequestBody Map<String, Integer> body) {
        Integer id = body.get("destinationId");
        if (id == null) {
            throw new IllegalArgumentException("destinationId is required");
        }
        crowdService.checkIn(id.longValue(), body.getOrDefault("groupSize", 1));
        return Map.of("status", "checked-in");
    }

    @GetMapping("/sustainability/footprint")
    public FootprintResponse footprint(@RequestParam double distanceKm,
                                       @RequestParam(defaultValue = "2") int travellers) {
        return analyticsService.footprint(distanceKm, travellers);
    }
}
