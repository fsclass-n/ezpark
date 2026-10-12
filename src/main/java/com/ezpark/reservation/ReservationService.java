package com.ezpark.reservation;

import com.ezpark.common.ApiException;
import com.ezpark.lot.LotRepository;
import com.ezpark.lot.ParkingLot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;

/** 예약 생성·취소 – 요금은 반드시 서버에서 다시 계산한다 (클라이언트 금액은 신뢰하지 않음) */
@Service
@RequiredArgsConstructor
public class ReservationService {

    public static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final Set<Integer> MINUTES = Set.of(60, 120, 180, 240, 360, 480, 720, 1440);
    private static final Set<String> PAY_METHODS = Set.of("신용카드", "카카오페이", "네이버페이", "토스페이");
    private static final Set<String> CAR_TYPES = Set.of("소형", "중형", "대형", "전기차");
    private static final Set<Integer> COUPONS = Set.of(0, 10, 30);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ReservationRepository reservationRepository;
    private final LotRepository lotRepository;

    public record Fee(int base, int evDiscount, int couponDiscount, int total) {
    }

    /** 요금 계산: 10분 환산 요금 × 시간, 1일 최대 요금 상한, 전기차 50% 감면, 쿠폰 할인 */
    public static Fee calculate(ParkingLot lot, int minutes, String carType, int couponRate) {
        int byTime = (int) Math.ceil(minutes / 10.0) * lot.getFee10();
        int base = lot.getDayMax() > 0 ? Math.min(lot.getDayMax() * (int) Math.ceil(minutes / 1440.0), byTime) : byTime;
        int ev = "전기차".equals(carType) ? Math.round(base * 0.5f) : 0;
        int coupon = Math.round((base - ev) * couponRate / 100f);
        if (couponRate == 30) {
            coupon = Math.min(coupon, 10_000);
        }
        return new Fee(base, ev, coupon, Math.max(0, base - ev - coupon));
    }

    @Transactional
    public Reservation create(Long userId, ReservationController.CreateRequest req) {
        ParkingLot lot = lotRepository.findById(req.lotId()).orElseThrow(() -> ApiException.badRequest("주차장을 선택해 주세요."));
        if (!MINUTES.contains(req.minutes())) throw ApiException.badRequest("이용 시간을 다시 선택해 주세요.");
        if (!PAY_METHODS.contains(req.payMethod())) throw ApiException.badRequest("결제 수단을 선택해 주세요.");
        if (!CAR_TYPES.contains(req.carType())) throw ApiException.badRequest("차종을 선택해 주세요.");
        if (!COUPONS.contains(req.couponRate())) throw ApiException.badRequest("사용할 수 없는 쿠폰입니다.");
        if (!req.agreeTerms() || !req.agreePrivacy()) throw ApiException.badRequest("필수 약관에 동의해 주세요.");

        LocalDateTime entryAt = validateEntry(req.date(), req.time());
        Fee fee = calculate(lot, req.minutes(), req.carType(), req.couponRate());
        Reservation r = Reservation.builder()
                .rsvNo(newRsvNo())
                .userId(userId)
                .lotId(lot.getId())
                .lotName(lot.getName())
                .slot(req.slot() == null || req.slot().isBlank() ? null : req.slot().trim())
                .entryAt(entryAt)
                .minutes(req.minutes())
                .plate(req.plate().replaceAll("\\s", ""))
                .carType(req.carType())
                .phone(req.phone().trim())
                .memo(req.memo() == null ? null : req.memo().trim())
                .payMethod(req.payMethod())
                .couponRate(req.couponRate())
                .baseFee(fee.base())
                .evDiscount(fee.evDiscount())
                .couponDiscount(fee.couponDiscount())
                .totalFee(fee.total())
                .status("RESERVED")
                .createdAt(LocalDateTime.now(KST))
                .build();
        reservationRepository.insert(r);
        return r;
    }

    public List<Reservation> findMine(Long userId) {
        return reservationRepository.findByUser(userId);
    }

    @Transactional
    public void cancel(Long userId, String rsvNo) {
        Reservation r = reservationRepository.findByRsvNo(rsvNo)
                .filter(x -> x.getUserId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("예약을 찾을 수 없습니다."));
        if (!"RESERVED".equals(r.getStatus())) throw ApiException.badRequest("이미 취소된 예약입니다.");
        if (!r.getEntryAt().isAfter(LocalDateTime.now(KST))) throw ApiException.badRequest("입차 시간이 지난 예약은 취소할 수 없습니다.");
        reservationRepository.cancel(r.getId());
    }

    /** 입차 일시: 오늘~13일 후, 06:00~23:30 의 30분 단위, 현재 시각 +30분 이후 */
    private LocalDateTime validateEntry(LocalDate date, String time) {
        LocalTime t;
        try {
            t = LocalTime.parse(time, DateTimeFormatter.ofPattern("HH:mm"));
        } catch (Exception e) {
            throw ApiException.badRequest("입차 시간을 선택해 주세요.");
        }
        LocalDate today = LocalDate.now(KST);
        if (date == null || date.isBefore(today) || date.isAfter(today.plusDays(13))) {
            throw ApiException.badRequest("입차 날짜는 오늘부터 13일 이내로 선택해 주세요.");
        }
        if (t.getMinute() % 30 != 0 || t.isBefore(LocalTime.of(6, 0))) {
            throw ApiException.badRequest("입차 시간은 06:00~23:30 사이 30분 단위로 선택해 주세요.");
        }
        LocalDateTime entryAt = LocalDateTime.of(date, t);
        if (entryAt.isBefore(LocalDateTime.now(KST).plusMinutes(30))) {
            throw ApiException.badRequest("입차 시간은 현재 시각 30분 이후로 선택해 주세요.");
        }
        return entryAt;
    }

    private String newRsvNo() {
        String prefix = "EZ" + LocalDate.now(KST).format(DateTimeFormatter.ofPattern("yyMMdd"));
        String no;
        do {
            no = prefix + String.format("%06d", RANDOM.nextInt(1_000_000));
        } while (reservationRepository.existsByRsvNo(no));
        return no;
    }
}
