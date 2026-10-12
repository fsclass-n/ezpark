package com.ezpark.reservation;

import com.ezpark.common.LoginUser;
import com.ezpark.common.Patterns;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttribute;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** 예약 (로그인 필요 – WebConfig 인터셉터) */
@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ReservationService reservationService;

    public record CreateRequest(
            @NotNull(message = "주차장을 선택해 주세요.") Long lotId,
            @Size(max = 20) @Pattern(regexp = "^$|^[A-Za-z0-9가-힣-]{1,20}$", message = "주차면 형식이 올바르지 않습니다.") String slot,
            @NotNull(message = "입차 날짜를 선택해 주세요.") LocalDate date,
            @NotBlank(message = "입차 시간을 선택해 주세요.") String time,
            int minutes,
            @NotBlank(message = "차량번호를 입력해 주세요.") @Pattern(regexp = Patterns.PLATE, message = "올바른 차량번호 형식이 아닙니다. (예: 12가3456)") String plate,
            @NotBlank(message = "연락처를 입력해 주세요.") @Pattern(regexp = Patterns.PHONE, message = "휴대폰 번호를 확인해 주세요.") String phone,
            @NotBlank(message = "차종을 선택해 주세요.") String carType,
            @Size(max = 200, message = "요청사항은 200자 이내로 입력해 주세요.") String memo,
            @NotBlank(message = "결제 수단을 선택해 주세요.") String payMethod,
            int couponRate,
            boolean agreeTerms,
            boolean agreePrivacy) {
    }

    public record ReservationResponse(String rsvNo, Long lotId, String lot, String slot, String entryAt, String date, String time,
                                      int minutes, String plate, String carType, String payMethod, int baseFee, int evDiscount,
                                      int couponDiscount, int total, String status, String statusText, boolean upcoming) {
        static ReservationResponse of(Reservation r) {
            LocalDateTime now = LocalDateTime.now(ReservationService.KST);
            boolean active = "RESERVED".equals(r.getStatus());
            boolean ended = r.getEntryAt().plusMinutes(r.getMinutes()).isBefore(now);
            String text = !active ? "취소" : ended ? "이용완료" : "예약";
            return new ReservationResponse(r.getRsvNo(), r.getLotId(), r.getLotName(), r.getSlot(), r.getEntryAt().format(DT),
                    r.getEntryAt().toLocalDate().toString(), r.getEntryAt().toLocalTime().toString(), r.getMinutes(), r.getPlate(),
                    r.getCarType(), r.getPayMethod(), r.getBaseFee(), r.getEvDiscount(), r.getCouponDiscount(), r.getTotalFee(),
                    r.getStatus(), text, active && !ended);
        }
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> create(@SessionAttribute(LoginUser.SESSION_KEY) LoginUser user,
                                                      @Valid @RequestBody CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ReservationResponse.of(reservationService.create(user.id(), req)));
    }

    @GetMapping("/me")
    public List<ReservationResponse> mine(@SessionAttribute(LoginUser.SESSION_KEY) LoginUser user) {
        return reservationService.findMine(user.id()).stream().map(ReservationResponse::of).toList();
    }

    @DeleteMapping("/{rsvNo}")
    public ResponseEntity<Void> cancel(@SessionAttribute(LoginUser.SESSION_KEY) LoginUser user, @PathVariable String rsvNo) {
        reservationService.cancel(user.id(), rsvNo);
        return ResponseEntity.noContent().build();
    }
}
