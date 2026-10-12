package com.ezpark.web;

import com.ezpark.common.LoginUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Thymeleaf 화면 – 프런트엔드(P1)와 같은 URL 구조(/index.html, /pages/*.html)를 유지해
 * 상대경로 링크·스크립트를 그대로 사용한다.
 */
@Controller
public class PageController {

    enum Access { PUBLIC, LOGIN, CONSOLE, ADMIN }

    record Page(String title, Access access) {
    }

    private static final Map<String, Page> PAGES = Map.ofEntries(
            Map.entry("find", new Page("주차장 찾기", Access.PUBLIC)),
            Map.entry("guide", new Page("주차 유도", Access.PUBLIC)),
            Map.entry("reservation", new Page("예약·결제", Access.LOGIN)),
            Map.entry("mypage", new Page("마이페이지", Access.LOGIN)),
            Map.entry("dashboard", new Page("관제 대시보드", Access.CONSOLE)),
            Map.entry("cctv", new Page("영상 인지 모니터링", Access.CONSOLE)),
            Map.entry("analysis", new Page("K-AI 데이터 분석", Access.CONSOLE)),
            Map.entry("admin", new Page("관리자", Access.ADMIN)),
            Map.entry("enterprise", new Page("기업 솔루션", Access.PUBLIC)),
            Map.entry("support", new Page("고객지원", Access.PUBLIC)),
            Map.entry("login", new Page("로그인", Access.PUBLIC)),
            Map.entry("register", new Page("회원가입", Access.PUBLIC)));

    @GetMapping({"/", "/index.html"})
    public String index(Model model) {
        model.addAttribute("page", "home");
        return "index";
    }

    @GetMapping("/pages/{name:[a-z]+}.html")
    public String page(@PathVariable String name, HttpServletRequest request, Model model) {
        HttpSession session = request.getSession(false);
        LoginUser user = session == null ? null : (LoginUser) session.getAttribute(LoginUser.SESSION_KEY);
        Page page = PAGES.get(name);
        if (page == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        boolean allowed = switch (page.access()) {
            case PUBLIC -> true;
            case LOGIN -> user != null;
            case CONSOLE -> user != null && user.canUseConsole();
            case ADMIN -> user != null && user.isAdmin();
        };
        if (!allowed) {
            String redirect = "pages/" + name + ".html";
            return user == null
                    ? "redirect:/pages/login.html?redirect=" + redirect
                    : "redirect:/pages/login.html?denied=1&redirect=" + redirect;
        }
        model.addAttribute("page", name);
        model.addAttribute("title", page.title());
        return "pages/" + name;
    }
}
