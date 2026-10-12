package com.ezpark.user;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<User> MAPPER = (rs, i) -> {
        Timestamp created = rs.getTimestamp("created_at");
        return User.builder()
                .id(rs.getLong("id"))
                .email(rs.getString("email"))
                .passwordHash(rs.getString("password_hash"))
                .name(rs.getString("name"))
                .phone(rs.getString("phone"))
                .plate(rs.getString("plate"))
                .role(rs.getString("role"))
                .company(rs.getString("company"))
                .status(rs.getString("status"))
                .marketing(rs.getBoolean("marketing"))
                .createdAt(created == null ? null : created.toLocalDateTime())
                .build();
    };

    public Optional<User> findByEmail(String email) {
        return jdbc.query("SELECT * FROM users WHERE email = ?", MAPPER, email).stream().findFirst();
    }

    public Optional<User> findById(Long id) {
        return jdbc.query("SELECT * FROM users WHERE id = ?", MAPPER, id).stream().findFirst();
    }

    public boolean existsByEmail(String email) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email);
        return count != null && count > 0;
    }

    public List<User> findAll() {
        return jdbc.query("SELECT * FROM users ORDER BY id DESC", MAPPER);
    }

    public Long insert(User u) {
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO users (email, password_hash, name, phone, plate, role, company, marketing) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    new String[]{"id"});
            ps.setString(1, u.getEmail());
            ps.setString(2, u.getPasswordHash());
            ps.setString(3, u.getName());
            ps.setString(4, u.getPhone());
            ps.setString(5, u.getPlate());
            ps.setString(6, u.getRole());
            ps.setString(7, u.getCompany());
            ps.setBoolean(8, u.isMarketing());
            return ps;
        }, kh);
        return Objects.requireNonNull(kh.getKey()).longValue();
    }

    public void insertAdmin(String email, String passwordHash, String name) {
        jdbc.update("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'ADMIN')", email, passwordHash, name);
    }

    public void updateProfile(Long id, String name, String phone) {
        jdbc.update("UPDATE users SET name = ?, phone = ? WHERE id = ?", name, phone, id);
    }

    public void updatePassword(Long id, String passwordHash) {
        jdbc.update("UPDATE users SET password_hash = ? WHERE id = ?", passwordHash, id);
    }

    public void updateRole(Long id, String role) {
        jdbc.update("UPDATE users SET role = ? WHERE id = ?", role, id);
    }

    public void updateStatus(Long id, String status) {
        jdbc.update("UPDATE users SET status = ? WHERE id = ?", status, id);
    }

    public int count() {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        return count == null ? 0 : count;
    }
}
