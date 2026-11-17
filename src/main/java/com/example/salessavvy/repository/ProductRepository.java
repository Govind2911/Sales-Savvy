package com.example.salessavvy.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.salessavvy.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
}
