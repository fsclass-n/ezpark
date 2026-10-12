package com.ezpark;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class ApiIntegrationTest {

    @Autowired
    WebApplicationContext context;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    private String registerJson(String email, String password) {
        return """
                {"name":"테스터","email":"%s","password":"%s","phone":"010-1234-5678","plate":"12가3456",
                 "role":"USER","agreeTerms":true,"agreePrivacy":true,"agreeMarketing":false}
                """.formatted(email, password);
    }

    private MockHttpSession register() throws Exception {
        MockHttpSession session = new MockHttpSession();
        String email = "u" + UUID.randomUUID().toString().substring(0, 8) + "@ez.kr";
        return (MockHttpSession) mvc.perform(post("/api/auth/register").session(session)
                        .contentType(MediaType.APPLICATION_JSON).content(registerJson(email, "abc12345!")))
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession();
    }

    @Test
    @DisplayName("전국 공영주차장 10곳 초기 데이터 조회")
    void lots() throws Exception {
        mvc.perform(get("/api/lots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(10)))
                .andExpect(jsonPath("$[0].name").value("세종로 공영주차장"))
                .andExpect(jsonPath("$[0].floors[0]").value("B1"));
    }

    @Test
    @DisplayName("로그인 없이 보호된 API 접근 시 401")
    void unauthorized() throws Exception {
        mvc.perform(get("/api/reservations/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("회원가입 → 내 정보 조회, 중복 이메일 409, 약한 비밀번호 400")
    void registerFlow() throws Exception {
        MockHttpSession session = register();
        mvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"));

        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(registerJson("dup@ez.kr", "abc12345!")))
                .andExpect(status().isOk());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(registerJson("dup@ez.kr", "abc12345!")))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(registerJson("weak@ez.kr", "12345678")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("비밀번호")));
    }

    @Test
    @DisplayName("잘못된 비밀번호 로그인 401 / 샘플 계정(LOCKED)은 로그인 불가")
    void loginFail() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"admin@ezpark.kr\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"user01@ezpark.kr\",\"password\":\"anything\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("예약 생성 시 서버가 요금을 계산하고, 잘못된 차량번호는 400")
    void reservation() throws Exception {
        MockHttpSession session = register();
        String date = LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(1).toString();
        String body = """
                {"lotId":4,"slot":"지상-A03","date":"%s","time":"10:00","minutes":120,"plate":"%s","phone":"010-1234-5678",
                 "carType":"전기차","memo":"","payMethod":"신용카드","couponRate":30,"agreeTerms":true,"agreePrivacy":true}
                """;
        mvc.perform(post("/api/reservations").session(session).contentType(MediaType.APPLICATION_JSON).content(body.formatted(date, "12가3456")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.total").value(1680))
                .andExpect(jsonPath("$.upcoming").value(true));
        mvc.perform(get("/api/reservations/me").session(session))
                .andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(post("/api/reservations").session(session).contentType(MediaType.APPLICATION_JSON).content(body.formatted(date, "ABC123")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("일반 회원은 관리자 API 403, 관리자 페이지는 로그인으로 이동")
    void adminAccess() throws Exception {
        MockHttpSession session = register();
        mvc.perform(get("/api/admin/users").session(session)).andExpect(status().isForbidden());
        mvc.perform(get("/api/dashboard/summary").session(session)).andExpect(status().isForbidden());
        mvc.perform(get("/pages/admin.html")).andExpect(redirectedUrl("/pages/login.html?redirect=pages/admin.html"));

        MockHttpSession admin = (MockHttpSession) mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@ezpark.kr\",\"password\":\"test-admin-1!\"}"))
                .andExpect(status().isOk()).andReturn().getRequest().getSession();
        mvc.perform(get("/api/admin/users").session(admin)).andExpect(status().isOk());
        mvc.perform(get("/pages/admin.html").session(admin)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Gemini 키가 없으면 규칙 기반 답변(fallback)")
    void insightFallback() throws Exception {
        MockHttpSession admin = (MockHttpSession) mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@ezpark.kr\",\"password\":\"test-admin-1!\"}"))
                .andReturn().getRequest().getSession();
        mvc.perform(post("/api/dashboard/insight").session(admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"전기차 충전 현황 알려줘\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("fallback"))
                .andExpect(jsonPath("$.answer", containsString("화성행궁")));
    }
}
