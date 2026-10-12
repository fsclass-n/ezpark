package com.ezpark.reservation;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ReservationRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<Reservation> MAPPER = (rs, i) -> Reservation.builder()
            .id(rs.getLong("id"))
            .rsvNo(rs.getString("rsv_no"))
            .userId(rs.getLong("user_id"))
            .lotId(rs.getLong("lot_id"))
            .lotName(rs.getString("lot_name"))
            .slot(rs.getString("slot"))
            .entryAt(rs.getTimestamp("entry_at").toLocalDateTime())
            .minutes(rs.getInt("minutes"))
            .plate(rs.getString("plate"))
            .carType(rs.getString("car_type"))
            .phone(rs.getString("phone"))
            .memo(rs.getString("memo"))
            .payMethod(rs.getString("pay_method"))
            .couponRate(rs.getInt("coupon_rate"))
            .baseFee(rs.getInt("base_fee"))
            .evDiscount(rs.getInt("ev_discount"))
            .couponDiscount(rs.getInt("coupon_discount"))
            .totalFee(rs.getInt("total_fee"))
            .status(rs.getString("status"))
            .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
            .build();

    private static final String SELECT = "SELECT r.*, l.name AS lot_name FROM reservations r JOIN parking_lots l ON l.id = r.lot_id ";

    public boolean existsByRsvNo(String rsvNo) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM reservations WHERE rsv_no = ?", Integer.class, rsvNo);
        return count != null && count > 0;
    }

    public void insert(Reservation r) {
        jdbc.update("""
                INSERT INTO reservations (rsv_no, user_id, lot_id, slot, entry_at, minutes, plate, car_type, phone, memo, pay_method,
                    coupon_rate, base_fee, ev_discount, coupon_discount, total_fee, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RESERVED', ?)
                """,
                r.getRsvNo(), r.getUserId(), r.getLotId(), r.getSlot(), Timestamp.valueOf(r.getEntryAt()), r.getMinutes(), r.getPlate(),
                r.getCarType(), r.getPhone(), r.getMemo(), r.getPayMethod(), r.getCouponRate(), r.getBaseFee(), r.getEvDiscount(),
                r.getCouponDiscount(), r.getTotalFee(), Timestamp.valueOf(r.getCreatedAt()));
    }

    public Optional<Reservation> findByRsvNo(String rsvNo) {
        return jdbc.query(SELECT + "WHERE r.rsv_no = ?", MAPPER, rsvNo).stream().findFirst();
    }

    public List<Reservation> findByUser(Long userId) {
        return jdbc.query(SELECT + "WHERE r.user_id = ? ORDER BY r.entry_at DESC", MAPPER, userId);
    }

    public void cancel(Long id) {
        jdbc.update("UPDATE reservations SET status = 'CANCELED' WHERE id = ?", id);
    }
}
