-- McDonald's Avatar Ordering System - Database Verification Script
-- Run this to verify all tables and data were created successfully

-- ==============================================
-- CHECK 1: Verify All Tables Exist
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'DATABASE VERIFICATION REPORT';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Check table counts
DO $$
DECLARE
    menu_items_count INT;
    menu_sizes_count INT;
    customizations_count INT;
    combo_meals_count INT;
    orders_count INT;
    order_items_count INT;
    sessions_count INT;
BEGIN
    -- Count records in each table
    SELECT COUNT(*) INTO menu_items_count FROM menu_items;
    SELECT COUNT(*) INTO menu_sizes_count FROM menu_item_sizes;
    SELECT COUNT(*) INTO customizations_count FROM customization_options;
    SELECT COUNT(*) INTO combo_meals_count FROM combo_meals;
    SELECT COUNT(*) INTO orders_count FROM orders;
    SELECT COUNT(*) INTO order_items_count FROM order_items;
    SELECT COUNT(*) INTO sessions_count FROM conversation_sessions;

    RAISE NOTICE '✅ TABLE RECORD COUNTS:';
    RAISE NOTICE '-------------------------------------------';
    RAISE NOTICE '  menu_items:              % records', menu_items_count;
    RAISE NOTICE '  menu_item_sizes:         % records', menu_sizes_count;
    RAISE NOTICE '  customization_options:   % records', customizations_count;
    RAISE NOTICE '  combo_meals:             % records', combo_meals_count;
    RAISE NOTICE '  orders:                  % records', orders_count;
    RAISE NOTICE '  order_items:             % records', order_items_count;
    RAISE NOTICE '  conversation_sessions:   % records', sessions_count;
    RAISE NOTICE '';

    -- Verify expected counts
    IF menu_items_count >= 50 THEN
        RAISE NOTICE '✅ Menu Items: PASS (Expected 50+, Got %)', menu_items_count;
    ELSE
        RAISE NOTICE '❌ Menu Items: FAIL (Expected 50+, Got %)', menu_items_count;
    END IF;

    IF menu_sizes_count >= 10 THEN
        RAISE NOTICE '✅ Menu Sizes: PASS (Expected 10+, Got %)', menu_sizes_count;
    ELSE
        RAISE NOTICE '⚠️  Menu Sizes: WARNING (Expected 10+, Got %)', menu_sizes_count;
    END IF;

    IF customizations_count >= 100 THEN
        RAISE NOTICE '✅ Customizations: PASS (Expected 100+, Got %)', customizations_count;
    ELSE
        RAISE NOTICE '❌ Customizations: FAIL (Expected 100+, Got %)', customizations_count;
    END IF;

    IF combo_meals_count >= 15 THEN
        RAISE NOTICE '✅ Combo Meals: PASS (Expected 15+, Got %)', combo_meals_count;
    ELSE
        RAISE NOTICE '⚠️  Combo Meals: WARNING (Expected 15+, Got %)', combo_meals_count;
    END IF;

    RAISE NOTICE '';
END $$;

-- ==============================================
-- CHECK 2: Verify Menu Items by Category
-- ==============================================
DO $$
DECLARE
    burgers_count INT;
    chicken_count INT;
    breakfast_count INT;
    drinks_count INT;
    desserts_count INT;
    sides_count INT;
BEGIN
    SELECT COUNT(*) INTO burgers_count FROM menu_items WHERE category = 'burgers';
    SELECT COUNT(*) INTO chicken_count FROM menu_items WHERE category = 'chicken';
    SELECT COUNT(*) INTO breakfast_count FROM menu_items WHERE category = 'breakfast';
    SELECT COUNT(*) INTO drinks_count FROM menu_items WHERE category = 'drinks';
    SELECT COUNT(*) INTO desserts_count FROM menu_items WHERE category = 'desserts';
    SELECT COUNT(*) INTO sides_count FROM menu_items WHERE category = 'sides';

    RAISE NOTICE '✅ MENU ITEMS BY CATEGORY:';
    RAISE NOTICE '-------------------------------------------';
    RAISE NOTICE '  Burgers:    % items', burgers_count;
    RAISE NOTICE '  Chicken:    % items', chicken_count;
    RAISE NOTICE '  Breakfast:  % items', breakfast_count;
    RAISE NOTICE '  Drinks:     % items', drinks_count;
    RAISE NOTICE '  Desserts:   % items', desserts_count;
    RAISE NOTICE '  Sides:      % items', sides_count;
    RAISE NOTICE '';
END $$;

-- ==============================================
-- CHECK 3: Verify Customizations by Category
-- ==============================================
DO $$
DECLARE
    remove_count INT;
    add_count INT;
    modify_count INT;
    substitute_count INT;
BEGIN
    SELECT COUNT(*) INTO remove_count FROM customization_options WHERE category = 'remove';
    SELECT COUNT(*) INTO add_count FROM customization_options WHERE category = 'add';
    SELECT COUNT(*) INTO modify_count FROM customization_options WHERE category = 'modify';
    SELECT COUNT(*) INTO substitute_count FROM customization_options WHERE category = 'substitute';

    RAISE NOTICE '✅ CUSTOMIZATIONS BY TYPE:';
    RAISE NOTICE '-------------------------------------------';
    RAISE NOTICE '  Remove:      % options', remove_count;
    RAISE NOTICE '  Add:         % options', add_count;
    RAISE NOTICE '  Modify:      % options', modify_count;
    RAISE NOTICE '  Substitute:  % options', substitute_count;
    RAISE NOTICE '';
