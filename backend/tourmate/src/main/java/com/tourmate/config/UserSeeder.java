package com.tourmate.config;

import com.tourmate.entity.User;
import com.tourmate.enums.Role;
import com.tourmate.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Creates two demo accounts on first start so the competition judges can try both roles. */
@Component
public class UserSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(UserSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }
        userRepository.save(new User("Demo Traveller", "demo@tourmate.lk", passwordEncoder.encode("Demo@1234"), Role.TRAVELLER, "United Kingdom"));
        userRepository.save(new User("Destination Manager", "manager@tourmate.lk", passwordEncoder.encode("Manager@123"), Role.MANAGER, "Sri Lanka"));
        log.info("Created demo accounts demo@tourmate.lk and manager@tourmate.lk");
    }
}
