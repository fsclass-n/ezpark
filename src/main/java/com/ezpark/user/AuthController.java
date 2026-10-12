package com.ezpark.user;

import com.ezpark.common.ApiException;
import com.ezpark.common.LoginUser;
import com.ezpark.common.Patterns;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** 회원가입 · 로그인 · 로그아웃 (세션 기반, 비밀번호 BCrypt) */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public record RegisterRequest(
            @NotBlank(message = "이름을 입력해 주세요.") @Size(min = 2, max = 20, message = "이름은 2~20자로 입력해 주세요.") String name,
            @NotBlank(message = "이메일을 입력해 주세요.") @Email(message = "올바른 이메일 주소를 입력해 주세요.") @Size(max = 120) String email,
            @NotBlank(message = "비밀번호를 입력해 주세요.") @Pattern(regexp = Patterns.PASSWORD, message = "비밀번호는 영문·숫자·특수문자 포함 8자 이상이어야 합니다.") String password,
            @NotBlank(message = "휴대폰 번호를 입력해 주세요.") @Pattern(regexp = Patterns.PHONE, message = "휴대폰 번호 형식을 확인해 주세요.") String phone,
            @Pattern(regexp = "^$|" + Patterns.PLATE, message = "차량번호 형식을 확인해 주세요. (예: 12가3456)") String plate,
            String role,
            @Size(max = 80) String company,
            boolean agreeTerms,
            boolean agreePrivacy,
            boolean agreeMarketing) {
    }

    public record LoginRequest(
            @NotBlank(message = "이메일을 입력해 주세요.") String email,
            @NotBlank(message = "비밀번호를 입력해 주세요.") String password) {
    }

    public record MeResponse(Long id, String email, String name, String role, String phone, String plate, String company) {
        static MeResponse of(User u) {
            return new MeResponse(u.getId(), u.getEmail(), u.getName(), u.getRole(), u.getPhone(), u.getPlate(), u.getCompany());
        }
    }

    @PostMapping("/register")
    public MeResponse register(@Valid @RequestBody RegisterRequest req, HttpServletRequest request) {
        LoginUser user = authService.register(req);
        startSession(request, user);
        return me(user.id());
    }

    @PostMapping("/login")
    public MeResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest request) {
        LoginUser user = authService.login(req.email(), req.password());
        startSession(request, user);
        return me(user.id());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public MeResponse current(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        LoginUser user = session == null ? null : (LoginUser) session.getAttribute(LoginUser.SESSION_KEY);
        if (user == null) {
            throw ApiException.unauthorized("로그인이 필요합니다.");
        }
        return me(user.id());
    }

    @GetMapping("/check-email")
    public Map<String, Boolean> checkEmail(@RequestParam String email) {
        return Map.of("available", !userRepository.existsByEmail(email.trim().toLowerCase()));
    }

    /** 세션 고정 공격 방지를 위해 기존 세션을 폐기하고 새 세션을 발급한다 */
    private void startSession(HttpServletRequest request, LoginUser user) {
        HttpSession old = request.getSession(false);
        if (old != null) {
            old.invalidate();
        }
        request.getSession(true).setAttribute(LoginUser.SESSION_KEY, user);
    }

    private MeResponse me(Long id) {
        return userRepository.findById(id).map(MeResponse::of)
                .orElseThrow(() -> ApiException.unauthorized("회원 정보를 찾을 수 없습니다."));
    }
}
