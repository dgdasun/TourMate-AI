package com.tourmate.controller;

import com.tourmate.dto.ChatRequest;
import com.tourmate.dto.ChatResponse;
import com.tourmate.service.AiService;
import com.tourmate.service.AssistantService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;
    private final AiService aiService;

    public AssistantController(AssistantService assistantService, AiService aiService) {
        this.assistantService = assistantService;
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
        return assistantService.chat(request);
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("aiEnabled", aiService.isEnabled(),
                "mode", aiService.isEnabled() ? "Claude AI" : "Offline knowledge base");
    }
}
