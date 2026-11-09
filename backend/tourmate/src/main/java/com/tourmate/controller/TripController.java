package com.tourmate.controller;

import com.tourmate.dto.TripDtos.TripDetail;
import com.tourmate.dto.TripDtos.TripRequest;
import com.tourmate.dto.TripDtos.TripSummary;
import com.tourmate.security.AuthUser;
import com.tourmate.service.TripService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** The signed-in traveller's saved trips. */
@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @GetMapping
    public List<TripSummary> list(@AuthenticationPrincipal AuthUser user) {
        return tripService.list(user.id());
    }

    @GetMapping("/{id}")
    public TripDetail get(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        return tripService.get(user.id(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TripDetail create(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody TripRequest request) {
        return tripService.create(user.id(), request);
    }

    @PutMapping("/{id}")
    public TripDetail update(@AuthenticationPrincipal AuthUser user, @PathVariable Long id,
                             @Valid @RequestBody TripRequest request) {
        return tripService.update(user.id(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        tripService.delete(user.id(), id);
    }
}
