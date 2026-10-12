package com.ezpark.reservation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    private Long id;
    private String rsvNo;
    private Long userId;
    private Long lotId;
    private String lotName;
    private String slot;
    private LocalDateTime entryAt;
    private int minutes;
    private String plate;
    private String carType;
    private String phone;
    private String memo;
    private String payMethod;
    private int couponRate;
    private int baseFee;
    private int evDiscount;
    private int couponDiscount;
    private int totalFee;
    private String status;      // RESERVED / CANCELED
    private LocalDateTime createdAt;
}
