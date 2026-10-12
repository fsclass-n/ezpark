package com.ezpark.lot;

import com.ezpark.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 주차장 조회(공개) / 등록·수정·삭제(관리자) */
@RestController
@RequiredArgsConstructor
public class LotController {

    private static final List<String> TYPES = List.of("노외", "노상", "부설");
    /** 신규 주차장 좌표 기본값(서울시청) – 공공데이터 동기화 시 실제 좌표로 갱신 */
    private static final double HOME_LAT = 37.5663, HOME_LNG = 126.9779;

    private final LotRepository lotRepository;

    public record LotRequest(
            @NotBlank(message = "주차장명을 입력해 주세요.") @Size(max = 100) String name,
            @NotBlank(message = "주소를 입력해 주세요.") @Size(max = 200) String addr,
            @NotBlank(message = "유형을 선택해 주세요.") String type,
            @NotBlank(message = "시·도를 입력해 주세요.") @Size(max = 20) String region,
            @Min(value = 1, message = "주차면수는 1 이상이어야 합니다.") @Max(100000) int total,
            @Min(value = 0, message = "요금은 0 이상이어야 합니다.") @Max(100000) int fee10,
            Boolean ev) {
    }

    @GetMapping("/api/lots")
    public List<ParkingLot> list() {
        return lotRepository.findAll();
    }

    @GetMapping("/api/lots/{id}")
    public ParkingLot get(@PathVariable Long id) {
        return lotRepository.findById(id).orElseThrow(() -> ApiException.notFound("주차장을 찾을 수 없습니다."));
    }

    @PostMapping("/api/admin/lots")
    public ResponseEntity<ParkingLot> create(@Valid @RequestBody LotRequest req) {
        validateType(req.type());
        String fee = feeShort(req.fee10());
        Long id = lotRepository.insert(ParkingLot.builder()
                .name(req.name().trim()).region(req.region().trim()).area("").addr(req.addr().trim()).type(req.type())
                .total(req.total()).available(req.total()).fee10(req.fee10()).feeShort(fee).feeText(fee).dayMax(0)
                .hours("현장 확인").ev(Boolean.TRUE.equals(req.ev()) ? Boolean.TRUE : null)
                .lat(HOME_LAT).lng(HOME_LNG).photo("garageExit").floors(List.of("B1")).tags(List.of()).dataSource("ADMIN")
                .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(get(id));
    }

    @PutMapping("/api/admin/lots/{id}")
    public ParkingLot update(@PathVariable Long id, @Valid @RequestBody LotRequest req) {
        validateType(req.type());
        ParkingLot data = ParkingLot.builder()
                .name(req.name().trim()).region(req.region().trim()).addr(req.addr().trim()).type(req.type())
                .total(req.total()).fee10(req.fee10()).feeShort(feeShort(req.fee10()))
                .ev(Boolean.TRUE.equals(req.ev()) ? Boolean.TRUE : null)
                .build();
        if (lotRepository.updateBasic(id, data) == 0) {
            throw ApiException.notFound("주차장을 찾을 수 없습니다.");
        }
        return get(id);
    }

    @DeleteMapping("/api/admin/lots/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (lotRepository.delete(id) == 0) {
            throw ApiException.notFound("주차장을 찾을 수 없습니다.");
        }
        return ResponseEntity.noContent().build();
    }

    private void validateType(String type) {
        if (!TYPES.contains(type)) {
            throw ApiException.badRequest("유형은 노외·노상·부설 중 하나여야 합니다.");
        }
    }

    private String feeShort(int fee10) {
        return fee10 == 0 ? "무료" : String.format("10분 %,d원", fee10);
    }
}
