-- McDonald's Avatar Ordering System - Combo Meals Seed Data
-- Phase 1.2: Populate Combo Meals
-- Run this after 03-seed-customizations.sql

-- ==============================================
-- BURGER COMBO MEALS
-- ==============================================

-- Big Mac Meal
DO $$
DECLARE
    bigmac_id UUID;
BEGIN
    SELECT id INTO bigmac_id FROM menu_items WHERE name = 'Big Mac' LIMIT 1;

    IF bigmac_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Big Mac Meal',
            'Big Mac sandwich with medium fries and medium drink',
            9.99,
            1.50,
            jsonb_build_object(
                'main', bigmac_id::text,
                'main_name', 'Big Mac',
                'side', 'fries',
                'side_size', 'Medium',
                'drink', 'any_soft_drink',
                'drink_size', 'Medium'
            ),
            true,
            true
        );
    END IF;
END $$;

-- Quarter Pounder with Cheese Meal
DO $$
DECLARE
    qpc_id UUID;
BEGIN
    SELECT id INTO qpc_id FROM menu_items WHERE name = 'Quarter Pounder with Cheese' LIMIT 1;

    IF qpc_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Quarter Pounder with Cheese Meal',
            'Quarter Pounder with Cheese, medium fries and medium drink',
            10.49,
            1.50,
            jsonb_build_object(
                'main', qpc_id::text,
                'main_name', 'Quarter Pounder with Cheese',
                'side', 'fries',
                'side_size', 'Medium',
                'drink', 'any_soft_drink',
                'drink_size', 'Medium'
            ),
            true,
            true
        );
    END IF;
END $$;

-- Double Quarter Pounder with Cheese Meal
DO $$
DECLARE
    dqpc_id UUID;
BEGIN
    SELECT id INTO dqpc_id FROM menu_items WHERE name = 'Double Quarter Pounder with Cheese' LIMIT 1;

    IF dqpc_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Double Quarter Pounder with Cheese Meal',
            'Double Quarter Pounder with Cheese, medium fries and medium drink',
            12.49,
            1.50,
            jsonb_build_object(
                'main', dqpc_id::text,
                'main_name', 'Double Quarter Pounder with Cheese',
                'side', 'fries',
                'side_size', 'Medium',
                'drink', 'any_soft_drink',
                'drink_size', 'Medium'
            ),
            true,
            true
        );
    END IF;
END $$;

-- McDouble Meal
DO $$
DECLARE
    mcdouble_id UUID;
BEGIN
    SELECT id INTO mcdouble_id FROM menu_items WHERE name = 'McDouble' LIMIT 1;

    IF mcdouble_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'McDouble Meal',
            'McDouble sandwich with medium fries and medium drink',
            7.49,
            1.00,
            jsonb_build_object(
                'main', mcdouble_id::text,
                'main_name', 'McDouble',
                'side', 'fries',
                'side_size', 'Medium',
                'drink', 'any_soft_drink',
                'drink_size', 'Medium'
            ),
            true,
            true
        );
    END IF;
END $$;

-- Cheeseburger Meal
DO $$
DECLARE
    cheeseburger_id UUID;
BEGIN
    SELECT id INTO cheeseburger_id FROM menu_items WHERE name = 'Cheeseburger' LIMIT 1;

    IF cheeseburger_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Cheeseburger Meal',
            'Cheeseburger with medium fries and medium drink',
            6.49,
            1.00,
            jsonb_build_object(
                'main', cheeseburger_id::text,
                'main_name', 'Cheeseburger',
                'side', 'fries',
                'side_size', 'Medium',
                'drink', 'any_soft_drink',
                'drink_size', 'Medium'
            ),
            false,
            true
        );
    END IF;
END $$;

-- ==============================================
-- CHICKEN COMBO MEALS
-- ==============================================

-- 10 Piece McNuggets Meal
DO $$
DECLARE
    nuggets_id UUID;
BEGIN
    SELECT id INTO nuggets_id FROM menu_items WHERE name = 'Chicken McNuggets (10 Piece)' LIMIT 1;

    IF nuggets_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            '10 Piece McNuggets Meal',
            '10 piece Chicken McNuggets with medium fries and medium drink',
            9.99,
            1.50,
            jsonb_build_object(
                'main', nuggets_id::text,
                'main_name', '10 Piece McNuggets',
                'side', 'fries',
                'side_size', 'Medium',
                'drink', 'any_soft_drink',
                'drink_size', 'Medium',
                'sauce_count', 2
            ),
            true,
            true
        );
    END IF;
