package com.ezpark.reservation;

import com.ezpark.lot.ParkingLot;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FeeCalculationTest {

    private ParkingLot lot(int fee10, int dayMax) {
        return ParkingLot.builder().fee10(fee10).dayMax(dayMax).build();
    }

    @Test
    @DisplayName("10분 환산 요금 × 이용 시간")
    void byTime() {
        ReservationService.Fee fee = ReservationService.calculate(lot(860, 30_900), 120, "중형", 0);
        assertThat(fee.base()).isEqualTo(12 * 860);
        assertThat(fee.total()).isEqualTo(10_320);
    }

    @Test
    @DisplayName("1일 최대 요금을 넘지 않는다")
    void dayMaxCap() {
        ReservationService.Fee fee = ReservationService.calculate(lot(860, 30_900), 720, "중형", 0);
        assertThat(fee.base()).isEqualTo(30_900);
    }

    @Test
    @DisplayName("전기차 50% 감면 후 쿠폰 30% (최대 1만원)")
    void evAndCoupon() {
        // 화성행궁: 10분 400원, 2시간 → 4,800원 → 전기차 -2,400 → 쿠폰 30% -720 → 1,680원
        ReservationService.Fee fee = ReservationService.calculate(lot(400, 14_000), 120, "전기차", 30);
        assertThat(fee.evDiscount()).isEqualTo(2_400);
        assertThat(fee.couponDiscount()).isEqualTo(720);
        assertThat(fee.total()).isEqualTo(1_680);
    }

    @Test
    @DisplayName("30% 쿠폰 할인은 최대 1만원")
    void couponLimit() {
        ReservationService.Fee fee = ReservationService.calculate(lot(1_000, 0), 720, "중형", 30);
        assertThat(fee.base()).isEqualTo(72_000);
        assertThat(fee.couponDiscount()).isEqualTo(10_000);
    }

    @Test
    @DisplayName("무료 주차장은 0원")
    void free() {
        assertThat(ReservationService.calculate(lot(0, 0), 1440, "대형", 10).total()).isZero();
    }
}
