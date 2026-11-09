package com.tourmate.service;

import com.tourmate.dto.AuthDtos.AuthResponse;
import com.tourmate.dto.AuthDtos.LoginRequest;
import com.tourmate.dto.AuthDtos.RegisterRequest;
import com.tourmate.dto.AuthDtos.UserDto;
import com.tourmate.entity.User;
import com.tourmate.enums.Role;
import com.tourmate.exception.AuthException;
import com.tourmate.exception.ConflictException;
import com.tourmate.exception.NotFoundException;
import com.tourmate.repository.UserRepository;
import com.tourmate.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /** Self-registration always creates a TRAVELLER; manager accounts are created by the tourism authority. */
    public AuthResponse register(RegisterRequest req) {
        String email = normalise(req.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }
        User user = new User(req.fullName().trim(), email, passwordEncoder.encode(req.password()), Role.TRAVELLER,
                req.country() == null || req.country().isBlank() ? null : req.country().trim());
        user.setLastLoginAt(LocalDateTime.now());
        return tokenFor(userRepository.save(user));
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(normalise(req.email()))
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new AuthException("Invalid email or password"));
        user.setLastLoginAt(LocalDateTime.now());
        return tokenFor(userRepository.save(user));
    }

    public UserDto me(Long userId) {
        return userRepository.findById(userId).map(UserDto::from)
                .orElseThrow(() -> new NotFoundException("Account no longer exists"));
    }

    private AuthResponse tokenFor(User user) {
        return new AuthResponse(jwtService.issue(user), jwtService.ttlSeconds(), UserDto.from(user));
    }

    private static String normalise(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
