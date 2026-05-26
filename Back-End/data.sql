CREATE DATABASE IF NOT EXISTS atilas_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE atilas_store;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_products_name UNIQUE (name),
  CONSTRAINT chk_products_price CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  type ENUM('entry', 'exit', 'adjustment') NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_stock_movements_product
    FOREIGN KEY (product_id)
    REFERENCES products (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS purchases (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  buyer_name VARCHAR(120) NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_value DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('pix', 'cash', 'card', 'credit') NOT NULL DEFAULT 'pix',
  note VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_purchases_product
    FOREIGN KEY (product_id)
    REFERENCES products (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_purchases_quantity CHECK (quantity > 0),
  CONSTRAINT chk_purchases_unit_price CHECK (unit_price >= 0),
  CONSTRAINT chk_purchases_total_value CHECK (total_value >= 0)
);

CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_stock_movements_product_id ON stock_movements (product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements (created_at);
CREATE INDEX idx_purchases_product_id ON purchases (product_id);
CREATE INDEX idx_purchases_created_at ON purchases (created_at);

INSERT INTO products (name, description, quantity, price) VALUES
  ('Soda can', '350 ml', 0, 5.00),
  ('Mineral water', '500 ml', 0, 3.00),
  ('Chocolate', 'Unit', 0, 4.50)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  price = VALUES(price);

DROP PROCEDURE IF EXISTS register_purchase;

DELIMITER //

CREATE PROCEDURE register_purchase (
  IN p_buyer_name VARCHAR(120),
  IN p_product_id INT UNSIGNED,
  IN p_quantity INT UNSIGNED,
  IN p_payment_method VARCHAR(20),
  IN p_note VARCHAR(255)
)
BEGIN
  DECLARE v_price DECIMAL(10, 2);
  DECLARE v_stock INT UNSIGNED;
  DECLARE v_product_found BOOLEAN DEFAULT TRUE;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  DECLARE CONTINUE HANDLER FOR NOT FOUND
    SET v_product_found = FALSE;

  START TRANSACTION;

  IF p_quantity IS NULL OR p_quantity = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Invalid quantity for the purchase.';
  END IF;

  SELECT price, quantity
    INTO v_price, v_stock
    FROM products
    WHERE id = p_product_id
      AND active = TRUE
    FOR UPDATE;

  IF v_product_found = FALSE THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Product not found or inactive.';
  END IF;

  IF v_stock < p_quantity THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Not enough inventory for the purchase.';
  END IF;

  INSERT INTO purchases (
    buyer_name,
    product_id,
    quantity,
    unit_price,
    total_value,
    payment_method,
    note
  ) VALUES (
    p_buyer_name,
    p_product_id,
    p_quantity,
    v_price,
    v_price * p_quantity,
    p_payment_method,
    p_note
  );

  UPDATE products
    SET quantity = quantity - p_quantity
    WHERE id = p_product_id;

  INSERT INTO stock_movements (product_id, type, quantity, note)
  VALUES (p_product_id, 'exit', p_quantity, CONCAT('Purchase by ', p_buyer_name));

  COMMIT;
END //

DELIMITER ;
