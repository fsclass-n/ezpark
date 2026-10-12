package com.ezpark.monitor;

import com.ezpark.config.EzparkProperties;
import com.ezpark.lot.LotRepository;
import com.ezpark.lot.ParkingLot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 데모용 시뮬레이터 – 잔여면 변동과 관제 이벤트를 주기적으로 생성한다.
 * P3 에서 Python 영상 인지 파이프라인이 실제 이벤트를 적재하면 ezpark.simulator.enabled=false 로 끈다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ParkingSimulator {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final String HANGUL = "가나다라마거너더러머버서어저고노도로모보소오조구누두루무부수우주하허호";
    private static final String[][] TYPES = {
            // type, title, weight
            {"in", "차량 입차", "34"}, {"out", "차량 출차", "30"}, {"free", "빈자리 발생", "14"}, {"person", "보행자 감지", "9"},
            {"illegal", "불법·이중 주차 의심", "6"}, {"long", "장기 주차 (24h↑)", "5"}, {"cam", "카메라 프레임 지연", "2"}};
    private static final String[] CAMERAS = {"CAM-01", "CAM-02", "CAM-03", "CAM-04", "CAM-05", "CAM-06"};

    private final LotRepository lotRepository;
    private final EventRepository eventRepository;
    private final EzparkProperties props;
    private int ticks;

    @Scheduled(fixedDelayString = "${ezpark.simulator.interval-ms:5000}", initialDelay = 3000)
    public void tick() {
        if (!props.getSimulator().isEnabled()) {
            return;
        }
        try {
            List<ParkingLot> lots = lotRepository.findAll();
            if (lots.isEmpty()) {
                return;
            }
            ThreadLocalRandom r = ThreadLocalRandom.current();
            ParkingLot lot = lots.get(r.nextInt(lots.size()));
            int step = Math.max(1, Math.round(lot.getTotal() / 150f));
            int available = Math.max(0, Math.min(lot.getTotal(), lot.getAvailable() + r.nextInt(-step, step + 1)));
            lotRepository.updateAvailable(lot.getId(), available);

            String[] type = pickType(r);
            String floor = lot.getFloors().isEmpty() ? "1F" : lot.getFloors().get(r.nextInt(lot.getFloors().size()));
            String camera = CAMERAS[r.nextInt(CAMERAS.length)];
            String meta = switch (type[0]) {
                case "in" -> plate(r) + " · " + lot.getName() + " " + floor;
                case "out" -> plate(r) + " · 주차시간 " + r.nextInt(0, 6) + "시간 " + r.nextInt(1, 60) + "분";
                case "free" -> lot.getName() + " " + floor + " " + slot(r);
                case "person" -> camera + " · 통로 보행자 신뢰도 " + String.format("%.1f", 88 + r.nextDouble() * 11.5) + "%";
                case "illegal" -> camera + " · " + floor + " 통로 " + plate(r);
                case "long" -> plate(r) + " · " + lot.getName() + " " + floor + " " + slot(r);
                default -> camera + " · 지연 " + r.nextInt(300, 900) + "ms";
            };
            eventRepository.insert(lot.getId(), camera, type[0], type[1], meta, LocalDateTime.now(KST));
            if (++ticks % 60 == 0) {
                eventRepository.trim(props.getSimulator().getEventRetention());
            }
        } catch (Exception e) {
            log.warn("시뮬레이터 실행 실패: {}", e.getMessage());
        }
    }

    private String[] pickType(ThreadLocalRandom r) {
        int total = 0;
        for (String[] t : TYPES) total += Integer.parseInt(t[2]);
        int n = r.nextInt(total);
        for (String[] t : TYPES) {
            n -= Integer.parseInt(t[2]);
            if (n < 0) return t;
        }
        return TYPES[0];
    }

    private String plate(ThreadLocalRandom r) {
        return r.nextInt(10, 400) + String.valueOf(HANGUL.charAt(r.nextInt(HANGUL.length()))) + r.nextInt(1000, 10000);
    }

    private String slot(ThreadLocalRandom r) {
        return "ABCD".charAt(r.nextInt(4)) + "-" + String.format("%02d", r.nextInt(1, 29));
    }
}