END $$;

-- 20 Piece McNuggets Meal
DO $$
DECLARE
    nuggets20_id UUID;
BEGIN
    SELECT id INTO nuggets20_id FROM menu_items WHERE name = 'Chicken McNuggets (20 Piece)' LIMIT 1;

    IF nuggets20_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            '20 Piece McNuggets Meal',
            '20 piece Chicken McNuggets with medium fries and medium drink',
            13.99,
            2.00,
            jsonb_build_object(
                'main', nuggets20_id::text,
                'main_name', '20 Piece McNuggets',
                'side', 'fries',
                'side_size', 'Medium',
                'drink', 'any_soft_drink',
                'drink_size', 'Medium',
                'sauce_count', 4
            ),
            true,
            true
        );
    END IF;
END $$;

-- Crispy Chicken Sandwich Meal
DO $$
DECLARE
    crispy_chicken_id UUID;
BEGIN
    SELECT id INTO crispy_chicken_id FROM menu_items WHERE name = 'Crispy Chicken Sandwich' LIMIT 1;

    IF crispy_chicken_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Crispy Chicken Sandwich Meal',
            'Crispy Chicken Sandwich with medium fries and medium drink',
            9.49,
            1.50,
            jsonb_build_object(
                'main', crispy_chicken_id::text,
                'main_name', 'Crispy Chicken Sandwich',
                'side', 'fries',
                'side_size', 'Medium',
                'drink', 'any_soft_drink',
                'drink_size', 'Medium'
            ),
            true,
            true
        );
    END IF;
END $$;

-- Spicy Crispy Chicken Sandwich Meal
DO $$
DECLARE
    spicy_crispy_id UUID;
BEGIN
    SELECT id INTO spicy_crispy_id FROM menu_items WHERE name = 'Spicy Crispy Chicken Sandwich' LIMIT 1;

    IF spicy_crispy_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Spicy Crispy Chicken Sandwich Meal',
            'Spicy Crispy Chicken Sandwich with medium fries and medium drink',
            9.49,
            1.50,
            jsonb_build_object(
                'main', spicy_crispy_id::text,
                'main_name', 'Spicy Crispy Chicken Sandwich',
                'side', 'fries',
                'side_size', 'Medium',
                'drink', 'any_soft_drink',
                'drink_size', 'Medium'
            ),
            true,
            true
        );
    END IF;
END $$;

-- Deluxe Crispy Chicken Sandwich Meal
DO $$
DECLARE
    deluxe_crispy_id UUID;
BEGIN
    SELECT id INTO deluxe_crispy_id FROM menu_items WHERE name = 'Deluxe Crispy Chicken Sandwich' LIMIT 1;

    IF deluxe_crispy_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Deluxe Crispy Chicken Sandwich Meal',
            'Deluxe Crispy Chicken Sandwich with medium fries and medium drink',
            10.49,
            1.50,
            jsonb_build_object(
                'main', deluxe_crispy_id::text,
                'main_name', 'Deluxe Crispy Chicken Sandwich',
                'side', 'fries',
                'side_size', 'Medium',
                'drink', 'any_soft_drink',
                'drink_size', 'Medium'
            ),
            false,
            true
        );
    END IF;
END $$;

-- McChicken Meal
DO $$
DECLARE
    mcchicken_id UUID;
BEGIN
    SELECT id INTO mcchicken_id FROM menu_items WHERE name = 'McChicken' LIMIT 1;

    IF mcchicken_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'McChicken Meal',
            'McChicken sandwich with medium fries and medium drink',
            7.99,
            1.00,
            jsonb_build_object(
                'main', mcchicken_id::text,
                'main_name', 'McChicken',
                'side', 'fries',
                'side_size', 'Medium',
                'drink', 'any_soft_drink',
                'drink_size', 'Medium'
            ),
            true,
            true
        );
    END IF;
END $$;

-- ==============================================
-- BREAKFAST COMBO MEALS
-- ==============================================

-- Egg McMuffin Meal
DO $$
DECLARE
    eggmcmuffin_id UUID;
