package com.ezpark.user;

import com.ezpark.common.ApiException;
import com.ezpark.common.LoginUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Transactional
    public LoginUser register(AuthController.RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        String role = "BIZ".equals(req.role()) ? "BIZ" : "USER";
        if (!req.agreeTerms() || !req.agreePrivacy()) {
            throw ApiException.badRequest("필수 약관에 동의해 주세요.");
        }
        if ("BIZ".equals(role) && !StringUtils.hasText(req.company())) {
            throw ApiException.badRequest("기업 회원은 회사명을 입력해 주세요.");
        }
        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("이미 사용 중인 이메일입니다.");
        }
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(req.password()))
                .name(req.name().trim())
                .phone(req.phone().trim())
                .plate(StringUtils.hasText(req.plate()) ? req.plate().replaceAll("\\s", "") : null)
                .role(role)
                .company("BIZ".equals(role) ? req.company().trim() : null)
                .marketing(req.agreeMarketing())
                .build();
        Long id = userRepository.insert(user);
        return new LoginUser(id, user.getEmail(), user.getName(), role);
    }

    public LoginUser login(String email, String password) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .filter(u -> matches(password, u.getPasswordHash()))
                .orElseThrow(() -> ApiException.unauthorized("이메일 또는 비밀번호가 올바르지 않습니다."));
        if ("DORMANT".equals(user.getStatus())) {
            throw ApiException.forbidden("휴면 계정입니다. 고객센터에 문의해 주세요.");
        }
        return new LoginUser(user.getId(), user.getEmail(), user.getName(), user.getRole());
    }

    /** 샘플 계정(password_hash = 'LOCKED')처럼 BCrypt 형식이 아니면 로그인 불가 */
    private boolean matches(String raw, String hash) {
        return hash != null && hash.startsWith("$2") && passwordEncoder.matches(raw, hash);
    }
}
