package com.ezpark.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    private Long id;
    private String email;
    private String passwordHash;
    private String name;
    private String phone;
    private String plate;
    private String role;      // USER / BIZ / ADMIN
    private String company;
    private String status;    // ACTIVE / DORMANT
    private boolean marketing;
    private LocalDateTime createdAt;
}