BEGIN
    SELECT id INTO eggmcmuffin_id FROM menu_items WHERE name = 'Egg McMuffin' LIMIT 1;

    IF eggmcmuffin_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Egg McMuffin Meal',
            'Egg McMuffin with hash browns and medium coffee or drink',
            7.49,
            1.00,
            jsonb_build_object(
                'main', eggmcmuffin_id::text,
                'main_name', 'Egg McMuffin',
                'side', 'hash_browns',
                'drink', 'coffee_or_soft_drink',
                'drink_size', 'Medium'
            ),
            true,
            true
        );
    END IF;
END $$;

-- Sausage McMuffin with Egg Meal
DO $$
DECLARE
    sausage_mcmuffin_id UUID;
BEGIN
    SELECT id INTO sausage_mcmuffin_id FROM menu_items WHERE name = 'Sausage McMuffin with Egg' LIMIT 1;

    IF sausage_mcmuffin_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Sausage McMuffin with Egg Meal',
            'Sausage McMuffin with Egg, hash browns and medium coffee or drink',
            7.49,
            1.00,
            jsonb_build_object(
                'main', sausage_mcmuffin_id::text,
                'main_name', 'Sausage McMuffin with Egg',
                'side', 'hash_browns',
                'drink', 'coffee_or_soft_drink',
                'drink_size', 'Medium'
            ),
            true,
            true
        );
    END IF;
END $$;

-- Bacon, Egg & Cheese Biscuit Meal
DO $$
DECLARE
    bacon_biscuit_id UUID;
BEGIN
    SELECT id INTO bacon_biscuit_id FROM menu_items WHERE name = 'Bacon, Egg & Cheese Biscuit' LIMIT 1;

    IF bacon_biscuit_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Bacon, Egg & Cheese Biscuit Meal',
            'Bacon, Egg & Cheese Biscuit with hash browns and medium coffee or drink',
            7.79,
            1.00,
            jsonb_build_object(
                'main', bacon_biscuit_id::text,
                'main_name', 'Bacon, Egg & Cheese Biscuit',
                'side', 'hash_browns',
                'drink', 'coffee_or_soft_drink',
                'drink_size', 'Medium'
            ),
            true,
            true
        );
    END IF;
END $$;

-- Sausage Biscuit with Egg Meal
DO $$
DECLARE
    sausage_biscuit_id UUID;
BEGIN
    SELECT id INTO sausage_biscuit_id FROM menu_items WHERE name = 'Sausage Biscuit with Egg' LIMIT 1;

    IF sausage_biscuit_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Sausage Biscuit with Egg Meal',
            'Sausage Biscuit with Egg, hash browns and medium coffee or drink',
            7.29,
            1.00,
            jsonb_build_object(
                'main', sausage_biscuit_id::text,
                'main_name', 'Sausage Biscuit with Egg',
                'side', 'hash_browns',
                'drink', 'coffee_or_soft_drink',
                'drink_size', 'Medium'
            ),
            true,
            true
        );
    END IF;
END $$;

-- Big Breakfast Meal
DO $$
DECLARE
    big_breakfast_id UUID;
BEGIN
    SELECT id INTO big_breakfast_id FROM menu_items WHERE name = 'Big Breakfast' LIMIT 1;

    IF big_breakfast_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Big Breakfast Meal',
            'Big Breakfast with medium coffee or drink',
            8.49,
            1.00,
            jsonb_build_object(
                'main', big_breakfast_id::text,
                'main_name', 'Big Breakfast',
                'drink', 'coffee_or_soft_drink',
                'drink_size', 'Medium',
                'note', 'Includes scrambled eggs, sausage, hash browns, and biscuit'
            ),
            false,
            true
        );
    END IF;
END $$;

-- Big Breakfast with Hotcakes Meal
DO $$
DECLARE
    big_breakfast_hotcakes_id UUID;
BEGIN
    SELECT id INTO big_breakfast_hotcakes_id FROM menu_items WHERE name = 'Big Breakfast with Hotcakes' LIMIT 1;

    IF big_breakfast_hotcakes_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Big Breakfast with Hotcakes Meal',
            'Big Breakfast with Hotcakes and medium coffee or drink',
            9.99,
            1.00,
            jsonb_build_object(
                'main', big_breakfast_hotcakes_id::text,
                'main_name', 'Big Breakfast with Hotcakes',
                'drink', 'coffee_or_soft_drink',
                'drink_size', 'Medium',
                'note', 'Includes scrambled eggs, sausage, hash browns, hotcakes, and biscuit'
            ),
            true,
            true
        );
    END IF;
END $$;

-- Hotcakes and Sausage Meal
DO $$
DECLARE
    hotcakes_sausage_id UUID;