END $$;

-- ==============================================
-- CHECK 4: Verify Popular Items Exist
-- ==============================================
DO $$
DECLARE
    popular_items_count INT;
    popular_combos_count INT;
BEGIN
    SELECT COUNT(*) INTO popular_items_count FROM menu_items WHERE popular = true;
    SELECT COUNT(*) INTO popular_combos_count FROM combo_meals WHERE popular = true;

    RAISE NOTICE '✅ POPULAR ITEMS:';
    RAISE NOTICE '-------------------------------------------';
    RAISE NOTICE '  Popular Menu Items: % items', popular_items_count;
    RAISE NOTICE '  Popular Combo Meals: % combos', popular_combos_count;
    RAISE NOTICE '';
END $$;

-- ==============================================
-- CHECK 5: Verify Price Ranges
-- ==============================================
DO $$
DECLARE
    min_price DECIMAL;
    max_price DECIMAL;
    avg_price DECIMAL;
BEGIN
    SELECT MIN(base_price) INTO min_price FROM menu_items;
    SELECT MAX(base_price) INTO max_price FROM menu_items;
    SELECT ROUND(AVG(base_price)::numeric, 2) INTO avg_price FROM menu_items;

    RAISE NOTICE '✅ PRICE RANGES:';
    RAISE NOTICE '-------------------------------------------';
    RAISE NOTICE '  Cheapest Item:  $%', min_price;
    RAISE NOTICE '  Most Expensive: $%', max_price;
    RAISE NOTICE '  Average Price:  $%', avg_price;
    RAISE NOTICE '';
END $$;

-- ==============================================
-- CHECK 6: Sample Data from Each Table
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ SAMPLE DATA:';
    RAISE NOTICE '-------------------------------------------';
    RAISE NOTICE 'Check the Results tab below for sample items';
    RAISE NOTICE '';
END $$;

-- Show 5 sample menu items
SELECT
    'MENU ITEMS' as sample_type,
    SUBSTRING(name FROM 1 FOR 30) as item_name,
    category,
    CONCAT('$', base_price::text) as price,
    CASE WHEN popular THEN 'Popular' ELSE '' END as tags
FROM menu_items
ORDER BY category, name
LIMIT 5;

-- ==============================================
-- CHECK 7: Verify Indexes Exist
-- ==============================================
DO $$
DECLARE
    index_count INT;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('menu_items', 'menu_item_sizes', 'customization_options', 'combo_meals', 'orders', 'order_items', 'conversation_sessions');

    RAISE NOTICE '';
    RAISE NOTICE '✅ DATABASE INDEXES:';
    RAISE NOTICE '-------------------------------------------';
    RAISE NOTICE '  Total Indexes Created: %', index_count;

    IF index_count >= 10 THEN
        RAISE NOTICE '  Status: ✅ PASS (Expected 10+)';
    ELSE
        RAISE NOTICE '  Status: ⚠️  WARNING (Expected 10+)';
    END IF;
    RAISE NOTICE '';
END $$;

-- ==============================================
-- CHECK 8: Verify Foreign Key Relationships
-- ==============================================
DO $$
DECLARE
    fk_count INT;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public';

    RAISE NOTICE '✅ FOREIGN KEY RELATIONSHIPS:';
    RAISE NOTICE '-------------------------------------------';
    RAISE NOTICE '  Foreign Keys Created: %', fk_count;

    IF fk_count >= 3 THEN
        RAISE NOTICE '  Status: ✅ PASS';
    ELSE
        RAISE NOTICE '  Status: ⚠️  WARNING';
    END IF;
    RAISE NOTICE '';
END $$;

-- ==============================================
-- CHECK 9: Test JSONB Fields
-- ==============================================
DO $$
DECLARE
    jsonb_combo_count INT;
BEGIN
    -- Verify combo meals have valid JSONB includes field
    SELECT COUNT(*) INTO jsonb_combo_count
    FROM combo_meals
    WHERE jsonb_typeof(includes) = 'object';

    RAISE NOTICE '✅ JSONB DATA INTEGRITY:';
    RAISE NOTICE '-------------------------------------------';
    RAISE NOTICE '  Combo Meals with valid JSONB: %', jsonb_combo_count;

    IF jsonb_combo_count > 0 THEN
        RAISE NOTICE '  Status: ✅ PASS';
    ELSE
        RAISE NOTICE '  Status: ❌ FAIL';
    END IF;
    RAISE NOTICE '';
END $$;

-- ==============================================
-- FINAL SUMMARY
-- ==============================================
DO $$
DECLARE
    total_records INT;
BEGIN
    SELECT
        (SELECT COUNT(*) FROM menu_items) +
        (SELECT COUNT(*) FROM menu_item_sizes) +
        (SELECT COUNT(*) FROM customization_options) +
        (SELECT COUNT(*) FROM combo_meals)
    INTO total_records;

    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ VERIFICATION COMPLETE!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Total Records Created: %', total_records;
    RAISE NOTICE '';
    RAISE NOTICE 'Database Status: ✅ READY FOR USE';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Set up Prisma ORM';
    RAISE NOTICE '  2. Generate TypeScript types';
    RAISE NOTICE '  3. Create API endpoints';
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
END $$;
