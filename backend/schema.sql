CREATE DATABASE IF NOT EXISTS synccs
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE synccs;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  student_number VARCHAR(30) NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  email VARCHAR(255) NOT NULL,
  login_id VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_image LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_student_number (student_number),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_login_id (login_id)
);

CREATE TABLE IF NOT EXISTS schedules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  content TEXT NOT NULL,
  photo LONGTEXT NULL,
  link VARCHAR(2048) NULL,
  note TEXT NULL,
  grade ENUM('1', '2', '3', '4', 'all') NOT NULL,
  notice BOOLEAN NOT NULL DEFAULT FALSE,
  hashtag VARCHAR(255) NULL,
  author VARCHAR(50) NOT NULL,
  like_count INT UNSIGNED NOT NULL DEFAULT 0,
  dislike_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_schedules_start_date (start_date),
  INDEX idx_schedules_grade (grade),
  INDEX idx_schedules_notice (notice)
);
