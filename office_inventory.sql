-- office_inventory.sql
-- Create database
CREATE DATABASE IF NOT EXISTS office_inventory
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE office_inventory;

-- Create table: supplies
CREATE TABLE IF NOT EXISTS supplies (
    supply_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
