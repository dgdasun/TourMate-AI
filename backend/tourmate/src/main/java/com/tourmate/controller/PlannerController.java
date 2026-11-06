package com.tourmate.controller;

import com.tourmate.dto.PlanRequest;
import com.tourmate.dto.PlanResponse;
import com.tourmate.entity.TripPlan;
import com.tourmate.repository.TripPlanRepository;
import com.tourmate.service.PlannerService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/planner")
public class PlannerController {

    private final PlannerService plannerService;
    private final TripPlanRepository tripPlanRepository;

    public PlannerController(PlannerService plannerService, TripPlanRepository tripPlanRepository) {
        this.plannerService = plannerService;
        this.tripPlanRepository = tripPlanRepository;
    }

    @PostMapping("/itinerary")
    public PlanResponse plan(@Valid @RequestBody PlanRequest request) {
        return plannerService.plan(request);
    }

    @GetMapping("/recent")
    public List<TripPlan> recent() {
        return tripPlanRepository.findTop10ByOrderByCreatedAtDesc();
    }
}
