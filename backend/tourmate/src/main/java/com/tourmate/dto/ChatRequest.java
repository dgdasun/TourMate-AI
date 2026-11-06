package com.tourmate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * @param language name of the language the visitor wants replies in, e.g. "English", "සිංහල" or "தமிழ்"
 */
public record ChatRequest(@NotBlank @Size(max = 2000) String message, List<ChatTurn> history,
                          @Size(max = 30) String language) {

    /** @param role "user" or "assistant" */
    public record ChatTurn(String role, String content) {
    }
}
