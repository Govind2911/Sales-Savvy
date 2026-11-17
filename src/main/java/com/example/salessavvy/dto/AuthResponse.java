package com.example.salessavvy.dto;

public record AuthResponse(
        String token,
        String tokenType,
        String username,
        String role
) {
}
