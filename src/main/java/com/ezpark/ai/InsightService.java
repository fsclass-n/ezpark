package com.ezpark.ai;

import com.ezpark.config.EzparkProperties;
import com.ezpark.lot.LotRepository;
import com.ezpark.lot.ParkingLot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gemini 인사이트: API 키는 서버에서만 사용한다 (브라우저에 노출 금지).
 * 키가 없거나 호출에 실패하면 규칙 기반 답변(fallback)을 반환한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InsightService {

    private static final String SYSTEM_PROMPT = """
            당신은 스마트 주차관제 플랫폼 EzPark 의 데이터 분석 어시스턴트입니다.
            제공된 전국 공영주차장 현황 데이터만 근거로 한국어로 간결하게(10줄 이내) 답하세요.
            데이터에 없는 수치는 추정이라고 밝히고, 운영자가 바로 실행할 수 있는 제안을 포함하세요.
            마크다운 기호(**, ##, 표)는 쓰지 말고 일반 문장과 • 기호로만 작성하세요.
            """;

    private final EzparkProperties props;
    private final LotRepository lotRepository;

    public record Answer(String answer, String source) {
    }

    public Answer ask(String question) {
        List<ParkingLot> lots = lotRepository.findAll();
        EzparkProperties.Gemini gemini = props.getGemini();
        if (gemini.getApiKey() != null && !gemini.getApiKey().isBlank()) {
            // 429(요청 한도)·503(일시적 과부하)은 잠시 후 1회 재시도
            for (int attempt = 1; attempt <= 2; attempt++) {
                try {
                    String text = callGemini(gemini, question, context(lots));
                    if (text != null && !text.isBlank()) {
                        return new Answer(text.replace("**", "").replace("## ", "").trim(), "gemini");
                    }
                    break;
                } catch (HttpStatusCodeException e) {
                    boolean retry = attempt == 1 && (e.getStatusCode().value() == 429 || e.getStatusCode().value() == 503);
                    log.warn("Gemini 호출 실패({}){}", e.getStatusCode().value(), retry ? " – 재시도" : " – fallback 응답 사용");
                    if (!retry) break;
                    sleep(1500);
                } catch (Exception e) {
                    log.warn("Gemini 호출 실패 – fallback 응답 사용: {}", e.getMessage());
                    break;
                }
            }
        }
        return new Answer(fallback(question, lots), "fallback");
    }

    private String context(List<ParkingLot> lots) {
        return lots.stream()
                .map(l -> String.format("- %s(%s): 주차면 %d, 잔여 %d(점유율 %d%%), 요금 %s, 전기차 %s",
                        l.getName(), l.getRegion(), l.getTotal(), l.getAvailable(), occupancy(l), l.getFeeText(),
                        Boolean.TRUE.equals(l.getEv()) ? "가능" : "정보 없음"))
                .collect(Collectors.joining("\n"));
    }

    @SuppressWarnings("unchecked")
    private String callGemini(EzparkProperties.Gemini gemini, String question, String context) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(20_000);
        RestClient client = RestClient.builder().requestFactory(factory).baseUrl(gemini.getBaseUrl()).build();
        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", SYSTEM_PROMPT))),
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text",
                        "[현재 주차장 현황]\n" + context + "\n\n[질문]\n" + question)))),
                // Gemini 3.x 는 생각(thinking) 토큰도 출력 한도에 포함되므로 넉넉히 지정
                "generationConfig", Map.of("temperature", 0.4, "maxOutputTokens", 2048));
        Map<String, Object> res = client.post()
                .uri("/models/{model}:generateContent", gemini.getModel())
                .header("x-goog-api-key", gemini.getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);
        if (res == null) return null;
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) res.get("candidates");
        if (candidates == null || candidates.isEmpty()) return null;
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = content == null ? List.of() : (List<Map<String, Object>>) content.get("parts");
        return parts.stream().map(p -> String.valueOf(p.getOrDefault("text", ""))).collect(Collectors.joining());
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private int occupancy(ParkingLot l) {
        return l.getTotal() == 0 ? 0 : Math.round((1 - (float) l.getAvailable() / l.getTotal()) * 100);
    }

    /** 규칙 기반 답변 – 실제 DB 의 잔여면 데이터를 반영 */
    private String fallback(String q, List<ParkingLot> lots) {
        List<ParkingLot> busy = lots.stream().sorted(Comparator.comparingInt(this::occupancy).reversed()).limit(3).toList();
        List<ParkingLot> free = lots.stream().sorted(Comparator.comparingInt(this::occupancy)).limit(2).toList();
        String busyNames = busy.stream().map(l -> l.getName() + "(" + occupancy(l) + "%)").collect(Collectors.joining(", "));
        String freeNames = free.stream().map(l -> l.getName() + "(" + occupancy(l) + "%)").collect(Collectors.joining(", "));
        if (q.matches("(?s).*(혼잡|시간대|피크).*")) {
            return "[요약] 현재 혼잡 현황\n\n• 점유율 상위: " + busyNames + "\n• 여유: " + freeNames
                    + "\n• 평일 피크는 12~13시, 주말은 14~17시에 집중됩니다.\n\n→ 혼잡 주차장 방문 예정 고객에게 11시 30분 이전 사전 예약 알림 발송을 권장합니다.";
        }
        if (q.matches("(?s).*(전기차|EV|ev|충전).*")) {
            String evLots = lots.stream().filter(l -> Boolean.TRUE.equals(l.getEv())).map(ParkingLot::getName).collect(Collectors.joining(", "));
            return "[분석] 전기차 충전구역 현황\n\n• 충전 가능 확인 주차장: " + (evLots.isEmpty() ? "없음" : evLots)
                    + "\n• 나머지 주차장은 충전시설 정보가 확인되지 않아 현장 확인이 필요합니다.\n\n→ 충전 완료 후 장시간 점유 차량에 '이동 알림'을 보내 회전율을 높이세요.";
        }
        if (q.matches("(?s).*(쇼핑몰|전략|운영|기업).*")) {
            return "[제안] 운영 전략\n\n1. 피크 시간 층별 유도로 진입 대기 분산\n2. 혼잡 주차장(" + busy.get(0).getName()
                    + ")은 인근 공영주차장 연계 안내\n3. 행사·관광 시즌 사전 예약면 5% 운영\n\n예상 효과: 회전율 +18%, 관제 인력 -35% (도입 사례 기준 추정)";
        }
        if (q.matches("(?s).*(예측|리포트|다음).*")) {
            int total = lots.stream().mapToInt(ParkingLot::getTotal).sum();
            int parked = lots.stream().mapToInt(l -> l.getTotal() - l.getAvailable()).sum();
            return "[리포트] 수요 예측 요약\n\n• 현재 전체 점유율: " + (total == 0 ? 0 : Math.round(parked * 100f / total)) + "%\n• 만차 위험: "
                    + busyNames + "\n• 여유 예상: " + freeNames + "\n\n※ 정밀 예측은 P3 수요 예측 모델(scikit-learn) 연동 후 제공됩니다.";
        }
        return "\"" + q + "\"에 대한 답변입니다.\n\n현재 Gemini API 키가 설정되지 않아 규칙 기반 답변을 제공합니다. "
                + "GEMINI_API_KEY 를 설정하면 실시간 주차 데이터를 바탕으로 맞춤 답변을 생성합니다.\n\n추천 질문: 혼잡 시간대, 운영 전략, 전기차 충전, 수요 예측 리포트";
    }
}
