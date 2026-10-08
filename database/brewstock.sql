CREATE DATABASE IF NOT EXISTS brewstock;
USE brewstock;

CREATE TABLE inventory (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_threshold DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'in-stock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_movements (
    movement_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    movement_type ENUM('IN','OUT') NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    recorded_by INT,
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory(item_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES staff(staff_id) ON DELETE SET NULL
);

CREATE TABLE usage_waste (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    quantity_used DECIMAL(10,2) DEFAULT 0,
    quantity_wasted DECIMAL(10,2) DEFAULT 0,
    reason VARCHAR(255),
    recorded_by INT,
    record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory(item_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES staff(staff_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
    order_id      INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    item_id       INT NOT NULL,
    quantity      DECIMAL(10,2) NOT NULL,
    unit          VARCHAR(30)  NOT NULL,
    status        ENUM('Pending','Ordered','Received','Cancelled') NOT NULL DEFAULT 'Pending',
    notes         VARCHAR(255) DEFAULT NULL,
    ordered_by    INT DEFAULT NULL,
    order_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id)    REFERENCES inventory(item_id) ON DELETE CASCADE,
    FOREIGN KEY (ordered_by) REFERENCES staff(staff_id)   ON DELETE SET NULL
);


INSERT INTO inventory
(item_name, category, current_stock, min_threshold, unit, status)
VALUES
('Coffee Beans', 'beans', 45, 10, 'kg', 'in-stock'),
('Whole Milk', 'dairy', 8, 15, 'liters', 'low'),
('Vanilla Syrup', 'syrups', 22, 5, 'bottles', 'in-stock'),
('Paper Cups (12oz)', 'consumables', 3, 10, 'packs', 'critical'),
('Croissants', 'food', 36, 12, 'pieces', 'in-stock'),
('Oat Milk', 'dairy', 18, 10, 'liters', 'in-stock');


