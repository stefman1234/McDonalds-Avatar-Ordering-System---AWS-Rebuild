-- McDonald's Avatar Ordering System - Menu Items Seed Data
-- Phase 1.2: Populate Menu Items
-- Run this after 01-create-tables.sql

-- ==============================================
-- BURGERS & SANDWICHES
-- ==============================================

-- Big Mac
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Big Mac',
  'burgers',
  'beef',
  'Two 100% beef patties, special sauce, lettuce, cheese, pickles, onions on a sesame seed bun',
  5.99,
  550,
  true,
  false,
  false,
  'all_day',
  true
);

-- Quarter Pounder with Cheese
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Quarter Pounder with Cheese',
  'burgers',
  'beef',
  'Quarter pound 100% beef patty, cheese, pickles, onions, ketchup, mustard on a sesame seed bun',
  6.49,
  520,
  true,
  false,
  false,
  'all_day',
  true
);

-- Double Quarter Pounder with Cheese
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Double Quarter Pounder with Cheese',
  'burgers',
  'beef',
  'Two quarter pound beef patties, cheese, pickles, onions, ketchup, mustard',
  8.49,
  740,
  true,
  false,
  false,
  'all_day',
  true
);

-- McDouble
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'McDouble',
  'burgers',
  'beef',
  'Two 100% beef patties, cheese, pickles, onions, ketchup, mustard',
  3.49,
  400,
  true,
  false,
  false,
  'all_day',
  true
);

-- Cheeseburger
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Cheeseburger',
  'burgers',
  'beef',
  '100% beef patty, cheese, pickles, onions, ketchup, mustard',
  2.49,
  300,
  true,
  false,
  false,
  'all_day',
  true
);

-- Hamburger
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Hamburger',
  'burgers',
  'beef',
  '100% beef patty, pickles, onions, ketchup, mustard',
  1.99,
  250,
  true,
  false,
  false,
  'all_day',
  false
);

-- ==============================================
-- CHICKEN SANDWICHES
-- ==============================================

-- McChicken
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'McChicken',
  'chicken',
  'sandwich',
  'Crispy chicken, lettuce, mayo on a toasted bun',
  3.99,
  400,
  true,
  false,
  false,
  'all_day',
  true
);

-- Spicy McChicken
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Spicy McChicken',
  'chicken',
  'sandwich',
  'Crispy spicy chicken, lettuce, mayo on a toasted bun',
  3.99,
  420,
  true,
  false,
  false,
  'all_day',
  true
);

-- Crispy Chicken Sandwich
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Crispy Chicken Sandwich',
  'chicken',
  'sandwich',
  'Crispy chicken fillet, crinkle-cut pickles, buttery potato roll',
  5.49,
  470,
  true,
  false,
  false,
  'all_day',
  true
);

-- Deluxe Crispy Chicken Sandwich
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Deluxe Crispy Chicken Sandwich',
  'chicken',
  'sandwich',
  'Crispy chicken, Roma tomatoes, shredded lettuce, mayo',
  6.49,
  530,
  true,
  false,
  false,
  'all_day',
  false
);

-- Spicy Crispy Chicken Sandwich
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Spicy Crispy Chicken Sandwich',
  'chicken',
  'sandwich',
  'Spicy crispy chicken fillet, crinkle-cut pickles, buttery potato roll',
  5.49,
  530,
  true,
  false,
  false,
  'all_day',
  true
);

-- ==============================================
-- CHICKEN McNUGGETS
-- ==============================================

-- 4 Piece McNuggets
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Chicken McNuggets (4 Piece)',
  'chicken',
  'nuggets',
  '4 piece tender chicken nuggets made with white meat',
  2.49,
  170,
  true,
  false,
  false,
  'all_day',
  true
);

-- 6 Piece McNuggets
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Chicken McNuggets (6 Piece)',
  'chicken',
  'nuggets',
  '6 piece tender chicken nuggets made with white meat',
  3.99,
  250,
  true,
  false,
  false,
  'all_day',
  true
);

-- 10 Piece McNuggets
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Chicken McNuggets (10 Piece)',
  'chicken',
  'nuggets',
  '10 piece tender chicken nuggets made with white meat',
  5.99,
  420,
  true,
  false,
  false,
  'all_day',
  true
);

-- 20 Piece McNuggets
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Chicken McNuggets (20 Piece)',
  'chicken',
  'nuggets',
  '20 piece tender chicken nuggets made with white meat',
  9.99,
  840,
  true,
  false,
  false,
  'all_day',
  true
);

