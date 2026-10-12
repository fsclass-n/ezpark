package com.ezpark.admin;

import com.ezpark.board.BoardRepository;
import com.ezpark.common.ApiException;
import com.ezpark.common.LoginUser;
import com.ezpark.user.User;
import com.ezpark.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttribute;

import java.util.List;
import java.util.Set;

/** 관리자 API (ADMIN 전용 – WebConfig 인터셉터): 회원 · 기업 문의 · 공지 관리 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private static final Set<String> ROLES = Set.of("USER", "BIZ", "ADMIN");
    private static final Set<String> INQUIRY_STATUS = Set.of("접수", "상담중", "견적발송", "계약완료");
    private static final Set<String> NOTICE_CATEGORIES = Set.of("공지", "점검", "이벤트");

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;

    public record UserRow(Long id, String name, String email, String plate, String role, String status, String joined) {
        static UserRow of(User u) {
            return new UserRow(u.getId(), u.getName(), u.getEmail(), u.getPlate(), u.getRole(),
                    "DORMANT".equals(u.getStatus()) ? "휴면" : "정상",
                    u.getCreatedAt() == null ? "" : u.getCreatedAt().toLocalDate().toString());
        }
    }

    public record RoleRequest(@NotBlank String role) {
    }

    public record StatusRequest(@NotBlank String status) {
    }

    public record NoticeRequest(
            @NotBlank(message = "분류를 선택해 주세요.") String cat,
            @NotBlank(message = "제목을 입력해 주세요.") @Size(max = 80, message = "제목은 80자 이내로 입력해 주세요.") String title,
            @NotBlank(message = "내용을 입력해 주세요.") @Size(max = 4000) String body) {
    }

    /* ---------- 회원 ---------- */
    @GetMapping("/users")
    public List<UserRow> users() {
        return userRepository.findAll().stream().map(UserRow::of).toList();
    }

    @PatchMapping("/users/{id}/role")
    public UserRow changeRole(@SessionAttribute(LoginUser.SESSION_KEY) LoginUser me, @PathVariable Long id, @Valid @RequestBody RoleRequest req) {
        if (!ROLES.contains(req.role())) throw ApiException.badRequest("권한 값이 올바르지 않습니다.");
        if (me.id().equals(id)) throw ApiException.badRequest("본인의 권한은 변경할 수 없습니다.");
        userRepository.findById(id).orElseThrow(() -> ApiException.notFound("회원을 찾을 수 없습니다."));
        userRepository.updateRole(id, req.role());
        return userRepository.findById(id).map(UserRow::of).orElseThrow();
    }

    @PatchMapping("/users/{id}/status")
    public UserRow toggleStatus(@SessionAttribute(LoginUser.SESSION_KEY) LoginUser me, @PathVariable Long id) {
        if (me.id().equals(id)) throw ApiException.badRequest("본인 계정은 휴면 처리할 수 없습니다.");
        User u = userRepository.findById(id).orElseThrow(() -> ApiException.notFound("회원을 찾을 수 없습니다."));
        userRepository.updateStatus(id, "DORMANT".equals(u.getStatus()) ? "ACTIVE" : "DORMANT");
        return userRepository.findById(id).map(UserRow::of).orElseThrow();
    }

    /* ---------- 기업 문의 ---------- */
    @GetMapping("/inquiries")
    public List<BoardRepository.Inquiry> inquiries() {
        return boardRepository.findInquiries();
    }

    @PatchMapping("/inquiries/{id}/status")
    public ResponseEntity<Void> inquiryStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest req) {
        if (!INQUIRY_STATUS.contains(req.status())) throw ApiException.badRequest("상태 값이 올바르지 않습니다.");
        if (boardRepository.updateInquiryStatus(id, req.status()) == 0) throw ApiException.notFound("문의를 찾을 수 없습니다.");
        return ResponseEntity.noContent().build();
    }

    /* ---------- 공지 ---------- */
    @PostMapping("/notices")
    public ResponseEntity<List<BoardRepository.Notice>> createNotice(@Valid @RequestBody NoticeRequest req) {
        if (!NOTICE_CATEGORIES.contains(req.cat())) throw ApiException.badRequest("분류를 선택해 주세요.");
        boardRepository.insertNotice(req.cat(), req.title().trim(), req.body().trim());
        return ResponseEntity.status(HttpStatus.CREATED).body(boardRepository.findNotices());
    }

    @PatchMapping("/notices/{id}/pin")
    public List<BoardRepository.Notice> pin(@PathVariable Long id) {
        if (boardRepository.togglePin(id) == 0) throw ApiException.notFound("공지를 찾을 수 없습니다.");
        return boardRepository.findNotices();
    }

    @DeleteMapping("/notices/{id}")
    public List<BoardRepository.Notice> deleteNotice(@PathVariable Long id) {
        if (boardRepository.deleteNotice(id) == 0) throw ApiException.notFound("공지를 찾을 수 없습니다.");
        return boardRepository.findNotices();
    }
}
