package com.ezpark.monitor;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** 관제 이벤트 (입·출차, 빈자리, 보행자, 불법주차 등) – P3 에서 영상 인지 결과가 이 테이블에 적재된다 */
@Repository
@RequiredArgsConstructor
public class EventRepository {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final JdbcTemplate jdbc;

    public record ParkingEvent(Long id, Long lotId, String cameraId, String type, String title, String meta, String time) {
    }

    private static final RowMapper<ParkingEvent> MAPPER = (rs, i) -> new ParkingEvent(
            rs.getLong("id"), rs.getObject("lot_id", Long.class), rs.getString("camera_id"), rs.getString("ev_type"),
            rs.getString("title"), rs.getString("meta"), rs.getTimestamp("created_at").toLocalDateTime().format(ISO));

    public void insert(Long lotId, String cameraId, String type, String title, String meta, LocalDateTime at) {
        jdbc.update("INSERT INTO parking_events (lot_id, camera_id, ev_type, title, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                lotId, cameraId, type, title, meta, Timestamp.valueOf(at));
    }

    public List<ParkingEvent> findRecent(long afterId, int limit) {
        return jdbc.query("SELECT * FROM parking_events WHERE id > ? ORDER BY id DESC LIMIT ?", MAPPER, afterId, limit);
    }

    public int countSince(String type, LocalDateTime since) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM parking_events WHERE ev_type = ? AND created_at >= ?",
                Integer.class, type, Timestamp.valueOf(since));
        return count == null ? 0 : count;
    }

    /** 최근 keep 건만 남기고 정리 (TiDB Serverless 사용량 절약) */
    public void trim(int keep) {
        Long max = jdbc.queryForObject("SELECT MAX(id) FROM parking_events", Long.class);
        if (max != null && max > keep) {
            jdbc.update("DELETE FROM parking_events WHERE id <= ?", max - keep);
        }
    }
}
