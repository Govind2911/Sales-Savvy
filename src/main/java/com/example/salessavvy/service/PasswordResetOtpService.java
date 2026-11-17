package com.example.salessavvy.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetOtpService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    @Value("${app.otp.expiration-minutes:5}")
    private long expirationMinutes;

    @Value("${app.otp.mail-enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public PasswordResetOtpService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    public void sendPasswordResetOtp(String username, String toEmail) {
        String otp = generateOtp();
        otpStorage.put(username, new OtpData(otp, LocalDateTime.now().plusMinutes(expirationMinutes)));

        if (mailEnabled) {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                throw new RuntimeException("Mail sender is not configured");
            }

            SimpleMailMessage message = new SimpleMailMessage();
            if (!fromEmail.isBlank()) {
                message.setFrom(fromEmail);
            }
            message.setTo(toEmail);
            message.setSubject("Password reset OTP");
            message.setText("Your password reset OTP is: " + otp
                    + "\n\nThis OTP is valid for " + expirationMinutes + " minutes.");
            mailSender.send(message);
        }

        System.out.println("Password reset OTP for " + username + " (" + toEmail + "): " + otp);
    }

    public boolean verifyOtp(String username, String otp) {
        OtpData otpData = otpStorage.get(username);
        if (otpData == null || otpData.expiryTime().isBefore(LocalDateTime.now())) {
            otpStorage.remove(username);
            return false;
        }

        boolean valid = otpData.otp().equals(otp);
        if (valid) {
            otpStorage.remove(username);
        }
        return valid;
    }

    private String generateOtp() {
        return String.valueOf(100000 + secureRandom.nextInt(900000));
    }

    private record OtpData(String otp, LocalDateTime expiryTime) {
    }
}

