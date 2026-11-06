package com.tourmate.dto;

import jakarta.validation.constraints.*;

public record ReviewRequest(
        @NotNull Long destinationId,
        @NotBlank @Size(max = 80) String visitorName,
        @Size(max = 60) String country,
        @Min(1) @Max(5) int rating,
        @NotBlank @Size(max = 2000) String comment) {
}
