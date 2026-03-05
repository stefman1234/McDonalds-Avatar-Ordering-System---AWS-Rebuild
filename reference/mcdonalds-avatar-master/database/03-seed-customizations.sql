-- McDonald's Avatar Ordering System - Customization Options Seed Data
-- Phase 1.2: Populate Customization Options
-- Run this after 02-seed-menu-items.sql

-- ==============================================
-- REMOVE OPTIONS (No Extra Charge)
-- ==============================================

-- Common removals for burgers
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('No Pickles', 'remove', 0.00, '["burgers", "chicken"]'),
    ('No Onions', 'remove', 0.00, '["burgers", "chicken"]'),
    ('No Ketchup', 'remove', 0.00, '["burgers"]'),
    ('No Mustard', 'remove', 0.00, '["burgers"]'),
    ('No Mayo', 'remove', 0.00, '["chicken"]'),
    ('No Lettuce', 'remove', 0.00, '["burgers", "chicken"]'),
    ('No Cheese', 'remove', 0.00, '["burgers", "chicken", "breakfast"]'),
    ('No Salt', 'remove', 0.00, '["sides"]'),
    ('No Ice', 'remove', 0.00, '["drinks"]');

-- Special sauce options
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('No Special Sauce', 'remove', 0.00, '["burgers"]'),
    ('Light Special Sauce', 'modify', 0.00, '["burgers"]'),
    ('Extra Special Sauce', 'modify', 0.00, '["burgers"]');

-- Mac sauce options
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('No Mac Sauce', 'remove', 0.00, '["burgers"]'),
    ('Light Mac Sauce', 'modify', 0.00, '["burgers"]'),
    ('Extra Mac Sauce', 'modify', 0.00, '["burgers"]');

-- Breakfast-specific removals
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('No Egg', 'remove', 0.00, '["breakfast"]'),
    ('No Sausage', 'remove', 0.00, '["breakfast"]'),
    ('No Bacon', 'remove', 0.00, '["breakfast"]'),
    ('No Canadian Bacon', 'remove', 0.00, '["breakfast"]'),
    ('No Butter', 'remove', 0.00, '["breakfast"]'),
    ('No Syrup', 'remove', 0.00, '["breakfast"]');

-- Bun options
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('No Bun', 'remove', 0.00, '["burgers", "chicken"]'),
    ('Lettuce Wrap Instead of Bun', 'substitute', 0.00, '["burgers", "chicken"]'),
    ('Toasted Bun', 'modify', 0.00, '["burgers", "chicken"]'),
    ('Extra Toasted Bun', 'modify', 0.00, '["burgers", "chicken"]');

-- ==============================================
-- ADD OPTIONS (Extra Charge)
-- ==============================================

-- Extra toppings - vegetables (free or minimal charge)
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Extra Pickles', 'add', 0.00, '["burgers", "chicken"]'),
    ('Extra Onions', 'add', 0.00, '["burgers", "chicken"]'),
    ('Extra Lettuce', 'add', 0.00, '["burgers", "chicken"]'),
    ('Extra Tomatoes', 'add', 0.30, '["burgers", "chicken"]');

-- Extra sauces and condiments
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Extra Ketchup', 'add', 0.00, '["burgers", "sides"]'),
    ('Extra Mustard', 'add', 0.00, '["burgers"]'),
    ('Extra Mayo', 'add', 0.00, '["chicken", "burgers"]'),
    ('Add Mac Sauce', 'add', 0.50, '["burgers", "chicken"]'),
    ('Add Big Mac Sauce', 'add', 0.50, '["burgers", "chicken"]'),
    ('Add Ranch Sauce', 'add', 0.50, '["chicken", "sides"]'),
    ('Add Tartar Sauce', 'add', 0.50, '["chicken"]'),
    ('Add BBQ Sauce', 'add', 0.30, '["chicken", "burgers"]'),
    ('Add Honey Mustard', 'add', 0.30, '["chicken"]'),
    ('Add Sweet and Sour Sauce', 'add', 0.30, '["chicken"]'),
    ('Add Spicy Buffalo Sauce', 'add', 0.30, '["chicken"]'),
    ('Add Creamy Ranch Sauce', 'add', 0.30, '["chicken"]'),
    ('Add Tangy BBQ Sauce', 'add', 0.30, '["chicken"]'),
    ('Add Hot Mustard Sauce', 'add', 0.30, '["chicken"]');

