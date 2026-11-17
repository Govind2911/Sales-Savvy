package com.example.salessavvy.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.salessavvy.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
