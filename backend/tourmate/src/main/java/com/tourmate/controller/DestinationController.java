package com.tourmate.controller;

import com.tourmate.dto.DestinationDto;
import com.tourmate.dto.DestinationRequest;
import com.tourmate.enums.Category;
import com.tourmate.service.DestinationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
public class DestinationController {

    private final DestinationService destinationService;

    public DestinationController(DestinationService destinationService) {
        this.destinationService = destinationService;
    }

    @GetMapping
    public List<DestinationDto> list(@RequestParam(required = false) Category category,
                                     @RequestParam(required = false) Integer month,
                                     @RequestParam(required = false) String search) {
        return destinationService.list(category, month, search);
    }

    @GetMapping("/{id}")
    public DestinationDto get(@PathVariable Long id) {
        return destinationService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DestinationDto create(@Valid @RequestBody DestinationRequest request) {
        return destinationService.create(request);
    }

    @PutMapping("/{id}")
    public DestinationDto update(@PathVariable Long id, @Valid @RequestBody DestinationRequest request) {
        return destinationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        destinationService.delete(id);
    }
}
