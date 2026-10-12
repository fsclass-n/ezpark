package com.ezpark.member;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

/** 내 차량(vehicles) · 즐겨찾기(favorites) */
@Repository
@RequiredArgsConstructor
public class MemberRepository {

    private final JdbcTemplate jdbc;

    public record Vehicle(Long id, String plate, String model, String type, boolean main) {
    }

    public List<Vehicle> findVehicles(Long userId) {
        return jdbc.query("SELECT * FROM vehicles WHERE user_id = ? ORDER BY is_main DESC, id",
                (rs, i) -> new Vehicle(rs.getLong("id"), rs.getString("plate"), rs.getString("model"), rs.getString("car_type"), rs.getBoolean("is_main")),
                userId);
    }

    public int countVehicles(Long userId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM vehicles WHERE user_id = ?", Integer.class, userId);
        return count == null ? 0 : count;
    }

    public boolean existsVehicle(Long userId, String plate) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM vehicles WHERE user_id = ? AND plate = ?", Integer.class, userId, plate);
        return count != null && count > 0;
    }

    public void insertVehicle(Long userId, String plate, String model, String type, boolean main) {
        jdbc.update("INSERT INTO vehicles (user_id, plate, model, car_type, is_main) VALUES (?, ?, ?, ?, ?)", userId, plate, model, type, main);
    }

    public int deleteVehicle(Long userId, Long id) {
        return jdbc.update("DELETE FROM vehicles WHERE id = ? AND user_id = ?", id, userId);
    }

    public int setMainVehicle(Long userId, Long id) {
        int found = jdbc.update("UPDATE vehicles SET is_main = TRUE WHERE id = ? AND user_id = ?", id, userId);
        if (found > 0) {
            jdbc.update("UPDATE vehicles SET is_main = FALSE WHERE user_id = ? AND id <> ?", userId, id);
        }
        return found;
    }

    /** 대표 차량이 삭제된 경우 가장 먼저 등록한 차량을 대표로 지정 */
    public void ensureMainVehicle(Long userId) {
        Integer mains = jdbc.queryForObject("SELECT COUNT(*) FROM vehicles WHERE user_id = ? AND is_main = TRUE", Integer.class, userId);
        if (mains != null && mains == 0) {
            jdbc.update("UPDATE vehicles SET is_main = TRUE WHERE id = (SELECT id FROM (SELECT MIN(id) AS id FROM vehicles WHERE user_id = ?) t)", userId);
        }
    }

    public List<Long> findFavoriteLotIds(Long userId) {
        return jdbc.queryForList("SELECT lot_id FROM favorites WHERE user_id = ? ORDER BY created_at", Long.class, userId);
    }

    public void addFavorite(Long userId, Long lotId) {
        Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM favorites WHERE user_id = ? AND lot_id = ?", Integer.class, userId, lotId);
        if (exists == null || exists == 0) {
            jdbc.update("INSERT INTO favorites (user_id, lot_id) VALUES (?, ?)", userId, lotId);
        }
    }

    public void removeFavorite(Long userId, Long lotId) {
        jdbc.update("DELETE FROM favorites WHERE user_id = ? AND lot_id = ?", userId, lotId);
    }
}
