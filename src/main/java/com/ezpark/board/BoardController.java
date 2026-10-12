package com.ezpark.board;

import com.ezpark.common.ApiException;
import com.ezpark.common.LoginUser;
import com.ezpark.common.Patterns;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;

/** 공개 게시판 API: 공지 · FAQ 조회, 1:1 문의 · 기업 도입 문의 접수 */
@RestController
@RequiredArgsConstructor
public class BoardController {

    private static final Set<String> QNA_CATEGORIES = Set.of("이용 문의", "예약·결제", "계정", "오류 신고", "기타");
    private static final Set<String> INDUSTRIES = Set.of("쇼핑몰", "병원", "오피스", "공공기관", "상가", "전시장", "기타");
    private static final Set<String> PLANS = Set.of("Starter", "Business", "Enterprise");

    private final BoardRepository boardRepository;

    public record QnaRequest(
            @NotBlank(message = "문의 유형을 선택해 주세요.") String category,
            @NotBlank(message = "이메일을 입력해 주세요.") @Email(message = "이메일을 확인해 주세요.") @Size(max = 120) String email,
            @NotBlank(message = "제목을 입력해 주세요.") @Size(max = 60, message = "제목은 60자 이내로 입력해 주세요.") String title,
            @NotBlank(message = "내용을 입력해 주세요.") @Size(min = 10, max = 4000, message = "내용은 10자 이상 입력해 주세요.") String body) {
    }

    public record InquiryRequest(
            @NotBlank(message = "기업명을 입력해 주세요.") @Size(max = 80) String company,
            @NotBlank(message = "업종을 선택해 주세요.") String industry,
            @NotBlank(message = "담당자명을 입력해 주세요.") @Size(min = 2, max = 40) String name,
            @NotBlank(message = "연락처를 입력해 주세요.") @Pattern(regexp = Patterns.TEL, message = "연락처 형식을 확인해 주세요.") String phone,
            @NotBlank(message = "이메일을 입력해 주세요.") @Email(message = "올바른 이메일을 입력해 주세요.") @Size(max = 120) String email,
            @Min(0) @Max(1_000_000) int slots,
            @NotBlank String plan,
            @Size(max = 1000, message = "문의 내용은 1000자 이내로 입력해 주세요.") String message,
            boolean agree) {
    }

    @GetMapping("/api/notices")
    public List<BoardRepository.Notice> notices() {
        return boardRepository.findNotices();
    }

    @PostMapping("/api/notices/{id}/view")
    public ResponseEntity<Void> view(@PathVariable Long id) {
        boardRepository.increaseViews(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/faqs")
    public List<BoardRepository.Faq> faqs() {
        return boardRepository.findFaqs();
    }

    @PostMapping("/api/qna")
    public ResponseEntity<Map<String, String>> qna(@Valid @RequestBody QnaRequest req, HttpServletRequest request) {
        if (!QNA_CATEGORIES.contains(req.category())) throw ApiException.badRequest("문의 유형을 선택해 주세요.");
        HttpSession session = request.getSession(false);
        LoginUser user = session == null ? null : (LoginUser) session.getAttribute(LoginUser.SESSION_KEY);
        boardRepository.insertQna(user == null ? null : user.id(), req.category(), req.email().trim(), req.title().trim(), req.body().trim());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "문의가 등록되었습니다."));
    }

    @PostMapping("/api/inquiries")
    public ResponseEntity<Map<String, String>> inquiry(@Valid @RequestBody InquiryRequest req) {
        if (!req.agree()) throw ApiException.badRequest("개인정보 수집·이용에 동의해 주세요.");
        if (!INDUSTRIES.contains(req.industry())) throw ApiException.badRequest("업종을 선택해 주세요.");
        if (!PLANS.contains(req.plan())) throw ApiException.badRequest("요금제를 선택해 주세요.");
        boardRepository.insertInquiry(req.company().trim(), req.industry(), req.name().trim(), req.phone().trim(), req.email().trim(),
                req.slots(), req.plan(), req.message() == null ? null : req.message().trim());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "도입 문의가 접수되었습니다."));
    }
}
