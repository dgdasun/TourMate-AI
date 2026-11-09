package com.tourmate.security;

import com.tourmate.enums.Role;

/** The signed-in user, rebuilt from the JWT on every request (no server-side session). */
public record AuthUser(Long id, String email, String name, Role role) {
}
