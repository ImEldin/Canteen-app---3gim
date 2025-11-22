'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- ==========================================
      -- USERS
      -- ==========================================
      CREATE TABLE users (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT NOT NULL UNIQUE,
        phone_number VARCHAR(20),
        role TEXT NOT NULL,
        password TEXT NOT NULL,
        must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_locked BOOLEAN DEFAULT FALSE,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires_at TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      );

      CREATE INDEX idx_users_role ON users(role);

      -- ==========================================
      -- TAGS
      -- ==========================================
      CREATE TABLE tags (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- ==========================================
      -- MENU ITEMS
      -- ==========================================
      CREATE TABLE menu_items (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- ==========================================
      -- MENU ITEM TAGS (N:M)
      -- ==========================================
      CREATE TABLE menu_item_tags (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE SET NULL,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        UNIQUE (menu_item_id, tag_id)
      );

      CREATE INDEX idx_menu_item_tags_menu ON menu_item_tags(menu_item_id);
      CREATE INDEX idx_menu_item_tags_tag ON menu_item_tags(tag_id);

      -- ==========================================
      -- ORDERS
      -- ==========================================
      CREATE TABLE orders (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        pickup_time TIMESTAMPTZ,
        break_slot TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_orders_user ON orders(user_id);

      -- ==========================================
      -- ORDER ITEMS
      -- ==========================================
      CREATE TABLE order_items (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
        quantity INT NOT NULL DEFAULT 1,
        total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_order_items_order ON order_items(order_id);
    `);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
