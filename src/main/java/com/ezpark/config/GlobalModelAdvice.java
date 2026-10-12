package com.ezpark.config;

import com.ezpark.common.LoginUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/** 모든 Thymeleaf 화면에서 ${loginUser} 로 로그인 사용자 정보를 사용할 수 있게 한다 */
@ControllerAdvice(annotations = Controller.class)
public class GlobalModelAdvice {

    @ModelAttribute("loginUser")
    public LoginUser loginUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        return session == null ? null : (LoginUser) session.getAttribute(LoginUser.SESSION_KEY);
    }
}
