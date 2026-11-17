package com.example.salessavvy.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.salessavvy.dto.AuthResponse;
import com.example.salessavvy.dto.ForgotPasswordRequest;
import com.example.salessavvy.dto.LoginRequest;
import com.example.salessavvy.dto.RegisterRequest;
import com.example.salessavvy.dto.ResetPasswordRequest;
import com.example.salessavvy.entity.User;
import com.example.salessavvy.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordResetOtpService passwordResetOtpService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       PasswordResetOtpService passwordResetOtpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.passwordResetOtpService = passwordResetOtpService;
    }

    public String register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User(
                request.name(),
                request.username(),
                request.email(),
                passwordEncoder.encode(request.password()),
                "USER"
        );

        userRepository.save(user);
        return "User registered successfully";
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.username(),
                        request.password()
                )
        );

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtService.generateToken(
                org.springframework.security.core.userdetails.User.builder()
                        .username(user.getUsername())
                        .password(user.getPassword())
                        .authorities("ROLE_" + user.getRole())
                        .build()
        );

        return new AuthResponse(token, "Bearer", user.getUsername(), user.getRole());
    }

    public String sendPasswordResetOtp(ForgotPasswordRequest request) {
        String loginId = request.username().trim();
        User user = userRepository.findByUsernameOrEmail(loginId, loginId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new RuntimeException("No email address is saved for this user");
        }

        passwordResetOtpService.sendPasswordResetOtp(user.getUsername(), user.getEmail());
        return "OTP sent successfully";
    }

    public String resetPassword(ResetPasswordRequest request) {
        String loginId = request.username().trim();
        String otp = request.otp().trim();
        User user = userRepository.findByUsernameOrEmail(loginId, loginId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordResetOtpService.verifyOtp(user.getUsername(), otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        return "Password reset successfully";
    }
}

