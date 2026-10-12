package com.ezpark;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class EzparkApplication {

	public static void main(String[] args) {
		// 배포 서버(Render/EC2)가 UTC 여도 예약·이벤트 시간은 한국 시간 기준
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
		SpringApplication.run(EzparkApplication.class, args);
	}

}
