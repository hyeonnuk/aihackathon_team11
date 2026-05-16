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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_student_number (student_number),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_login_id (login_id)
);
