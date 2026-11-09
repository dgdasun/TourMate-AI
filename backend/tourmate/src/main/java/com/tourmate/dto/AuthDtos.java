package com.tourmate.dto;

import com.tourmate.entity.User;
import com.tourmate.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/** Request and response bodies for /api/auth. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 80) String fullName,
            @NotBlank @Email @Size(max = 120) String email,
            @NotBlank @Size(min = 8, max = 72, message = "must be 8-72 characters")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "must contain at least one letter and one number")
            String password,
            @Size(max = 60) String country) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record UserDto(Long id, String fullName, String email, Role role, String country, LocalDateTime createdAt) {
        public static UserDto from(User u) {
            return new UserDto(u.getId(), u.getFullName(), u.getEmail(), u.getRole(), u.getCountry(), u.getCreatedAt());
        }
    }

    /** @param expiresIn token lifetime in seconds */
    public record AuthResponse(String token, long expiresIn, UserDto user) {
    }
}
