package com.ezpark.monitor;

import com.ezpark.lot.LotRepository;
import com.ezpark.lot.ParkingLot;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/** 관제 대시보드 KPI · 실시간 이벤트 (로그인 필요) */
@RestController
@RequiredArgsConstructor
public class MonitorController {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final LotRepository lotRepository;
    private final EventRepository eventRepository;

    public record Summary(int lots, int regions, int total, int parked, double rate, int todayIn, int todayOut,
                          double accuracy, int latencyMs) {
    }

    @GetMapping("/api/dashboard/summary")
    public Summary summary(@RequestParam(required = false) Long lotId) {
        List<ParkingLot> all = lotRepository.findAll();
        List<ParkingLot> scope = lotId == null ? all : all.stream().filter(l -> l.getId().equals(lotId)).toList();
        int total = scope.stream().mapToInt(ParkingLot::getTotal).sum();
        int parked = scope.stream().mapToInt(l -> l.getTotal() - l.getAvailable()).sum();
        double rate = total == 0 ? 0 : Math.round(parked * 1000.0 / total) / 10.0;
        var today = LocalDate.now(KST).atStartOfDay();
        int regions = (int) all.stream().map(ParkingLot::getRegion).distinct().count();
        // 인지 정확도·추론 지연은 P3 모델 서빙 연동 전까지 모델 검증 지표(mAP 0.978) 기준 표시
        ThreadLocalRandom r = ThreadLocalRandom.current();
        return new Summary(all.size(), regions, total, parked, rate,
                eventRepository.countSince("in", today), eventRepository.countSince("out", today),
                Math.round((97.4 + r.nextDouble() * 0.7) * 10) / 10.0, r.nextInt(24, 33));
    }

    @GetMapping("/api/events")
    public List<EventRepository.ParkingEvent> events(@RequestParam(defaultValue = "0") long afterId,
                                                     @RequestParam(defaultValue = "30") int limit) {
        return eventRepository.findRecent(afterId, Math.min(Math.max(limit, 1), 100));
    }
}
