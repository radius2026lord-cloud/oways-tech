-- Oways Tech, independent initial schema. MySQL 8.0.16+ (enforced CHECK).
-- Run on a NEW database only. Does not configure the current static website.
-- Schema migration: do not rerun on an existing installation.
CREATE DATABASE IF NOT EXISTS oways_tech CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE oways_tech;

CREATE TABLE users (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 full_name VARCHAR(160) NOT NULL,
 phone VARCHAR(16) CHARACTER SET ascii NULL UNIQUE COMMENT 'International E.164, including +',
 phone_verified_at DATETIME NULL,
 role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
 status ENUM('active','suspended','closed') NOT NULL DEFAULT 'active',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CHECK (CHAR_LENGTH(TRIM(full_name)) > 0)
) ENGINE=InnoDB;

CREATE TABLE phone_challenges (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 phone VARCHAR(16) CHARACTER SET ascii NOT NULL,
 purpose ENUM('signup','login','change_phone') NOT NULL,
 code_digest VARBINARY(64) NOT NULL COMMENT 'Keyed digest; no plain OTP',
 attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
 max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 5,
 expires_at DATETIME NOT NULL,
 consumed_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_challenge_phone(phone,purpose,created_at),
 CHECK (max_attempts > 0), CHECK (expires_at > created_at)
) ENGINE=InnoDB;

CREATE TABLE user_sessions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 token_digest BINARY(32) NOT NULL UNIQUE,
 expires_at DATETIME NOT NULL,
 revoked_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id),
 INDEX idx_session_user(user_id,expires_at)
) ENGINE=InnoDB;

CREATE TABLE categories (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(160) NOT NULL,
 slug VARCHAR(160) CHARACTER SET ascii NOT NULL UNIQUE,
 description TEXT NULL,
 image_key VARCHAR(512) NULL,
 sort_order INT NOT NULL DEFAULT 0,
 visible BOOLEAN NOT NULL DEFAULT TRUE,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE services (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 category_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(160) NOT NULL,
 slug VARCHAR(160) CHARACTER SET ascii NOT NULL UNIQUE,
 description TEXT NOT NULL,
 features JSON NULL,
 images JSON NULL COMMENT 'Storage keys and alt text',
 kind ENUM('subscription','one_time') NOT NULL,
 status ENUM('draft','active','unavailable','archived') NOT NULL DEFAULT 'draft',
 sort_order INT NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(category_id) REFERENCES categories(id),
 INDEX idx_service_listing(category_id,status,sort_order)
) ENGINE=InnoDB;

CREATE TABLE service_packages (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 service_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(160) NOT NULL,
 pricing_mode ENUM('fixed','quote') NOT NULL,
 price DECIMAL(12,2) NULL,
 currency CHAR(3) CHARACTER SET ascii NOT NULL COMMENT 'ISO currency code',
 duration_value INT UNSIGNED NULL,
 duration_unit ENUM('day','week','month','year') NULL,
 activation_method VARCHAR(160) NOT NULL COMMENT 'Admin-defined method label',
 renewal_enabled BOOLEAN NOT NULL DEFAULT FALSE,
 estimated_delivery_hours INT UNSIGNED NULL,
 status ENUM('draft','active','unavailable','archived') NOT NULL DEFAULT 'draft',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(service_id) REFERENCES services(id),
 CHECK ((pricing_mode='fixed' AND price IS NOT NULL AND price>=0) OR (pricing_mode='quote' AND price IS NULL)),
 CHECK ((duration_value IS NULL AND duration_unit IS NULL) OR (duration_value>0 AND duration_unit IS NOT NULL))
) ENGINE=InnoDB;

CREATE TABLE package_requirements (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 package_id BIGINT UNSIGNED NOT NULL,
 field_key VARCHAR(80) CHARACTER SET ascii NOT NULL,
 label VARCHAR(160) NOT NULL,
 input_type ENUM('text','email','phone','url','number','textarea','select','file') NOT NULL,
 required BOOLEAN NOT NULL DEFAULT TRUE,
 help_text TEXT NULL,
 options_json JSON NULL,
 validation_json JSON NULL,
 sort_order INT NOT NULL DEFAULT 0,
 UNIQUE(package_id,field_key),
 FOREIGN KEY(package_id) REFERENCES service_packages(id)
) ENGINE=InnoDB;

CREATE TABLE package_instructions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 package_id BIGINT UNSIGNED NOT NULL,
 stage ENUM('before_order','during_activation','after_completion') NOT NULL,
 title VARCHAR(160) NOT NULL,
 body TEXT NOT NULL,
 sort_order INT NOT NULL DEFAULT 0,
 FOREIGN KEY(package_id) REFERENCES service_packages(id)
) ENGINE=InnoDB;

