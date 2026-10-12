package com.ezpark.lot;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.ArgumentPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class LotRepository {

    private final JdbcTemplate jdbc;

    private static List<String> split(String s) {
        return s == null || s.isBlank() ? List.of() : Arrays.stream(s.split(",")).map(String::trim).filter(v -> !v.isEmpty()).toList();
    }

    private static final RowMapper<ParkingLot> MAPPER = (rs, i) -> ParkingLot.builder()
            .id(rs.getLong("id"))
            .externalNo(rs.getString("external_no"))
            .name(rs.getString("name"))
            .region(rs.getString("region"))
            .area(rs.getString("area"))
            .addr(rs.getString("addr"))
            .type(rs.getString("lot_type"))
            .total(rs.getInt("total"))
            .available(rs.getInt("available"))
            .fee10(rs.getInt("fee10"))
            .feeShort(rs.getString("fee_short"))
            .feeText(rs.getString("fee_text"))
            .dayMax(rs.getInt("day_max"))
            .hours(rs.getString("hours"))
            .manager(rs.getString("manager"))
            .tel(rs.getString("tel"))
            .ev(rs.getObject("ev", Boolean.class))
            .disabled(rs.getObject("disabled", Boolean.class))
            .lat(rs.getDouble("lat"))
            .lng(rs.getDouble("lng"))
            .photo(rs.getString("photo"))
            .floors(split(rs.getString("floors")))
            .tags(split(rs.getString("tags")))
            .dataSource(rs.getString("data_source"))
            .build();

    public List<ParkingLot> findAll() {
        return jdbc.query("SELECT * FROM parking_lots ORDER BY id", MAPPER);
    }

    public Optional<ParkingLot> findById(Long id) {
        return jdbc.query("SELECT * FROM parking_lots WHERE id = ?", MAPPER, id).stream().findFirst();
    }

    public Long insert(ParkingLot l) {
        Object[] args = {l.getExternalNo(), l.getName(), l.getRegion(), l.getArea(), l.getAddr(), l.getType(), l.getTotal(), l.getAvailable(),
                l.getFee10(), l.getFeeShort(), l.getFeeText(), l.getDayMax(), l.getHours(), l.getManager(), l.getTel(), l.getEv(),
                l.getDisabled(), l.getLat(), l.getLng(), l.getPhoto(), join(l.getFloors()), join(l.getTags()), l.getDataSource()};
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement("""
                    INSERT INTO parking_lots (external_no, name, region, area, addr, lot_type, total, available, fee10, fee_short, fee_text,
                        day_max, hours, manager, tel, ev, disabled, lat, lng, photo, floors, tags, data_source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, new String[]{"id"});
            new ArgumentPreparedStatementSetter(args).setValues(ps);
            return ps;
        }, kh);
        return Objects.requireNonNull(kh.getKey()).longValue();
    }

    /** 관리자 수정: 기본 정보만 변경 (잔여면·좌표는 유지) */
    public int updateBasic(Long id, ParkingLot l) {
        return jdbc.update("""
                UPDATE parking_lots SET name = ?, region = ?, addr = ?, lot_type = ?, total = ?,
                    available = LEAST(available, ?), fee10 = ?, fee_short = ?, ev = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                l.getName(), l.getRegion(), l.getAddr(), l.getType(), l.getTotal(), l.getTotal(), l.getFee10(), l.getFeeShort(), l.getEv(), id);
    }

    /** 공공데이터 동기화: 주차장관리번호(external_no) 기준 갱신 */
    public int updateFromPublic(ParkingLot l) {
        return jdbc.update("""
                UPDATE parking_lots SET name = ?, region = ?, area = ?, addr = ?, lot_type = ?, total = ?, fee10 = ?, fee_short = ?,
                    fee_text = ?, day_max = ?, hours = ?, manager = ?, tel = ?, disabled = ?, lat = ?, lng = ?, updated_at = CURRENT_TIMESTAMP
                WHERE external_no = ?
                """,
                l.getName(), l.getRegion(), l.getArea(), l.getAddr(), l.getType(), l.getTotal(), l.getFee10(), l.getFeeShort(),
                l.getFeeText(), l.getDayMax(), l.getHours(), l.getManager(), l.getTel(), l.getDisabled(), l.getLat(), l.getLng(),
                l.getExternalNo());
    }

    public int delete(Long id) {
        return jdbc.update("DELETE FROM parking_lots WHERE id = ?", id);
    }

    public void updateAvailable(Long id, int available) {
        jdbc.update("UPDATE parking_lots SET available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", available, id);
    }

    private static String join(List<String> list) {
        return list == null ? null : String.join(",", list);
    }
}
