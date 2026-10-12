package com.ezpark.board;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

/** 공지사항 · FAQ · 1:1 문의 · 기업 도입 문의 */
@Repository
@RequiredArgsConstructor
public class BoardRepository {

    private final JdbcTemplate jdbc;

    public record Notice(Long id, String cat, String title, String body, boolean pinned, int views, String date) {
    }

    public record Faq(Long id, String cat, String q, String a) {
    }

    public record Inquiry(Long id, String company, String industry, String name, String phone, String email, int slots,
                          String plan, String message, String status, String date) {
    }

    /* ---------- 공지 ---------- */
    public List<Notice> findNotices() {
        return jdbc.query("SELECT * FROM notices ORDER BY pinned DESC, id DESC", (rs, i) -> new Notice(
                rs.getLong("id"), rs.getString("category"), rs.getString("title"), rs.getString("body"), rs.getBoolean("pinned"),
                rs.getInt("views"), rs.getTimestamp("created_at").toLocalDateTime().toLocalDate().toString()));
    }

    public void insertNotice(String cat, String title, String body) {
        jdbc.update("INSERT INTO notices (category, title, body) VALUES (?, ?, ?)", cat, title, body);
    }

    public int deleteNotice(Long id) {
        return jdbc.update("DELETE FROM notices WHERE id = ?", id);
    }

    public int togglePin(Long id) {
        return jdbc.update("UPDATE notices SET pinned = NOT pinned WHERE id = ?", id);
    }

    public void increaseViews(Long id) {
        jdbc.update("UPDATE notices SET views = views + 1 WHERE id = ?", id);
    }

    /* ---------- FAQ ---------- */
    public List<Faq> findFaqs() {
        return jdbc.query("SELECT * FROM faqs ORDER BY sort_order, id", (rs, i) -> new Faq(
                rs.getLong("id"), rs.getString("category"), rs.getString("question"), rs.getString("answer")));
    }

    /* ---------- 1:1 문의 ---------- */
    public void insertQna(Long userId, String category, String email, String title, String body) {
        jdbc.update("INSERT INTO qna (user_id, category, email, title, body) VALUES (?, ?, ?, ?, ?)", userId, category, email, title, body);
    }

    /* ---------- 기업 도입 문의 ---------- */
    public void insertInquiry(String company, String industry, String name, String phone, String email, int slots, String plan, String message) {
        jdbc.update("INSERT INTO inquiries (company, industry, name, phone, email, slots, plan, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                company, industry, name, phone, email, slots, plan, message);
    }

    public List<Inquiry> findInquiries() {
        return jdbc.query("SELECT * FROM inquiries ORDER BY id DESC", (rs, i) -> new Inquiry(
                rs.getLong("id"), rs.getString("company"), rs.getString("industry"), rs.getString("name"), rs.getString("phone"),
                rs.getString("email"), rs.getInt("slots"), rs.getString("plan"), rs.getString("message"), rs.getString("status"),
                rs.getTimestamp("created_at").toLocalDateTime().toLocalDate().toString()));
    }

    public int updateInquiryStatus(Long id, String status) {
        return jdbc.update("UPDATE inquiries SET status = ? WHERE id = ?", status, id);
    }
}
