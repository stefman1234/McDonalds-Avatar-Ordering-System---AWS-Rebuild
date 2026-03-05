import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgelwbilxwglksdidtgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nZWx3YmlseHdnbGtzZGlkdGdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgzMTYyNCwiZXhwIjoyMDc4NDA3NjI0fQ.vS_PCMYdhXPLviJY_u8L4tisII_ECF9Zb6ULIch8jkQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping of menu items to their tags and search terms
const searchData: Record<string, { tags: string[]; search_terms: string[] }> = {
  // Burgers
  'Big Mac': {
    tags: ['burger', 'beef', 'popular', 'classic'],
    search_terms: ['bigmac', 'big mac', 'large burger', 'double burger'],
  },
  'Quarter Pounder with Cheese': {
    tags: ['burger', 'beef', 'cheese'],
    search_terms: ['quarter pounder', 'qpc', 'quarter', 'beef burger'],
  },
  'Double Quarter Pounder with Cheese': {
    tags: ['burger', 'beef', 'cheese', 'double'],
    search_terms: ['double quarter', 'dqp', 'big beef', 'double beef'],
  },
  'McChicken': {
    tags: ['burger', 'chicken', 'popular'],
    search_terms: ['mcchicken', 'chicken burger', 'ayam burger'],
  },
  'Spicy Chicken McDeluxe': {
    tags: ['burger', 'chicken', 'spicy', 'deluxe'],
    search_terms: ['spicy chicken', 'hot chicken', 'mcspicy', 'ayam pedas', 'spicy burger'],
  },
  'Double Spicy': {
    tags: ['burger', 'chicken', 'spicy', 'double'],
    search_terms: ['double spicy', 'extra spicy', '2x spicy', 'very spicy'],
  },
  'Samurai Burger': {
    tags: ['burger', 'beef', 'teriyaki', 'special'],
    search_terms: ['samurai', 'teriyaki burger', 'japanese burger'],
  },
  'GCB': {
    tags: ['burger', 'chicken', 'grilled', 'healthy'],
    search_terms: ['gcb', 'grilled chicken', 'ayam bakar', 'healthy burger', 'grilled chicken burger'],
  },
  'Double Cheeseburger': {
    tags: ['burger', 'beef', 'cheese', 'double'],
    search_terms: ['double cheese', 'double cheeseburger', 'double beef cheese', '2 patty cheese'],
  },
  'Cheeseburger': {
    tags: ['burger', 'beef', 'cheese', 'classic'],
    search_terms: ['cheese burger', 'cheeseburger', 'beef cheese', 'classic burger'],
  },
  'Hamburger': {
    tags: ['burger', 'beef', 'classic', 'simple'],
    search_terms: ['hamburger', 'burger', 'beef burger', 'borgir', 'simple burger'],
  },
  'Filet-O-Fish': {
    tags: ['burger', 'fish', 'seafood'],
    search_terms: ['fish burger', 'filet o fish', 'ikan burger', 'seafood'],
  },
  'McDouble': {
    tags: ['burger', 'beef', 'double', 'cheese'],
    search_terms: ['mcdouble', 'double burger', 'double beef', '2 patty'],
  },

  // Chicken (with space variations)
  'Chicken McNuggets 4 Piece': {
    tags: ['chicken', 'nuggets', 'kids', 'fried'],
    search_terms: ['nuggets', 'mcnuggets', '4 piece', 'ayam nugget', 'chicken nugget', '4 nuggets', '4pc'],
  },
  'Chicken McNuggets 6 Piece': {
    tags: ['chicken', 'nuggets', 'popular', 'fried'],
    search_terms: ['nuggets', 'mcnuggets', '6 piece', 'ayam nugget', 'chicken nugget', '6 nuggets', '6pc'],
  },
  'Chicken McNuggets 9 Piece': {
    tags: ['chicken', 'nuggets', 'fried'],
    search_terms: ['nuggets', 'mcnuggets', '9 piece', 'ayam nugget', 'chicken nugget', '9 nuggets', '9pc'],
  },
  'Chicken McNuggets 20 Piece': {
    tags: ['chicken', 'nuggets', 'fried', 'party', 'sharing'],
    search_terms: ['nuggets', 'mcnuggets', '20 piece', 'ayam nugget', 'chicken nugget', 'party pack', '20pc'],
  },
  'Spicy Chicken McWings': {
    tags: ['chicken', 'spicy', 'wings', 'fried'],
    search_terms: ['wings', 'mcwings', 'chicken wings', 'spicy wings', 'ayam goreng', 'hot wings'],
  },
  'Ayam Goreng McD (Fried Chicken)': {
    tags: ['chicken', 'fried', 'malaysian', 'local'],
    search_terms: ['fried chicken', 'ayam goreng', 'ayam', 'drumstick', 'chicken pieces'],
  },

  // Breakfast
  'Sausage McMuffin': {
    tags: ['breakfast', 'sausage', 'muffin'],
    search_terms: ['breakfast sandwich', 'sausage muffin', 'morning meal', 'sarapan'],
  },
  'Sausage McMuffin with Egg': {
    tags: ['breakfast', 'sausage', 'egg', 'muffin'],
    search_terms: ['egg muffin', 'sausage egg', 'breakfast sandwich'],
  },
  'Egg McMuffin': {
    tags: ['breakfast', 'egg', 'muffin', 'classic'],
    search_terms: ['egg sandwich', 'breakfast muffin', 'morning sandwich'],
  },
  'Big Breakfast': {
    tags: ['breakfast', 'complete', 'popular'],
    search_terms: ['full breakfast', 'big meal', 'morning meal', 'sarapan besar'],
  },
  'Hotcakes': {
    tags: ['breakfast', 'pancakes', 'sweet'],
    search_terms: ['pancakes', 'hot cakes', 'flapjacks', 'breakfast pancakes'],
  },
  'Hash Browns': {
    tags: ['breakfast', 'sides', 'potato', 'fried'],
    search_terms: ['hash brown', 'potato', 'breakfast sides', 'kentang goreng'],
  },

  // Desserts
  'McFlurry Oreo': {
    tags: ['dessert', 'ice cream', 'oreo', 'sweet', 'popular'],
    search_terms: ['mcflurry', 'ice cream', 'oreo', 'ais krim', 'frozen dessert'],
  },
  'McFlurry Kit Kat': {
    tags: ['dessert', 'ice cream', 'kitkat', 'chocolate', 'sweet'],
    search_terms: ['mcflurry', 'ice cream', 'kit kat', 'chocolate', 'ais krim'],
  },
  'Apple Pie': {
    tags: ['dessert', 'pie', 'fruit', 'hot'],
    search_terms: ['apple turnover', 'fruit pie', 'hot pie', 'pai epal'],
  },
  'Chocolate Sundae': {
    tags: ['dessert', 'ice cream', 'chocolate', 'sweet'],
    search_terms: ['sundae', 'ice cream', 'chocolate', 'ais krim'],
  },
  'Strawberry Sundae': {
    tags: ['dessert', 'ice cream', 'strawberry', 'fruit', 'sweet'],
    search_terms: ['sundae', 'ice cream', 'strawberry', 'ais krim'],
  },
  'Soft Serve Cone': {
    tags: ['dessert', 'ice cream', 'cone', 'simple'],
    search_terms: ['ice cream cone', 'cone', 'ais krim kon', 'vanilla cone'],
  },

  // Drinks
  'Coca-Cola': {
    tags: ['drink', 'soda', 'cola', 'cold'],
    search_terms: ['coke', 'cola', 'soft drink', 'minuman', 'cold drink'],
  },
  'Sprite': {
    tags: ['drink', 'soda', 'lemon', 'cold'],
    search_terms: ['lemon soda', 'soft drink', 'minuman', 'clear soda'],
  },
  'Fanta Orange': {
    tags: ['drink', 'soda', 'orange', 'cold'],
    search_terms: ['orange drink', 'fanta', 'soft drink', 'minuman oren'],
  },
  'Milo': {
    tags: ['drink', 'chocolate', 'malt', 'malaysian'],
    search_terms: ['iced milo', 'chocolate drink', 'minuman coklat', 'malt drink'],
  },
  'Iced Coffee': {
    tags: ['drink', 'coffee', 'cold', 'caffeine'],
    search_terms: ['coffee', 'kopi', 'kopi ais', 'cold coffee'],
  },
  'Hot Coffee': {
    tags: ['drink', 'coffee', 'hot', 'caffeine'],
    search_terms: ['coffee', 'kopi', 'kopi panas', 'hot coffee'],
  },
  'Orange Juice': {
    tags: ['drink', 'juice', 'fruit', 'cold'],
    search_terms: ['oj', 'fruit juice', 'jus oren', 'orange'],
  },
  'Mineral Water': {
    tags: ['drink', 'water', 'healthy'],
    search_terms: ['water', 'air', 'bottled water', 'plain water'],
  },

  // Sides
  'French Fries Small': {
    tags: ['sides', 'potato', 'fried', 'popular', 'small'],
    search_terms: ['fries', 'chips', 'kentang goreng', 'potato fries', 'small fries'],
  },
  'French Fries Medium': {
    tags: ['sides', 'potato', 'fried', 'popular', 'medium'],
    search_terms: ['fries', 'chips', 'kentang goreng', 'potato fries', 'medium fries'],
  },
  'French Fries Large': {
    tags: ['sides', 'potato', 'fried', 'popular', 'large'],
    search_terms: ['fries', 'chips', 'kentang goreng', 'potato fries', 'large fries'],
  },
  'Corn Cup': {
    tags: ['sides', 'corn', 'healthy', 'vegetable'],
    search_terms: ['corn', 'jagung', 'sweet corn'],
  },
  'Garden Salad': {
    tags: ['sides', 'salad', 'healthy', 'vegetarian'],
    search_terms: ['salad', 'salad sayur', 'vegetables', 'greens'],
  },

  // Drinks - Sized variants
  'Coca-Cola Small': {
    tags: ['drink', 'soda', 'cola', 'cold', 'small'],
    search_terms: ['coke', 'cola', 'soft drink', 'minuman', 'cold drink', 'small coke'],
  },
  'Coca-Cola Medium': {
    tags: ['drink', 'soda', 'cola', 'cold', 'medium'],
    search_terms: ['coke', 'cola', 'soft drink', 'minuman', 'cold drink', 'medium coke'],
  },
  'Coca-Cola Large': {
    tags: ['drink', 'soda', 'cola', 'cold', 'large'],
    search_terms: ['coke', 'cola', 'soft drink', 'minuman', 'cold drink', 'large coke'],
  },
  'Sprite Small': {
    tags: ['drink', 'soda', 'lemon', 'cold', 'small'],
    search_terms: ['sprite', 'lemon soda', 'soft drink', 'minuman', 'clear soda', 'small sprite'],
  },
  'Milo Hot': {
    tags: ['drink', 'chocolate', 'malt', 'malaysian', 'hot'],
    search_terms: ['hot milo', 'chocolate drink', 'minuman coklat', 'malt drink', 'milo panas'],
  },
  'Iced Milo': {
    tags: ['drink', 'chocolate', 'malt', 'malaysian', 'cold'],
    search_terms: ['iced milo', 'cold milo', 'milo ais', 'chocolate drink', 'minuman coklat'],
  },

  // Desserts - More variants
  'Oreo McFlurry': {
    tags: ['dessert', 'ice cream', 'oreo', 'sweet', 'popular'],
    search_terms: ['mcflurry', 'oreo', 'ice cream', 'ais krim', 'oreo mcflurry'],
  },

  // Happy Meals
  'Happy Meal 4pc Nuggets': {
    tags: ['kids', 'meal', 'nuggets', 'chicken', 'happy meal'],
    search_terms: ['happy meal', 'kids meal', 'nuggets happy meal', '4pc nuggets', 'meal kanak'],
  },
  'Happy Meal Cheeseburger': {
    tags: ['kids', 'meal', 'burger', 'cheese', 'happy meal'],
    search_terms: ['happy meal', 'kids meal', 'cheeseburger happy meal', 'burger happy meal', 'meal kanak'],
  },
};

async function populateSearchData() {
  console.log('Fetching all menu items...\n');

  const { data: menuItems, error: fetchError } = await supabase
    .from('menu_items')
    .select('id, name');

  if (fetchError) {
    console.error('Error fetching menu items:', fetchError);
    return;
  }

  console.log(`Found ${menuItems.length} menu items\n`);

  let updated = 0;
  let skipped = 0;

  for (const item of menuItems) {
    const data = searchData[item.name];

    if (!data) {
      console.log(`⚠️  Skipping "${item.name}" - no search data defined`);
      skipped++;
      continue;
    }

    console.log(`Updating "${item.name}"...`);
    console.log(`  Tags: ${data.tags.join(', ')}`);
    console.log(`  Search terms: ${data.search_terms.join(', ')}`);

    const { error: updateError } = await supabase
      .from('menu_items')
      .update({
        tags: data.tags,
        search_terms: data.search_terms,
      })
      .eq('id', item.id);

    if (updateError) {
      console.error(`  ❌ Error updating:`, updateError.message);
    } else {
      console.log(`  ✓ Updated`);
      updated++;
    }

    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`✅ Completed: ${updated} updated, ${skipped} skipped`);
  console.log('='.repeat(60));
}

populateSearchData();