CREATE TABLE payment_methods (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(160) NOT NULL,
 instructions TEXT NOT NULL,
 enabled BOOLEAN NOT NULL DEFAULT TRUE,
 sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE orders (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 public_reference VARCHAR(32) CHARACTER SET ascii NOT NULL UNIQUE COMMENT 'Server-generated non-sequential reference',
 user_id BIGINT UNSIGNED NOT NULL,
 fulfillment_status ENUM('draft','review','awaiting_customer','ready','processing','completed','cancelled') NOT NULL DEFAULT 'draft',
 payment_status ENUM('not_required_yet','awaiting_payment','verification','paid','partially_refunded','refunded') NOT NULL DEFAULT 'not_required_yet',
 total_amount DECIMAL(12,2) NULL,
 currency CHAR(3) CHARACTER SET ascii NOT NULL,
 customer_snapshot JSON NOT NULL COMMENT 'Name and phone at submission; do not expose publicly',
 cancellation_reason TEXT NULL,
 submitted_at DATETIME NULL,
 completed_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id),
 CHECK (total_amount IS NULL OR total_amount>=0),
 INDEX idx_order_customer(user_id,created_at),
 INDEX idx_order_work(fulfillment_status,payment_status,created_at)
) ENGINE=InnoDB;

CREATE TABLE order_items (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 order_id BIGINT UNSIGNED NOT NULL,
 package_id BIGINT UNSIGNED NOT NULL,
 request_type ENUM('activation','renewal') NOT NULL DEFAULT 'activation',
 fulfillment_status ENUM('draft','review','awaiting_customer','ready','processing','completed','cancelled') NOT NULL DEFAULT 'draft',
 agreed_price DECIMAL(12,2) NULL,
 package_snapshot JSON NOT NULL COMMENT 'Immutable name, price, duration, activation method, requirements and instructions at submission',
 quote_status ENUM('not_required','pending','offered','accepted','declined') NOT NULL DEFAULT 'not_required',
 quote_accepted_at DATETIME NULL,
 activated_at DATETIME NULL,
 completed_at DATETIME NULL,
 FOREIGN KEY(order_id) REFERENCES orders(id),
 FOREIGN KEY(package_id) REFERENCES service_packages(id),
 CHECK (agreed_price IS NULL OR agreed_price>=0),
 INDEX idx_item_work(fulfillment_status,order_id)
) ENGINE=InnoDB;

