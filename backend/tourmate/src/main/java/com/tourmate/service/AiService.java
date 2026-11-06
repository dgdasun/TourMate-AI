package com.tourmate.service;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.core.JsonValue;
import com.anthropic.errors.AnthropicIoException;
import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.errors.RateLimitException;
import com.anthropic.errors.UnauthorizedException;
import com.anthropic.models.beta.messages.BetaMessage;
import com.anthropic.models.beta.messages.BetaOutputConfig;
import com.anthropic.models.beta.messages.BetaStopReason;
import com.anthropic.models.beta.messages.BetaTextBlock;
import com.anthropic.models.beta.messages.MessageCreateParams;
import com.tourmate.dto.ChatRequest.ChatTurn;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Thin wrapper around the Claude API. When no API key is configured every call returns
 * {@link Optional#empty()} and callers fall back to TourMate's built-in (offline) logic,
 * so the whole system still runs without network access or a key.
 */
@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final AnthropicClient client;
    private final String model;

    public AiService(@Value("${tourmate.ai.api-key:}") String apiKey,
                     @Value("${tourmate.ai.model:claude-opus-5-5}") String model) {
        this.model = model;
        String key = apiKey == null || apiKey.isBlank() ? System.getenv("ANTHROPIC_API_KEY") : apiKey;
        if (key == null || key.isBlank()) {
            this.client = null;
            log.info("No ANTHROPIC_API_KEY configured - AI features run in offline mode");
        } else {
            this.client = AnthropicOkHttpClient.builder().apiKey(key).build();
            log.info("Claude AI enabled using model {}", model);
        }
    }

    public boolean isEnabled() {
        return client != null;
    }

    /**
     * Sends a conversation to Claude and returns the text reply.
     *
     * @param history earlier turns, oldest first, alternating user/assistant and starting with user
     */
    public Optional<String> complete(String system, List<ChatTurn> history, String userMessage) {
        if (client == null) {
            return Optional.empty();
        }

        MessageCreateParams.Builder params = MessageCreateParams.builder()
                .model(model)
                .maxTokens(16000L)
                .system(system)
                // Chat-style answers don't need deep reasoning; low effort keeps replies fast and cheap
                .outputConfig(BetaOutputConfig.builder().effort(BetaOutputConfig.Effort.LOW).build())
                // If a safety classifier declines the request, let the API retry on a suitable fallback model
                .addBeta("server-side-fallback-2026-07-01")
                .putAdditionalBodyProperty("fallbacks", JsonValue.from("default"));
        for (ChatTurn turn : history) {
            if ("assistant".equals(turn.role())) {
                params.addAssistantMessage(turn.content());
            } else {
                params.addUserMessage(turn.content());
            }
        }
        params.addUserMessage(userMessage);

        try {
            BetaMessage response = client.beta().messages().create(params.build());
            if (response.stopReason().filter(BetaStopReason.REFUSAL::equals).isPresent()) {
                log.info("Claude declined the request");
                return Optional.empty();
            }
            String text = response.content().stream()
                    .flatMap(block -> block.text().stream())
                    .map(BetaTextBlock::text)
                    .collect(Collectors.joining())
                    .trim();
            return text.isEmpty() ? Optional.empty() : Optional.of(text);
        } catch (UnauthorizedException e) {
            log.error("Claude rejected the API key - check ANTHROPIC_API_KEY");
        } catch (RateLimitException e) {
            log.warn("Claude rate limit reached, using offline fallback");
        } catch (AnthropicServiceException e) {
            log.warn("Claude API error {}: {}", e.statusCode(), e.getMessage());
        } catch (AnthropicIoException e) {
            log.warn("Could not reach the Claude API: {}", e.getMessage());
        }
        return Optional.empty();
    }
}
