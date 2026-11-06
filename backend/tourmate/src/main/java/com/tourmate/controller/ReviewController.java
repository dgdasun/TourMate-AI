package com.tourmate.controller;

import com.tourmate.dto.ReviewDto;
import com.tourmate.dto.ReviewRequest;
import com.tourmate.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public List<ReviewDto> list(@RequestParam(required = false) Long destinationId) {
        return reviewService.list(destinationId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewDto create(@Valid @RequestBody ReviewRequest request) {
        return reviewService.create(request);
    }
}
