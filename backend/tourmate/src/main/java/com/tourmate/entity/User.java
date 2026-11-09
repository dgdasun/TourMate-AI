package com.tourmate.entity;

import com.tourmate.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    /** Always stored lower-case so logins are case-insensitive. */
    @Column(nullable = false, unique = true)
    private String email;

    /** BCrypt hash - the plain password is never stored. */
    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.TRAVELLER;

    private String country;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime lastLoginAt;

    public User(String fullName, String email, String passwordHash, Role role, String country) {
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.country = country;
    }
}
