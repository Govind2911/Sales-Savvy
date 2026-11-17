package com.example.salessavvy.dto;

import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
        @NotBlank(message = "Username is required")
        String username
) {
}