-- Premium add-ons - cheese
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Add Cheese', 'add', 0.60, '["burgers", "chicken", "breakfast"]'),
    ('Extra Cheese', 'add', 0.60, '["burgers", "chicken", "breakfast"]'),
    ('Add American Cheese', 'add', 0.60, '["burgers", "chicken"]'),
    ('Add Cheddar Cheese', 'add', 0.70, '["burgers", "chicken"]'),
    ('Add Swiss Cheese', 'add', 0.70, '["burgers", "chicken"]');

-- Premium add-ons - bacon and meat
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Add Bacon', 'add', 1.50, '["burgers", "chicken", "breakfast"]'),
    ('Extra Bacon', 'add', 1.50, '["burgers", "chicken", "breakfast"]'),
    ('Add Extra Beef Patty', 'add', 2.00, '["burgers"]'),
    ('Add Sausage Patty', 'add', 1.50, '["breakfast"]'),
    ('Add Canadian Bacon', 'add', 1.00, '["breakfast"]');

-- Egg options for breakfast
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Add Egg', 'add', 1.20, '["breakfast", "burgers"]'),
    ('Extra Egg', 'add', 1.20, '["breakfast"]'),
    ('Scrambled Egg Instead', 'substitute', 0.00, '["breakfast"]'),
    ('Folded Egg Instead', 'substitute', 0.00, '["breakfast"]'),
    ('Round Egg Instead', 'substitute', 0.00, '["breakfast"]');

-- ==============================================
-- COOKING PREFERENCES
-- ==============================================

-- Meat cooking preferences
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Well Done Patty', 'modify', 0.00, '["burgers"]'),
    ('Fresh Cooked (Made to Order)', 'modify', 0.00, '["burgers", "chicken"]'),
    ('No Grill Seasoning', 'modify', 0.00, '["burgers"]'),
    ('Extra Grill Seasoning', 'modify', 0.00, '["burgers"]');

-- Fries preferences
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Fresh Fries (Made to Order)', 'modify', 0.00, '["sides"]'),
    ('Extra Crispy Fries', 'modify', 0.00, '["sides"]'),
    ('Light Salt Fries', 'modify', 0.00, '["sides"]'),
    ('Extra Salt Fries', 'modify', 0.00, '["sides"]');

-- ==============================================
-- DRINK CUSTOMIZATIONS
-- ==============================================

-- Ice options
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Light Ice', 'modify', 0.00, '["drinks"]'),
    ('Extra Ice', 'modify', 0.00, '["drinks"]');

-- Coffee customizations
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Add Cream', 'add', 0.30, '["drinks"]'),
    ('Add Sugar', 'add', 0.00, '["drinks"]'),
    ('Add Sweetener', 'add', 0.00, '["drinks"]'),
    ('Add Flavor Shot - Vanilla', 'add', 0.50, '["drinks"]'),
    ('Add Flavor Shot - Caramel', 'add', 0.50, '["drinks"]'),
    ('Add Flavor Shot - Hazelnut', 'add', 0.50, '["drinks"]'),
    ('Extra Cream', 'add', 0.30, '["drinks"]'),
    ('Extra Sugar', 'add', 0.00, '["drinks"]');

-- Specialty drink modifications
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Extra Whipped Cream', 'add', 0.50, '["drinks"]'),
    ('No Whipped Cream', 'remove', 0.00, '["drinks"]'),
    ('Extra Caramel Drizzle', 'add', 0.50, '["drinks"]'),
    ('Extra Chocolate Drizzle', 'add', 0.50, '["drinks"]');

-- ==============================================
-- SPECIAL DIETARY MODIFICATIONS
-- ==============================================

-- Allergen-friendly options
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('No Sesame Seeds (Plain Bun)', 'substitute', 0.00, '["burgers"]'),
    ('Gluten-Free Bun', 'substitute', 1.50, '["burgers", "chicken"]'),
    ('Make it Vegetarian', 'modify', 0.00, '["burgers"]');

