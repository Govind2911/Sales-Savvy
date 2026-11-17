package com.example.salessavvy.dto;

public record CreatePaymentOrderResponse(
        Long localOrderId,
        String razorpayOrderId,
        long amount,
        String currency,
        String keyId
) {
}