BEGIN
    SELECT id INTO hotcakes_sausage_id FROM menu_items WHERE name = 'Hotcakes and Sausage' LIMIT 1;

    IF hotcakes_sausage_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Hotcakes and Sausage Meal',
            'Hotcakes and Sausage with hash browns and medium coffee or drink',
            7.99,
            1.00,
            jsonb_build_object(
                'main', hotcakes_sausage_id::text,
                'main_name', 'Hotcakes and Sausage',
                'side', 'hash_browns',
                'drink', 'coffee_or_soft_drink',
                'drink_size', 'Medium'
            ),
            true,
            true
        );
    END IF;
END $$;

-- ==============================================
-- VALUE COMBO DEALS
-- ==============================================

-- 2 Cheeseburger Meal
DO $$
DECLARE
    cheeseburger_id UUID;
BEGIN
    SELECT id INTO cheeseburger_id FROM menu_items WHERE name = 'Cheeseburger' LIMIT 1;

    IF cheeseburger_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            '2 Cheeseburger Meal',
            'Two Cheeseburgers with medium fries and medium drink',
            7.99,
            1.50,
            jsonb_build_object(
                'main', cheeseburger_id::text,
                'main_name', 'Cheeseburger',
                'main_quantity', 2,
                'side', 'fries',
                'side_size', 'Medium',
                'drink', 'any_soft_drink',
                'drink_size', 'Medium'
            ),
            true,
            true
        );
    END IF;
END $$;

-- Mix & Match Deal (6 Nuggets + McDouble)
DO $$
DECLARE
    nuggets6_id UUID;
    mcdouble_id UUID;
BEGIN
    SELECT id INTO nuggets6_id FROM menu_items WHERE name = 'Chicken McNuggets (6 Piece)' LIMIT 1;
    SELECT id INTO mcdouble_id FROM menu_items WHERE name = 'McDouble' LIMIT 1;

    IF nuggets6_id IS NOT NULL AND mcdouble_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Mix & Match: McDouble + 6pc Nuggets Meal',
            'McDouble and 6 piece McNuggets with medium fries and medium drink',
            9.99,
            2.00,
            jsonb_build_object(
                'mains', jsonb_build_array(
                    jsonb_build_object('id', mcdouble_id::text, 'name', 'McDouble'),
                    jsonb_build_object('id', nuggets6_id::text, 'name', '6 Piece McNuggets')
                ),
                'side', 'fries',
                'side_size', 'Medium',
                'drink', 'any_soft_drink',
                'drink_size', 'Medium',
                'sauce_count', 1
            ),
            true,
            true
        );
    END IF;
END $$;

-- Family Bundle (20pc Nuggets + 2 Medium Fries)
DO $$
DECLARE
    nuggets20_id UUID;
BEGIN
    SELECT id INTO nuggets20_id FROM menu_items WHERE name = 'Chicken McNuggets (20 Piece)' LIMIT 1;

    IF nuggets20_id IS NOT NULL THEN
        INSERT INTO combo_meals (name, description, base_price, discount_amount, includes, popular, available)
        VALUES (
            'Family Bundle: 20pc Nuggets',
            '20 piece McNuggets with 2 medium fries',
            14.99,
            3.00,
            jsonb_build_object(
                'main', nuggets20_id::text,
                'main_name', '20 Piece McNuggets',
                'sides', jsonb_build_array(
                    jsonb_build_object('type', 'fries', 'size', 'Medium', 'quantity', 2)
                ),
                'sauce_count', 4,
                'note', 'Perfect for sharing!'
            ),
            true,
            true
        );
    END IF;
END $$;

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================
DO $$
DECLARE
    combo_count INT;
BEGIN
    SELECT COUNT(*) INTO combo_count FROM combo_meals;
    RAISE NOTICE '✅ Combo meals seeded successfully!';
    RAISE NOTICE 'Total combo meals created: %', combo_count;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATABASE SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Menu Items: % items', (SELECT COUNT(*) FROM menu_items);
    RAISE NOTICE '  - Menu Sizes: % size options', (SELECT COUNT(*) FROM menu_item_sizes);
    RAISE NOTICE '  - Customizations: % options', (SELECT COUNT(*) FROM customization_options);
    RAISE NOTICE '  - Combo Meals: % combos', combo_count;
    RAISE NOTICE '';
    RAISE NOTICE 'All tables are ready for use!';
    RAISE NOTICE '========================================';
END $$;
