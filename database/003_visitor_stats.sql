-- Select the Oways Tech database before executing.
CREATE TABLE IF NOT EXISTS visitor_daily (
 visitor_digest BINARY(32) NOT NULL,
 visit_date DATE NOT NULL,
 page_views INT UNSIGNED NOT NULL DEFAULT 1,
 PRIMARY KEY(visit_date,visitor_digest),
 INDEX idx_visitor_digest(visitor_digest)
) ENGINE=InnoDB;
