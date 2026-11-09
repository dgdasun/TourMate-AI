package com.tourmate.controller;

import com.tourmate.dto.PlanRequest;
import com.tourmate.dto.PlanResponse;
import com.tourmate.dto.TripDtos.EvaluateRequest;
import com.tourmate.service.PlannerService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/** Itinerary maths. Neither endpoint saves anything - saving is done explicitly through /api/trips. */
@RestController
@RequestMapping("/api/planner")
public class PlannerController {

    private final PlannerService plannerService;

    public PlannerController(PlannerService plannerService) {
        this.plannerService = plannerService;
    }

    /** AI suggestion based on interests, weather, crowds and sustainability. */
    @PostMapping("/itinerary")
    public PlanResponse plan(@Valid @RequestBody PlanRequest request) {
        return plannerService.plan(request);
    }

    /** Costs, distances, carbon and crowd levels for an itinerary the traveller built or edited. */
    @PostMapping("/evaluate")
    public PlanResponse evaluate(@Valid @RequestBody EvaluateRequest request) {
        return plannerService.evaluate(request.days(), request.month(), request.interests(), request.budget(),
                request.transport(), request.travellers());
    }
}
