package com.ezpark.config;

import com.ezpark.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * 기동 시 DB 준비 (스케줄러 시작 전에 실행되도록 SmartInitializingSingleton 사용)
 * 1) db/schema.sql  : 매번 실행 (CREATE TABLE IF NOT EXISTS)
 * 2) db/seed.sql    : app_seed 테이블에 기록하여 1회만 실행
 * 3) 관리자 계정    : ezpark.admin.password 가 설정된 경우에만 생성
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DbInitializer implements SmartInitializingSingleton {

    private static final String SEED_NAME = "seed-v1";

    private final DataSource dataSource;
    private final JdbcTemplate jdbc;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EzparkProperties props;

    @Override
    public void afterSingletonsInstantiated() {
        run("db/schema.sql");
        Integer applied = jdbc.queryForObject("SELECT COUNT(*) FROM app_seed WHERE name = ?", Integer.class, SEED_NAME);
        if (applied == null || applied == 0) {
            run("db/seed.sql");
            jdbc.update("INSERT INTO app_seed (name) VALUES (?)", SEED_NAME);
            log.info("초기 데이터({})를 적재했습니다.", SEED_NAME);
        }
        createAdmin();
    }

    private void run(String path) {
        new ResourceDatabasePopulator(false, false, "UTF-8", new ClassPathResource(path)).execute(dataSource);
    }

    private void createAdmin() {
        EzparkProperties.Admin admin = props.getAdmin();
        if (admin.getPassword() == null || admin.getPassword().isBlank()) {
            log.warn("ezpark.admin.password(EZPARK_ADMIN_PASSWORD)가 비어 있어 관리자 계정을 생성하지 않았습니다.");
            return;
        }
        if (userRepository.findByEmail(admin.getEmail()).isEmpty()) {
            userRepository.insertAdmin(admin.getEmail(), passwordEncoder.encode(admin.getPassword()), admin.getName());
            log.info("관리자 계정 {} 을(를) 생성했습니다.", admin.getEmail());
        }
    }
}