-- ==============================================
-- BREAKFAST ITEMS
-- ==============================================

-- Egg McMuffin
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Egg McMuffin',
  'breakfast',
  'sandwich',
  'Freshly cracked egg, Canadian bacon, American cheese on a toasted English muffin',
  4.49,
  310,
  true,
  false,
  false,
  'breakfast',
  true
);

-- Sausage McMuffin with Egg
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Sausage McMuffin with Egg',
  'breakfast',
  'sandwich',
  'Sausage patty, freshly cracked egg, American cheese on a toasted English muffin',
  4.49,
  480,
  true,
  false,
  false,
  'breakfast',
  true
);

-- Sausage McMuffin
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Sausage McMuffin',
  'breakfast',
  'sandwich',
  'Sausage patty, American cheese on a toasted English muffin',
  2.99,
  400,
  true,
  false,
  false,
  'breakfast',
  false
);

-- Bacon, Egg & Cheese Biscuit
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Bacon, Egg & Cheese Biscuit',
  'breakfast',
  'sandwich',
  'Thick cut Applewood smoked bacon, fluffy folded egg, melty cheese on a warm biscuit',
  4.79,
  460,
  true,
  false,
  false,
  'breakfast',
  true
);

-- Sausage Biscuit with Egg
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Sausage Biscuit with Egg',
  'breakfast',
  'sandwich',
  'Sausage patty, fluffy folded egg on a warm buttermilk biscuit',
  4.29,
  510,
  true,
  false,
  false,
  'breakfast',
  true
);

-- Sausage Biscuit
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Sausage Biscuit',
  'breakfast',
  'sandwich',
  'Sausage patty on a warm buttermilk biscuit',
  2.49,
  460,
  true,
  false,
  false,
  'breakfast',
  false
);

-- Hash Browns
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Hash Browns',
  'breakfast',
  'sides',
  'Shredded potatoes, golden and crispy',
  1.99,
  140,
  true,
  true,
  true,
  'breakfast',
  true
);

-- Hotcakes
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Hotcakes',
  'breakfast',
  'platters',
  'Three fluffy hotcakes with butter and syrup',
  4.49,
  580,
  true,
  true,
  false,
  'breakfast',
  true
);

-- Hotcakes and Sausage
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Hotcakes and Sausage',
  'breakfast',
  'platters',
  'Three fluffy hotcakes, sausage patty, butter and syrup',
  5.49,
  770,
  true,
  false,
  false,
  'breakfast',
  true
);

-- Big Breakfast
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Big Breakfast',
  'breakfast',
  'platters',
  'Scrambled eggs, sausage patty, hash browns, and biscuit',
  6.49,
  740,
  true,
  false,
  false,
  'breakfast',
  false
);

-- Big Breakfast with Hotcakes
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Big Breakfast with Hotcakes',
  'breakfast',
  'platters',
  'Scrambled eggs, sausage, hash browns, hotcakes, and biscuit',
  7.99,
  1090,
  true,
  false,
  false,
  'breakfast',
  true
);

-- ==============================================
-- SIDES & SNACKS
-- ==============================================

-- Small Fries
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'World Famous Fries',
  'sides',
  'fries',
  'Hot, crispy, and perfectly salted golden fries',
  2.49,
  230,
  true,
  true,
  true,
  'all_day',
  true
);

-- Apple Slices
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Apple Slices',
  'sides',
  'fruit',
  'Fresh, crisp apple slices',
  1.49,
  15,
  true,
  true,
  true,
  'all_day',
  false
);

-- ==============================================
-- DRINKS
-- ==============================================

-- Coca-Cola
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Coca-Cola',
  'drinks',
  'soft_drinks',
  'Refreshing Coca-Cola',
  1.99,
  150,
  true,
  true,
  true,
  'all_day',
  true
);

-- Sprite
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Sprite',
  'drinks',
  'soft_drinks',
  'Crisp lemon-lime soda',
  1.99,
  140,
  true,
  true,
  true,
  'all_day',
  true
);

-- Dr Pepper
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Dr Pepper',
  'drinks',
  'soft_drinks',
  'The one you crave',
  1.99,
  150,
  true,
  true,
  true,
  'all_day',
  false
);

-- Fanta Orange
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Fanta Orange',
  'drinks',
  'soft_drinks',
  'Orange flavored soda',
  1.99,
  150,
  true,
  true,
  true,
  'all_day',
  false
);

-- Sweet Tea
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Sweet Tea',
  'drinks',
  'tea',
  'Freshly brewed sweet iced tea',
  1.49,
  120,
  true,
  true,
  true,
  'all_day',
  true
);