-- Quantity modifiers for specific items
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Shredded Lettuce Instead', 'substitute', 0.00, '["burgers", "chicken"]'),
    ('Leaf Lettuce Instead', 'substitute', 0.00, '["burgers", "chicken"]'),
    ('Grilled Onions Instead', 'substitute', 0.30, '["burgers"]'),
    ('Add Grilled Onions', 'add', 0.30, '["burgers"]');

-- ==============================================
-- BREAKFAST-SPECIFIC CUSTOMIZATIONS
-- ==============================================

-- Biscuit vs muffin swaps
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Biscuit Instead of Muffin', 'substitute', 0.00, '["breakfast"]'),
    ('Muffin Instead of Biscuit', 'substitute', 0.00, '["breakfast"]'),
    ('McGriddles Instead of Biscuit', 'substitute', 0.50, '["breakfast"]');

-- Hash brown options
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Extra Crispy Hash Browns', 'modify', 0.00, '["breakfast"]'),
    ('Fresh Hash Browns', 'modify', 0.00, '["breakfast"]');

-- Hotcake options
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Extra Butter', 'add', 0.30, '["breakfast"]'),
    ('Extra Syrup', 'add', 0.30, '["breakfast"]'),
    ('No Butter', 'remove', 0.00, '["breakfast"]');

-- ==============================================
-- McNUGGETS SAUCE OPTIONS
-- ==============================================

INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('BBQ Sauce Packet', 'add', 0.00, '["chicken"]'),
    ('Honey Mustard Packet', 'add', 0.00, '["chicken"]'),
    ('Sweet and Sour Sauce Packet', 'add', 0.00, '["chicken"]'),
    ('Spicy Buffalo Sauce Packet', 'add', 0.00, '["chicken"]'),
    ('Creamy Ranch Sauce Packet', 'add', 0.00, '["chicken"]'),
    ('Tangy BBQ Sauce Packet', 'add', 0.00, '["chicken"]'),
    ('Hot Mustard Sauce Packet', 'add', 0.00, '["chicken"]'),
    ('Extra Sauce Packet', 'add', 0.30, '["chicken"]');

-- ==============================================
-- PORTION SIZE MODIFICATIONS
-- ==============================================

INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Light on Condiments', 'modify', 0.00, '["burgers", "chicken"]'),
    ('Heavy on Condiments', 'modify', 0.00, '["burgers", "chicken"]'),
    ('Cut in Half', 'modify', 0.00, '["burgers", "chicken"]'),
    ('Separate Container for Sauce', 'modify', 0.00, '["burgers", "chicken"]');

-- ==============================================
-- DESSERT CUSTOMIZATIONS
-- ==============================================

INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Extra Fudge', 'add', 0.50, '["desserts"]'),
    ('Extra Caramel', 'add', 0.50, '["desserts"]'),
    ('Extra Whipped Topping', 'add', 0.50, '["desserts"]'),
    ('Add M&M Candies', 'add', 0.75, '["desserts"]'),
    ('Add OREO Pieces', 'add', 0.75, '["desserts"]'),
    ('No Nuts', 'remove', 0.00, '["desserts"]'),
    ('Extra Cookie Pieces', 'add', 0.50, '["desserts"]');

-- Pie options
INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('Warm Apple Pie', 'modify', 0.00, '["desserts"]'),
    ('Room Temperature Pie', 'modify', 0.00, '["desserts"]');

-- ==============================================
-- SPECIAL REQUESTS
-- ==============================================

INSERT INTO customization_options (name, category, price_modifier, applicable_to)
VALUES
    ('On the Side', 'modify', 0.00, '["burgers", "chicken", "breakfast", "sides"]'),
    ('In Separate Container', 'modify', 0.00, '["burgers", "chicken", "sides"]'),
    ('Mix All Sodas (Suicide)', 'modify', 0.00, '["drinks"]'),
    ('Half Lemonade Half Tea (Arnold Palmer)', 'modify', 0.00, '["drinks"]');

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================
DO $$
DECLARE
    customization_count INT;
BEGIN
    SELECT COUNT(*) INTO customization_count FROM customization_options;
    RAISE NOTICE '✅ Customization options seeded successfully!';
    RAISE NOTICE 'Total customization options created: %', customization_count;
    RAISE NOTICE 'Next step: Run 04-seed-combo-meals.sql';
END $$;
