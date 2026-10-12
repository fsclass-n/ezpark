package com.ezpark.lot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/** 공영주차장 – JSON 필드명은 프런트엔드 EZ_DATA.lots 와 동일하게 맞춘다 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingLot {

    private Long id;
    private String externalNo;
    private String name;
    private String region;
    private String area;
    private String addr;
    private String type;        // 노외 / 노상 / 부설
    private int total;
    private int available;
    private int fee10;          // 예약 금액 추정용 10분 환산 요금
    private String feeShort;
    private String feeText;
    private int dayMax;         // 0 = 정보 없음 / 무료
    private String hours;
    private String manager;
    private String tel;
    private Boolean ev;         // null = 확인되지 않음
    private Boolean disabled;
    private double lat;
    private double lng;
    private String photo;
    private List<String> floors;
    private List<String> tags;
    private String dataSource;  // SEED / PUBLIC / ADMIN
}
