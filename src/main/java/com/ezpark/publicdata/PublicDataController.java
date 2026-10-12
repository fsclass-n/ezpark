package com.ezpark.publicdata;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 관리자: 공공데이터 주차장 정보 동기화 (ADMIN 전용) */
@RestController
@RequiredArgsConstructor
public class PublicDataController {

    private final PublicParkingSyncService syncService;

    @PostMapping("/api/admin/public-data/sync")
    public PublicParkingSyncService.SyncResult sync(@RequestParam(defaultValue = "1") int pageNo,
                                                    @RequestParam(defaultValue = "100") int numOfRows,
                                                    @RequestParam(required = false) String keyword) {
        return syncService.sync(Math.max(pageNo, 1), Math.min(Math.max(numOfRows, 1), 1000), keyword);
    }
}
