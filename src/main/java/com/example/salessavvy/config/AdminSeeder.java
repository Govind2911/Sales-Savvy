package com.example.salessavvy.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.salessavvy.entity.User;
import com.example.salessavvy.repository.UserRepository;

@Configuration
public class AdminSeeder {

    @Bean
    public CommandLineRunner seedAdmin(UserRepository userRepository,
                                       PasswordEncoder passwordEncoder) {
        return args -> {
            String adminUsername = "admin";

            if (!userRepository.existsByUsername(adminUsername)) {
                User admin = new User(
                        "Admin",
                        adminUsername,
                        "admin@example.com",
                        passwordEncoder.encode("admin123"),
                        "ADMIN"
                );
                userRepository.save(admin);
                System.out.println("Admin user created: admin / admin123");
            } else {
                userRepository.findByUsername(adminUsername).ifPresent(admin -> {
                    if (admin.getEmail() == null || admin.getEmail().isBlank()) {
                        admin.setEmail("admin@example.com");
                        userRepository.save(admin);
                    }
                });
            }
        };
    }
}