-- Unsweetened Iced Tea
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Unsweetened Iced Tea',
  'drinks',
  'tea',
  'Freshly brewed unsweetened iced tea',
  1.49,
  0,
  true,
  true,
  true,
  'all_day',
  false
);

-- Coffee
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Premium Roast Coffee',
  'drinks',
  'coffee',
  'Freshly brewed premium roast coffee',
  1.49,
  0,
  true,
  true,
  true,
  'all_day',
  true
);

-- Iced Coffee
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Iced Coffee',
  'drinks',
  'coffee',
  'Refreshingly cool iced coffee',
  2.49,
  140,
  true,
  true,
  true,
  'all_day',
  true
);

-- Caramel Frappé
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Caramel Frappé',
  'drinks',
  'frappe',
  'Caramel coffee frappé with whipped topping and caramel drizzle',
  3.99,
  420,
  true,
  true,
  false,
  'all_day',
  true
);

-- Mocha Frappé
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Mocha Frappé',
  'drinks',
  'frappe',
  'Mocha coffee frappé with whipped topping and chocolate drizzle',
  3.99,
  420,
  true,
  true,
  false,
  'all_day',
  true
);

-- Orange Juice
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Minute Maid Orange Juice',
  'drinks',
  'juice',
  '100% orange juice',
  2.49,
  150,
  true,
  true,
  true,
  'all_day',
  false
);

-- Apple Juice
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Honest Kids Apple Juice',
  'drinks',
  'juice',
  'Organic apple juice',
  1.99,
  35,
  true,
  true,
  true,
  'all_day',
  false
);

-- Milk
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Low Fat Milk Jug',
  'drinks',
  'milk',
  '1% low fat milk',
  1.49,
  100,
  true,
  true,
  true,
  'all_day',
  false
);

-- Chocolate Milk
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Chocolate Milk',
  'drinks',
  'milk',
  '1% low fat chocolate milk',
  1.49,
  130,
  true,
  true,
  true,
  'all_day',
  false
);

-- ==============================================
-- DESSERTS & TREATS
-- ==============================================

-- Vanilla Cone
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Vanilla Cone',
  'desserts',
  'ice_cream',
  'Creamy vanilla soft serve in a cone',
  1.49,
  200,
  true,
  true,
  false,
  'all_day',
  true
);

-- Hot Fudge Sundae
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Hot Fudge Sundae',
  'desserts',
  'ice_cream',
  'Vanilla soft serve with hot fudge and whipped topping',
  2.99,
  330,
  true,
  true,
  false,
  'all_day',
  true
);

-- Hot Caramel Sundae
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Hot Caramel Sundae',
  'desserts',
  'ice_cream',
  'Vanilla soft serve with hot caramel and whipped topping',
  2.99,
  340,
  true,
  true,
  false,
  'all_day',
  false
);

-- McFlurry with OREO Cookies
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'McFlurry with OREO Cookies',
  'desserts',
  'mcflurry',
  'Vanilla soft serve blended with OREO cookie pieces',
  3.99,
  510,
  true,
  true,
  false,
  'all_day',
  true
);

-- McFlurry with M&M''S Candies
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'McFlurry with M&M''S Candies',
  'desserts',
  'mcflurry',
  'Vanilla soft serve blended with M&M''S chocolate candies',
  3.99,
  640,
  true,
  true,
  false,
  'all_day',
  true
);

-- Chocolate Chip Cookie
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Chocolate Chip Cookie',
  'desserts',
  'baked_goods',
  'Freshly baked chocolate chip cookie',
  1.49,
  170,
  true,
  true,
  false,
  'all_day',
  false
);

-- Baked Apple Pie
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Baked Apple Pie',
  'desserts',
  'baked_goods',
  'Warm apple pie with a latticed crust and sprinkled with sugar',
  1.99,
  230,
  true,
  true,
  false,
  'all_day',
  true
);

-- ==============================================
-- HAPPY MEAL ITEMS
-- ==============================================

-- Hamburger Happy Meal
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  'Hamburger Happy Meal',
  'happy_meal',
  'meal',
  'Hamburger with kids fries and a drink. Includes toy!',
  5.49,
  475,
  true,
  false,
  false,
  'all_day',
  true
);

-- 4 Piece McNuggets Happy Meal
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  '4 Piece McNuggets Happy Meal',
  'happy_meal',
  'meal',
  '4 piece McNuggets with kids fries and a drink. Includes toy!',
  5.49,
  395,
  true,
  false,
  false,
  'all_day',
  true
);

