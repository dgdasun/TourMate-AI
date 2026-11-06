package com.tourmate.dto;

import java.util.List;

/**
 * @param aiPowered   true if the reply came from Claude, false if from the offline knowledge base
 * @param suggestions follow-up questions the UI can offer as quick replies
 */
public record ChatResponse(String reply, boolean aiPowered, List<String> suggestions) {
}