CREATE TABLE attachments (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 order_id BIGINT UNSIGNED NOT NULL,
 uploaded_by BIGINT UNSIGNED NOT NULL,
 storage_key VARCHAR(512) NOT NULL UNIQUE,
 original_name VARCHAR(255) NOT NULL,
 mime_type VARCHAR(100) NOT NULL,
 size_bytes BIGINT UNSIGNED NOT NULL,
 purpose ENUM('requirement','payment_proof','delivery') NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(order_id) REFERENCES orders(id),
 FOREIGN KEY(uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE order_answers (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 order_item_id BIGINT UNSIGNED NOT NULL,
 field_key VARCHAR(80) CHARACTER SET ascii NOT NULL,
 value_json JSON NULL,
 attachment_id BIGINT UNSIGNED NULL,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE(order_item_id,field_key),
 FOREIGN KEY(order_item_id) REFERENCES order_items(id),
 FOREIGN KEY(attachment_id) REFERENCES attachments(id),
 CHECK (value_json IS NOT NULL OR attachment_id IS NOT NULL)
) ENGINE=InnoDB;

CREATE TABLE order_actions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 order_item_id BIGINT UNSIGNED NOT NULL,
 requested_by BIGINT UNSIGNED NOT NULL,
 title VARCHAR(160) NOT NULL,
 instructions TEXT NOT NULL,
 status ENUM('pending','customer_done','confirmed','cancelled') NOT NULL DEFAULT 'pending',
 customer_response TEXT NULL,
 customer_done_at DATETIME NULL,
 confirmed_by BIGINT UNSIGNED NULL,
 confirmed_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(order_item_id) REFERENCES order_items(id),
 FOREIGN KEY(requested_by) REFERENCES users(id),
 FOREIGN KEY(confirmed_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE payments (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 order_id BIGINT UNSIGNED NOT NULL,
 method_id BIGINT UNSIGNED NOT NULL,
 method_snapshot JSON NOT NULL,
 amount DECIMAL(12,2) NOT NULL,
 currency CHAR(3) CHARACTER SET ascii NOT NULL,
 transfer_reference VARCHAR(160) NULL,
 proof_attachment_id BIGINT UNSIGNED NULL,
 status ENUM('submitted','verified','rejected') NOT NULL DEFAULT 'submitted',
 reviewed_by BIGINT UNSIGNED NULL,
 review_reason TEXT NULL,
 reviewed_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(order_id) REFERENCES orders(id),
 FOREIGN KEY(method_id) REFERENCES payment_methods(id),
 FOREIGN KEY(proof_attachment_id) REFERENCES attachments(id),
 FOREIGN KEY(reviewed_by) REFERENCES users(id),
 CHECK (amount>0), INDEX idx_payment_review(status,created_at)
) ENGINE=InnoDB;

CREATE TABLE refunds (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 payment_id BIGINT UNSIGNED NOT NULL,
 amount DECIMAL(12,2) NOT NULL,
 reason TEXT NOT NULL,
 status ENUM('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
 recorded_by BIGINT UNSIGNED NOT NULL,
 completed_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(payment_id) REFERENCES payments(id),
 FOREIGN KEY(recorded_by) REFERENCES users(id), CHECK (amount>0)
) ENGINE=InnoDB;

CREATE TABLE subscriptions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 order_item_id BIGINT UNSIGNED NOT NULL UNIQUE,
 previous_subscription_id BIGINT UNSIGNED NULL,
 activated_at DATETIME NOT NULL,
 expires_at DATETIME NOT NULL,
 status ENUM('active','expired','suspended','cancelled') NOT NULL DEFAULT 'active',
 FOREIGN KEY(user_id) REFERENCES users(id),
 FOREIGN KEY(order_item_id) REFERENCES order_items(id),
 FOREIGN KEY(previous_subscription_id) REFERENCES subscriptions(id),
 CHECK (expires_at>activated_at), INDEX idx_subscription_customer(user_id,status,expires_at)
) ENGINE=InnoDB;
ALTER TABLE order_items ADD COLUMN renewal_subscription_id BIGINT UNSIGNED NULL,
 ADD CONSTRAINT fk_item_renewal FOREIGN KEY(renewal_subscription_id) REFERENCES subscriptions(id);

CREATE TABLE order_updates (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 order_id BIGINT UNSIGNED NOT NULL,
 order_item_id BIGINT UNSIGNED NULL,
 author_id BIGINT UNSIGNED NOT NULL,
 visibility ENUM('customer','internal') NOT NULL DEFAULT 'internal',
 body TEXT NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(order_id) REFERENCES orders(id),
 FOREIGN KEY(order_item_id) REFERENCES order_items(id),
 FOREIGN KEY(author_id) REFERENCES users(id), INDEX idx_update_order(order_id,created_at)
) ENGINE=InnoDB;

CREATE TABLE notifications (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 order_id BIGINT UNSIGNED NULL,
 event_type ENUM('order_update','action_required','payment_update','subscription_update','general') NOT NULL,
 title VARCHAR(160) NOT NULL,
 body TEXT NOT NULL,
 read_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id),
 FOREIGN KEY(order_id) REFERENCES orders(id), INDEX idx_notification_user(user_id,read_at,created_at)
) ENGINE=InnoDB;

CREATE TABLE site_settings (
 setting_key VARCHAR(100) CHARACTER SET ascii PRIMARY KEY,
 value_json JSON NOT NULL COMMENT 'Public site configuration only; no API keys or OTP secrets',
 updated_by BIGINT UNSIGNED NULL,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(updated_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 actor_id BIGINT UNSIGNED NULL,
 entity_type VARCHAR(64) CHARACTER SET ascii NOT NULL,
 entity_id BIGINT UNSIGNED NULL,
 action VARCHAR(80) CHARACTER SET ascii NOT NULL,
 change_summary JSON NULL COMMENT 'Redacted changes; no passwords, OTPs, tokens or sensitive answers',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(actor_id) REFERENCES users(id), INDEX idx_audit_entity(entity_type,entity_id,created_at)
) ENGINE=InnoDB;

-- Application invariants (enforce in backend transactions, not merely UI):
-- 1. Require authenticated owner/admin access for orders, attachments and messages.
-- 2. Validate E.164 numbers; throttle OTP generation/verification; expire and consume codes atomically.
-- 3. Match attachments, answers, actions and item updates to the same order and owner.
-- 4. Freeze snapshots at submission. Quote acceptance records the new agreed amount explicitly.
-- 5. Verify currency and sufficient verified payments before marking payable items ready.
-- 6. Derive order fulfillment from item states; a mixed completed/processing order stays processing.
-- 7. Refund totals cannot exceed verified payments; cancellation does not create a refund.
-- 8. Subscriptions only for subscription services; validate renewal ownership/package compatibility.
-- 9. Compute subscription expiry from actual activation and calendar duration; no implicit renewal rule.
-- 10. Never collect account passwords or login OTPs as service answers. Original provider handles login.
-- 11. Do not infer message delivery from opening WhatsApp. Save the order before opening it.
-- 12. Customer-facing queries must exclude internal notes; only admins may update settings/catalog/statuses.

-- Admin username login and manual payment confirmation (Oways Tech only).
CREATE TABLE admin_credentials (
 user_id BIGINT UNSIGNED PRIMARY KEY,
 username VARCHAR(64) CHARACTER SET ascii NOT NULL UNIQUE,
 password_hash VARCHAR(200) CHARACTER SET ascii NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE manual_payment_confirmations (
 order_id BIGINT UNSIGNED PRIMARY KEY,
 confirmed_by BIGINT UNSIGNED NOT NULL,
 amount DECIMAL(12,2) NOT NULL,
 currency CHAR(3) CHARACTER SET ascii NOT NULL,
 confirmed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(order_id) REFERENCES orders(id),
 FOREIGN KEY(confirmed_by) REFERENCES users(id)
) ENGINE=InnoDB;
