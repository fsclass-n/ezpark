package com.ezpark.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LoginInterceptor(LoginInterceptor.Level.LOGIN))
                .addPathPatterns("/api/me/**", "/api/reservations/**");
        registry.addInterceptor(new LoginInterceptor(LoginInterceptor.Level.CONSOLE))
                .addPathPatterns("/api/dashboard/**", "/api/events/**");
        registry.addInterceptor(new LoginInterceptor(LoginInterceptor.Level.ADMIN))
                .addPathPatterns("/api/admin/**");
    }
}
