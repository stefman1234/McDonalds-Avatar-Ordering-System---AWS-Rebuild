-- McDonald's Avatar Ordering System - Database Schema
-- Phase 1.2: Create Core Tables
-- Run this in Supabase SQL Editor

-- ==============================================
-- TABLE: menu_items
-- ==============================================
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    description TEXT,
    base_price DECIMAL(5,2) NOT NULL,
    image_url VARCHAR(255),
    calories INT,
    available BOOLEAN DEFAULT true,
    vegetarian BOOLEAN DEFAULT false,
    gluten_free BOOLEAN DEFAULT false,
    time_restriction VARCHAR(20), -- 'breakfast', 'lunch', 'all_day'
    popular BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_menu_items_time ON menu_items(time_restriction);
CREATE INDEX IF NOT EXISTS idx_menu_items_popular ON menu_items(popular);

-- ==============================================
-- TABLE: menu_item_sizes
-- ==============================================
CREATE TABLE IF NOT EXISTS menu_item_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    size_name VARCHAR(20) NOT NULL, -- 'Small', 'Medium', 'Large'
    price_modifier DECIMAL(5,2) DEFAULT 0.00,
    calories_modifier INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sizes_item ON menu_item_sizes(menu_item_id);

-- ==============================================
-- TABLE: customization_options
-- ==============================================
CREATE TABLE IF NOT EXISTS customization_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- 'No Pickles', 'Extra Cheese', etc.
    category VARCHAR(50) NOT NULL, -- 'remove', 'add', 'substitute'
    price_modifier DECIMAL(5,2) DEFAULT 0.00,
    applicable_to VARCHAR(100), -- JSON array of categories ['burgers', 'sandwiches']
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customizations_category ON customization_options(category);

-- ==============================================
-- TABLE: combo_meals
-- ==============================================
CREATE TABLE IF NOT EXISTS combo_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(5,2) NOT NULL,
    discount_amount DECIMAL(5,2) DEFAULT 0.00,
    includes JSONB NOT NULL, -- {"main": "item_id", "side": "fries", "drink": "any"}
    image_url VARCHAR(255),
    popular BOOLEAN DEFAULT false,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_combo_popular ON combo_meals(popular);
CREATE INDEX IF NOT EXISTS idx_combo_available ON combo_meals(available);

-- ==============================================
-- TABLE: orders
-- ==============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100),
    order_type VARCHAR(20) NOT NULL, -- 'dine_in', 'takeout'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'preparing', 'ready', 'completed'
    subtotal DECIMAL(8,2) NOT NULL,
    tax DECIMAL(8,2) NOT NULL,
    total DECIMAL(8,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    session_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- ==============================================
-- TABLE: order_items
-- ==============================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    combo_meal_id UUID REFERENCES combo_meals(id),
    quantity INT NOT NULL DEFAULT 1,
    size VARCHAR(20),
    unit_price DECIMAL(5,2) NOT NULL,
    line_total DECIMAL(6,2) NOT NULL,
    customizations JSONB, -- Array of customization_option IDs and modifications
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu ON order_items(menu_item_id);

-- ==============================================
-- TABLE: conversation_sessions
-- ==============================================
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
    conversation_history JSONB, -- Array of messages
    current_step VARCHAR(50), -- 'greeting', 'ordering', 'customizing', 'confirming', 'payment'
    context_data JSONB, -- Any state needed for conversation
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON conversation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_activity ON conversation_sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_sessions_id ON conversation_sessions(session_id);

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE '✅ All tables created successfully!';
    RAISE NOTICE 'Next step: Run 02-seed-menu-items.sql to populate menu data';
END $$;
