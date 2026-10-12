-- =========================================================
-- EzPark DB 스키마 (MySQL 8 / TiDB / H2(MODE=MySQL) 공용)
-- 기동 시 DbInitializer 가 매번 실행 → 반드시 IF NOT EXISTS 로 작성
-- =========================================================

CREATE TABLE IF NOT EXISTS app_seed (
    name       VARCHAR(50) NOT NULL PRIMARY KEY,
    applied_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(120) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    name          VARCHAR(40)  NOT NULL,
    phone         VARCHAR(20),
    plate         VARCHAR(20),
    role          VARCHAR(10)  NOT NULL DEFAULT 'USER',
    company       VARCHAR(80),
    status        VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE',
    marketing     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS parking_lots (
    id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    external_no VARCHAR(30),
    name        VARCHAR(100)  NOT NULL,
    region      VARCHAR(20)   NOT NULL,
    area        VARCHAR(40),
    addr        VARCHAR(200)  NOT NULL,
    lot_type    VARCHAR(10)   NOT NULL DEFAULT '노외',
    total       INT           NOT NULL,
    available   INT           NOT NULL,
    fee10       INT           NOT NULL DEFAULT 0,
    fee_short   VARCHAR(40),
    fee_text    VARCHAR(200),
    day_max     INT           NOT NULL DEFAULT 0,
    hours       VARCHAR(80),
    manager     VARCHAR(80),
    tel         VARCHAR(30),
    ev          BOOLEAN,
    disabled    BOOLEAN,
    lat         DECIMAL(10,7) NOT NULL,
    lng         DECIMAL(10,7) NOT NULL,
    photo       VARCHAR(40),
    floors      VARCHAR(60),
    tags        VARCHAR(200),
    data_source VARCHAR(10)   NOT NULL DEFAULT 'SEED',
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_lots_external UNIQUE (external_no)
);

CREATE TABLE IF NOT EXISTS vehicles (
    id         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    plate      VARCHAR(20) NOT NULL,
    model      VARCHAR(40) NOT NULL,
    car_type   VARCHAR(10) NOT NULL,
    is_main    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_vehicles_user_plate UNIQUE (user_id, plate),
    CONSTRAINT fk_vehicles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
    user_id    BIGINT   NOT NULL,
    lot_id     BIGINT   NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, lot_id),
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_lot FOREIGN KEY (lot_id) REFERENCES parking_lots (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    rsv_no          VARCHAR(20)  NOT NULL,
    user_id         BIGINT       NOT NULL,
    lot_id          BIGINT       NOT NULL,
    slot            VARCHAR(20),
    entry_at        DATETIME     NOT NULL,
    minutes         INT          NOT NULL,
    plate           VARCHAR(20)  NOT NULL,
    car_type        VARCHAR(10)  NOT NULL,
    phone           VARCHAR(20)  NOT NULL,
    memo            VARCHAR(200),
    pay_method      VARCHAR(20)  NOT NULL,
    coupon_rate     INT          NOT NULL DEFAULT 0,
    base_fee        INT          NOT NULL,
    ev_discount     INT          NOT NULL DEFAULT 0,
    coupon_discount INT          NOT NULL DEFAULT 0,
    total_fee       INT          NOT NULL,
    status          VARCHAR(10)  NOT NULL DEFAULT 'RESERVED',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_reservations_no UNIQUE (rsv_no),
    CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reservations_lot FOREIGN KEY (lot_id) REFERENCES parking_lots (id),
    INDEX idx_reservations_user (user_id)
);

CREATE TABLE IF NOT EXISTS parking_events (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    lot_id     BIGINT,
    camera_id  VARCHAR(20),
    ev_type    VARCHAR(20)  NOT NULL,
    title      VARCHAR(60)  NOT NULL,
    meta       VARCHAR(200),
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_events_created (created_at)
);

CREATE TABLE IF NOT EXISTS inquiries (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company    VARCHAR(80)  NOT NULL,
    industry   VARCHAR(20)  NOT NULL,
    name       VARCHAR(40)  NOT NULL,
    phone      VARCHAR(20)  NOT NULL,
    email      VARCHAR(120) NOT NULL,
    slots      INT          NOT NULL DEFAULT 0,
    plan       VARCHAR(20)  NOT NULL,
    message    VARCHAR(1000),
    status     VARCHAR(10)  NOT NULL DEFAULT '접수',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notices (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    category   VARCHAR(10)  NOT NULL,
    title      VARCHAR(100) NOT NULL,
    body       TEXT         NOT NULL,
    pinned     BOOLEAN      NOT NULL DEFAULT FALSE,
    views      INT          NOT NULL DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faqs (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    category   VARCHAR(10)  NOT NULL,
    question   VARCHAR(200) NOT NULL,
    answer     TEXT         NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS qna (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT,
    category   VARCHAR(20)  NOT NULL,
    email      VARCHAR(120) NOT NULL,
    title      VARCHAR(60)  NOT NULL,
    body       TEXT         NOT NULL,
    status     VARCHAR(10)  NOT NULL DEFAULT '접수',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
