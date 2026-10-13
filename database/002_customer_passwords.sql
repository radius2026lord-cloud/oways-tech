-- Select the Oways Tech database in phpMyAdmin before running. Safe to rerun.
CREATE TABLE IF NOT EXISTS customer_credentials (
 user_id BIGINT UNSIGNED PRIMARY KEY,
 password_hash VARCHAR(200) CHARACTER SET ascii NOT NULL,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB;
