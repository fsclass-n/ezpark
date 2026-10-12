package com.ezpark.common;

import java.io.Serializable;

/** 세션에 저장하는 로그인 사용자 정보 (비밀번호 등 민감정보는 담지 않는다) */
public record LoginUser(Long id, String email, String name, String role) implements Serializable {

    public static final String SESSION_KEY = "loginUser";

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }

    /** 관제센터(대시보드·영상 인지·AI 분석) 접근 가능: 관리자 또는 기업 회원 */
    public boolean canUseConsole() {
        return "ADMIN".equals(role) || "BIZ".equals(role);
    }
}
