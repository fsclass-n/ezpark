package com.ezpark.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** application.yml 의 ezpark.* 설정 (비밀값은 환경변수 / .env 로 주입) */
@Getter
@Setter
@ConfigurationProperties(prefix = "ezpark")
public class EzparkProperties {

    private Admin admin = new Admin();
    private Simulator simulator = new Simulator();
    private Gemini gemini = new Gemini();
    private PublicData publicData = new PublicData();

    @Getter
    @Setter
    public static class Admin {
        /** 최초 기동 시 생성할 관리자 계정 (비밀번호가 비어 있으면 생성하지 않음) */
        private String email = "admin@ezpark.kr";
        private String password = "";
        private String name = "관리자";
    }

    @Getter
    @Setter
    public static class Simulator {
        /** 잔여면 변동·관제 이벤트 시뮬레이터 (P3 영상 인지 연동 전 데모용) */
        private boolean enabled = true;
        private long intervalMs = 5000;
        private int eventRetention = 500;
    }

    @Getter
    @Setter
    public static class Gemini {
        private String apiKey = "";
        private String model = "gemini-3.8-flash";
        private String baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    }

    @Getter
    @Setter
    public static class PublicData {
        /** 공공데이터포털 「전국주차장정보표준데이터」 인증키 (Decoding 키) */
        private String serviceKey = "";
        private String url = "https://api.data.go.kr/openapi/tn_pubr_prkplce_info_api";
    }
}
