package com.ezpark.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** AI 데이터 분석 화면의 Gemini 어시스턴트 (관제센터 – 로그인 필요) */
@RestController
@RequiredArgsConstructor
public class InsightController {

    private final InsightService insightService;

    public record InsightRequest(@NotBlank(message = "질문을 입력해 주세요.") @Size(max = 500, message = "질문은 500자 이내로 입력해 주세요.") String question) {
    }

    @PostMapping("/api/dashboard/insight")
    public InsightService.Answer insight(@Valid @RequestBody InsightRequest req) {
        return insightService.ask(req.question().trim());
    }
}
