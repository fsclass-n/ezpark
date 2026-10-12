package com.ezpark.config;

import com.ezpark.common.LoginUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;

/** REST API 접근 제어: 로그인 필요 / 관제센터(ADMIN·BIZ) / 관리자 전용(ADMIN) */
@RequiredArgsConstructor
public class LoginInterceptor implements HandlerInterceptor {

    public enum Level { LOGIN, CONSOLE, ADMIN }

    private final Level level;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HttpSession session = request.getSession(false);
        LoginUser user = session == null ? null : (LoginUser) session.getAttribute(LoginUser.SESSION_KEY);
        if (user == null) {
            return reject(response, HttpServletResponse.SC_UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (level == Level.ADMIN && !user.isAdmin()) {
            return reject(response, HttpServletResponse.SC_FORBIDDEN, "관리자만 이용할 수 있습니다.");
        }
        if (level == Level.CONSOLE && !user.canUseConsole()) {
            return reject(response, HttpServletResponse.SC_FORBIDDEN, "관제센터는 관리자 또는 기업 회원만 이용할 수 있습니다.");
        }
        return true;
    }

    private boolean reject(HttpServletResponse response, int status, String message) throws Exception {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"message\":\"" + message + "\"}");
        return false;
    }
}
