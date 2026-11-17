package com.example.salessavvy.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.salessavvy.entity.PaymentTransaction;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
}