-- 6 Piece McNuggets Happy Meal
INSERT INTO menu_items (name, category, subcategory, description, base_price, calories, available, vegetarian, gluten_free, time_restriction, popular)
VALUES (
  '6 Piece McNuggets Happy Meal',
  'happy_meal',
  'meal',
  '6 piece McNuggets with kids fries and a drink. Includes toy!',
  6.49,
  475,
  true,
  false,
  false,
  'all_day',
  true
);

-- ==============================================
-- Add size variations for drinks and fries
-- ==============================================

-- Get the fries ID
DO $$
DECLARE
    fries_id UUID;
    coke_id UUID;
    sprite_id UUID;
    drpepper_id UUID;
    fanta_id UUID;
    coffee_id UUID;
    iced_coffee_id UUID;
BEGIN
    -- Fries sizes
    SELECT id INTO fries_id FROM menu_items WHERE name = 'World Famous Fries' LIMIT 1;
    IF fries_id IS NOT NULL THEN
        INSERT INTO menu_item_sizes (menu_item_id, size_name, price_modifier, calories_modifier)
        VALUES
            (fries_id, 'Small', 0.00, 0),
            (fries_id, 'Medium', 1.00, 110),
            (fries_id, 'Large', 1.50, 280);
    END IF;

    -- Coca-Cola sizes
    SELECT id INTO coke_id FROM menu_items WHERE name = 'Coca-Cola' LIMIT 1;
    IF coke_id IS NOT NULL THEN
        INSERT INTO menu_item_sizes (menu_item_id, size_name, price_modifier, calories_modifier)
        VALUES
            (coke_id, 'Small', 0.00, 0),
            (coke_id, 'Medium', 0.50, 60),
            (coke_id, 'Large', 0.70, 140);
    END IF;

    -- Sprite sizes
    SELECT id INTO sprite_id FROM menu_items WHERE name = 'Sprite' LIMIT 1;
    IF sprite_id IS NOT NULL THEN
        INSERT INTO menu_item_sizes (menu_item_id, size_name, price_modifier, calories_modifier)
        VALUES
            (sprite_id, 'Small', 0.00, 0),
            (sprite_id, 'Medium', 0.50, 60),
            (sprite_id, 'Large', 0.70, 140);
    END IF;

    -- Dr Pepper sizes
    SELECT id INTO drpepper_id FROM menu_items WHERE name = 'Dr Pepper' LIMIT 1;
    IF drpepper_id IS NOT NULL THEN
        INSERT INTO menu_item_sizes (menu_item_id, size_name, price_modifier, calories_modifier)
        VALUES
            (drpepper_id, 'Small', 0.00, 0),
            (drpepper_id, 'Medium', 0.50, 60),
            (drpepper_id, 'Large', 0.70, 140);
    END IF;

    -- Fanta sizes
    SELECT id INTO fanta_id FROM menu_items WHERE name = 'Fanta Orange' LIMIT 1;
    IF fanta_id IS NOT NULL THEN
        INSERT INTO menu_item_sizes (menu_item_id, size_name, price_modifier, calories_modifier)
        VALUES
            (fanta_id, 'Small', 0.00, 0),
            (fanta_id, 'Medium', 0.50, 60),
            (fanta_id, 'Large', 0.70, 140);
    END IF;

    -- Coffee sizes
    SELECT id INTO coffee_id FROM menu_items WHERE name = 'Premium Roast Coffee' LIMIT 1;
    IF coffee_id IS NOT NULL THEN
        INSERT INTO menu_item_sizes (menu_item_id, size_name, price_modifier, calories_modifier)
        VALUES
            (coffee_id, 'Small', 0.00, 0),
            (coffee_id, 'Medium', 0.50, 0),
            (coffee_id, 'Large', 0.80, 0);
    END IF;

    -- Iced Coffee sizes
    SELECT id INTO iced_coffee_id FROM menu_items WHERE name = 'Iced Coffee' LIMIT 1;
    IF iced_coffee_id IS NOT NULL THEN
        INSERT INTO menu_item_sizes (menu_item_id, size_name, price_modifier, calories_modifier)
        VALUES
            (iced_coffee_id, 'Small', 0.00, 0),
            (iced_coffee_id, 'Medium', 0.50, 50),
            (iced_coffee_id, 'Large', 0.80, 100);
    END IF;
END $$;

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Menu items seeded successfully! Created 50+ items.';
    RAISE NOTICE 'Next step: Run 03-seed-customizations.sql';
END $$;
