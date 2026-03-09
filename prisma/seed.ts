import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface SeedItem {
  name: string;
  description: string;
  price: number;
  aliases: string[];
  customizations?: { name: string; priceExtra: number }[];
}

async function seedCategory(
  categoryName: string,
  sortOrder: number,
  items: SeedItem[]
) {
  const category = await prisma.category.create({
    data: { name: categoryName, sortOrder },
  });

  for (const item of items) {
    await prisma.menuItem.create({
      data: {
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId: category.id,
        aliases: {
          create: item.aliases.map((alias) => ({ alias })),
        },
        customizations: {
          create: item.customizations ?? [],
        },
      },
    });
  }

  return category;
}

// ─── Customization templates ───────────────────────────────────────────────

const burgerCustomizations = [
  { name: "No Lettuce", priceExtra: 0 },
  { name: "No Onions", priceExtra: 0 },
  { name: "No Pickles", priceExtra: 0 },
  { name: "No Tomato", priceExtra: 0 },
  { name: "No Sauce", priceExtra: 0 },
  { name: "Extra Lettuce", priceExtra: 0 },
  { name: "Extra Onions", priceExtra: 0 },
  { name: "Extra Sauce", priceExtra: 0 },
  { name: "Extra Cheese", priceExtra: 1.0 },
  { name: "Add Egg", priceExtra: 1.5 },
];

const chickenBurgerCustomizations = [
  { name: "No Lettuce", priceExtra: 0 },
  { name: "No Mayo", priceExtra: 0 },
  { name: "No Tomato", priceExtra: 0 },
  { name: "No Chilli Sauce", priceExtra: 0 },
  { name: "Extra Lettuce", priceExtra: 0 },
  { name: "Extra Mayo", priceExtra: 0 },
  { name: "Extra Chilli Sauce", priceExtra: 0 },
  { name: "Add Cheese", priceExtra: 1.0 },
  { name: "Add Egg", priceExtra: 1.5 },
];

const nuggetDippingSauces = [
  { name: "BBQ Sauce", priceExtra: 0 },
  { name: "Sweet & Sour Sauce", priceExtra: 0 },
  { name: "Chilli Sauce", priceExtra: 0 },
  { name: "Curry Sauce", priceExtra: 0 },
  { name: "Garlic Chilli Sauce", priceExtra: 0 },
  { name: "Honey Mustard", priceExtra: 0 },
];

const ayamGorengCustomizations = [
  { name: "Spicy", priceExtra: 0 },
  { name: "Regular (Non-Spicy)", priceExtra: 0 },
  { name: "Extra Chilli Sauce", priceExtra: 0 },
  { name: "BBQ Sauce", priceExtra: 0 },
];

const drinkCustomizations = [
  { name: "No Ice", priceExtra: 0 },
  { name: "Less Ice", priceExtra: 0 },
  { name: "Extra Ice", priceExtra: 0 },
];

const mccafeCustomizations = [
  { name: "No Sugar", priceExtra: 0 },
  { name: "Less Sugar", priceExtra: 0 },
  { name: "Extra Sugar", priceExtra: 0 },
  { name: "No Ice", priceExtra: 0 },
  { name: "Less Ice", priceExtra: 0 },
  { name: "Add Caramel Syrup", priceExtra: 1.0 },
  { name: "Add Vanilla Syrup", priceExtra: 1.0 },
  { name: "Add Hazelnut Syrup", priceExtra: 1.0 },
  { name: "Oat Milk", priceExtra: 1.5 },
];

const mcflurryCustomizations = [
  { name: "Extra Topping", priceExtra: 1.0 },
  { name: "Add Caramel Drizzle", priceExtra: 0.5 },
  { name: "Add Chocolate Drizzle", priceExtra: 0.5 },
];

const sundaeCustomizations = [
  { name: "Strawberry Topping", priceExtra: 0 },
  { name: "Chocolate Topping", priceExtra: 0 },
  { name: "Extra Topping", priceExtra: 0.5 },
];

const friesCustomizations = [
  { name: "No Salt", priceExtra: 0 },
  { name: "Extra Salt", priceExtra: 0 },
];

// ─── Main seed ─────────────────────────────────────────────────────────────

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.comboAlias.deleteMany();
  await prisma.comboMeal.deleteMany();
  await prisma.customization.deleteMany();
  await prisma.menuItemAlias.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();

  // ══════════════════════════════════════════════════════════
  // 1. BURGERS
  // ══════════════════════════════════════════════════════════
  await seedCategory("Burgers", 1, [
    {
      name: "Big Mac",
      description: "Two beef patties with special Mac Sauce, lettuce, cheese, pickles and onions on a sesame seed bun",
      price: 13.40,
      aliases: ["big mac", "bigmac", "the big mac"],
      customizations: burgerCustomizations,
    },
    {
      name: "Mega Mac",
      description: "Four beef patties with special Mac Sauce, lettuce, cheese, pickles and onions",
      price: 15.50,
      aliases: ["mega mac", "megamac", "4 patty big mac"],
      customizations: burgerCustomizations,
    },
    {
      name: "McChicken",
      description: "Crispy chicken patty with lettuce and creamy mayo",
      price: 9.43,
      aliases: ["mcchicken", "mc chicken", "chicken burger", "ayam burger"],
      customizations: chickenBurgerCustomizations,
    },
    {
      name: "Double McChicken",
      description: "Two crispy chicken patties with lettuce and creamy mayo",
      price: 11.95,
      aliases: ["double mcchicken", "double chicken burger", "double mc chicken"],
      customizations: chickenBurgerCustomizations,
    },
    {
      name: "Spicy Chicken McDeluxe",
      description: "Juicy spicy chicken fillet with lettuce, tomato and spicy mayo on a premium bun",
      price: 13.54,
      aliases: ["spicy chicken mcdeluxe", "mcdeluxe", "spicy mcdeluxe", "spicy chicken deluxe", "chicken deluxe"],
      customizations: chickenBurgerCustomizations,
    },
    {
      name: "Double Cheeseburger",
      description: "Two beef patties with two slices of cheese, pickles, onions, ketchup and mustard",
      price: 11.93,
      aliases: ["double cheeseburger", "double cheese burger", "double cheese"],
      customizations: burgerCustomizations,
    },
    {
      name: "Filet-O-Fish",
      description: "Fish fillet with tartar sauce and cheese on a steamed bun",
      price: 8.45,
      aliases: ["filet o fish", "filet-o-fish", "fish burger", "fish sandwich", "fillet of fish"],
      customizations: [
        { name: "No Tartar Sauce", priceExtra: 0 },
        { name: "No Cheese", priceExtra: 0 },
        { name: "Extra Tartar Sauce", priceExtra: 0 },
        { name: "Add Lettuce", priceExtra: 0 },
      ],
    },
    {
      name: "Double Filet-O-Fish",
      description: "Two fish fillets with tartar sauce and cheese on a steamed bun",
      price: 12.25,
      aliases: ["double filet o fish", "double fish burger", "double filet"],
      customizations: [
        { name: "No Tartar Sauce", priceExtra: 0 },
        { name: "No Cheese", priceExtra: 0 },
        { name: "Extra Tartar Sauce", priceExtra: 0 },
      ],
    },
    {
      name: "Smoky Grilled Beef Burger",
      description: "Grilled beef patty with smoky BBQ sauce, caramelised onions, lettuce and pickles",
      price: 15.05,
      aliases: ["smoky grilled beef", "smoky beef burger", "grilled beef burger", "smoky grilled"],
      customizations: burgerCustomizations,
    },
    {
      name: "Samurai Chicken Burger",
      description: "Crispy chicken fillet with teriyaki sauce, lettuce and mayo on a sesame bun",
      price: 14.58,
      aliases: ["samurai chicken", "samurai chicken burger", "teriyaki chicken burger"],
      customizations: chickenBurgerCustomizations,
    },
    {
      name: "Samurai Beef Burger",
      description: "Beef patty with teriyaki sauce, lettuce and mayo on a sesame bun",
      price: 14.58,
      aliases: ["samurai beef", "samurai beef burger", "teriyaki beef burger"],
      customizations: burgerCustomizations,
    },
    {
      name: "Double Samurai Chicken Burger",
      description: "Two crispy chicken fillets with teriyaki sauce, lettuce and mayo",
      price: 18.35,
      aliases: ["double samurai chicken", "double samurai"],
      customizations: chickenBurgerCustomizations,
    },
    {
      name: "GCB (Grilled Chicken Burger)",
      description: "Grilled chicken fillet with smoky sauce, lettuce and onions",
      price: 12.50,
      aliases: ["gcb", "grilled chicken burger", "grilled chicken"],
      customizations: chickenBurgerCustomizations,
    },
  ]);

  // ══════════════════════════════════════════════════════════
  // 2. AYAM GORENG McD
  // ══════════════════════════════════════════════════════════
  await seedCategory("Ayam Goreng McD", 2, [
    {
      name: "Ayam Goreng McD 1pc",
      description: "McDonald's signature fried chicken — crispy on the outside, juicy on the inside. Available in Spicy or Regular.",
      price: 8.40,
      aliases: ["ayam goreng 1pc", "fried chicken 1 piece", "1 piece ayam goreng", "1pc ayam goreng", "one piece chicken", "1 piece fried chicken", "one piece ayam goreng", "1 pieces ayam goreng", "ayam goreng 1 piece", "ayam goreng one piece"],
      customizations: ayamGorengCustomizations,
    },
    {
      name: "Ayam Goreng McD 2pc",
      description: "Two pieces of McDonald's signature fried chicken. Available in Spicy or Regular.",
      price: 14.62,
      aliases: ["ayam goreng 2pc", "fried chicken 2 piece", "2 piece ayam goreng", "2pc ayam goreng", "two piece chicken", "2 pieces ayam goreng", "two pieces ayam goreng", "2 pieces of ayam goreng", "ayam goreng 2 pieces", "ayam goreng two pieces", "2 piece fried chicken"],
      customizations: ayamGorengCustomizations,
    },
    {
      name: "Ayam Goreng McD 3pc",
      description: "Three pieces of McDonald's signature fried chicken. Available in Spicy or Regular.",
      price: 18.40,
      aliases: ["ayam goreng 3pc", "fried chicken 3 piece", "3 piece ayam goreng", "3pc ayam goreng", "three piece chicken", "3 pieces ayam goreng", "three pieces ayam goreng", "3 pieces of ayam goreng", "three pieces of ayam goreng", "ayam goreng 3 pieces", "ayam goreng three pieces", "3 piece fried chicken", "three piece ayam goreng"],
      customizations: ayamGorengCustomizations,
    },
    {
      name: "Ayam Goreng McD 5pc",
      description: "Five pieces of McDonald's signature fried chicken. Available in Spicy or Regular.",
      price: 30.20,
      aliases: ["ayam goreng 5pc", "fried chicken 5 piece", "5 piece ayam goreng", "5pc ayam goreng", "five piece chicken", "5 pieces ayam goreng", "five pieces ayam goreng", "5 pieces of ayam goreng", "ayam goreng 5 pieces", "ayam goreng five pieces", "5 piece fried chicken", "five piece ayam goreng"],
      customizations: ayamGorengCustomizations,
    },
    {
      name: "Ayam Goreng McD 9pc",
      description: "Nine pieces of McDonald's signature fried chicken — great for sharing. Available in Spicy or Regular.",
      price: 51.90,
      aliases: ["ayam goreng 9pc", "fried chicken 9 piece", "9 piece ayam goreng", "9pc ayam goreng", "nine piece chicken", "family chicken", "9 pieces ayam goreng", "nine pieces ayam goreng", "9 pieces of ayam goreng", "nine pieces of ayam goreng", "ayam goreng 9 pieces", "ayam goreng nine pieces", "9 piece fried chicken", "nine piece ayam goreng", "9 pcs ayam goreng"],
      customizations: ayamGorengCustomizations,
    },
  ]);

  // ══════════════════════════════════════════════════════════
  // 3. McNUGGETS
  // ══════════════════════════════════════════════════════════
  await seedCategory("McNuggets", 3, [
    {
      name: "Chicken McNuggets 6pc",
      description: "6 pieces of tender, golden chicken McNuggets made with 100% chicken breast meat",
      price: 9.40,
      aliases: ["6 nuggets", "6pc nuggets", "6 piece nuggets", "nuggets 6", "mcnuggets 6", "six nuggets", "small nuggets"],
      customizations: nuggetDippingSauces,
    },
    {
      name: "Chicken McNuggets 9pc",
      description: "9 pieces of tender, golden chicken McNuggets made with 100% chicken breast meat",
      price: 12.25,
      aliases: ["9 nuggets", "9pc nuggets", "9 piece nuggets", "nuggets 9", "mcnuggets 9", "nine nuggets"],
      customizations: nuggetDippingSauces,
    },
    {
      name: "Chicken McNuggets 20pc",
      description: "20 pieces of tender, golden chicken McNuggets — perfect for sharing",
      price: 26.00,
      aliases: ["20 nuggets", "20pc nuggets", "20 piece nuggets", "nuggets 20", "mcnuggets 20", "twenty nuggets", "sharing nuggets", "large nuggets"],
      customizations: nuggetDippingSauces,
    },
  ]);

  // ══════════════════════════════════════════════════════════
  // 4. NASI & BUBUR (Malaysian Specialties)
  // ══════════════════════════════════════════════════════════
  await seedCategory("Nasi & Bubur", 4, [
    {
      name: "Nasi Lemak McD",
      description: "Fragrant coconut rice served with crispy chicken, sambal, fried egg, cucumber and anchovies — a Malaysian classic",
      price: 8.02,
      aliases: ["nasi lemak", "nasi lemak mcd", "mcdonalds nasi lemak", "coconut rice"],
      customizations: [
        { name: "Extra Sambal", priceExtra: 0 },
        { name: "No Anchovies", priceExtra: 0 },
        { name: "No Egg", priceExtra: 0 },
      ],
    },
    {
      name: "Bubur Ayam McD",
      description: "Warm, comforting chicken porridge topped with shredded chicken, spring onions, ginger strips and crispy shallots",
      price: 7.26,
      aliases: ["bubur ayam", "bubur", "chicken porridge", "congee", "bubur mcd"],
      customizations: [
        { name: "Extra Ginger", priceExtra: 0 },
        { name: "Extra Shallots", priceExtra: 0 },
        { name: "No Spring Onion", priceExtra: 0 },
        { name: "Extra Chilli", priceExtra: 0 },
      ],
    },
    {
      name: "Nasi Mekdi Ayam Goreng",
      description: "Steamed rice served with Ayam Goreng McD, salted egg and sambal",
      price: 14.50,
      aliases: ["nasi mekdi", "nasi mekdi ayam", "rice with fried chicken", "mcd rice set"],
      customizations: [
        { name: "Extra Sambal", priceExtra: 0 },
        { name: "Spicy Chicken", priceExtra: 0 },
        { name: "Regular Chicken", priceExtra: 0 },
      ],
    },
    {
      name: "Nasi Mekdi GCB",
      description: "Steamed rice served with Grilled Chicken, salted egg and sambal",
      price: 15.00,
      aliases: ["nasi mekdi gcb", "nasi mekdi grilled chicken", "rice with grilled chicken"],
      customizations: [
        { name: "Extra Sambal", priceExtra: 0 },
        { name: "No Salted Egg", priceExtra: 0 },
      ],
    },
  ]);

  // ══════════════════════════════════════════════════════════
  // 5. SIDES
  // ══════════════════════════════════════════════════════════
  await seedCategory("Sides", 5, [
    {
      name: "French Fries Small",
      description: "Golden, crispy World Famous Fries lightly salted",
      price: 4.30,
      aliases: ["small fries", "fries small", "kecil fries"],
      customizations: friesCustomizations,
    },
    {
      name: "French Fries Medium",
      description: "Golden, crispy World Famous Fries lightly salted",
      price: 4.80,
      aliases: ["medium fries", "fries", "regular fries", "kentang goreng", "fries medium"],
      customizations: friesCustomizations,
    },
    {
      name: "French Fries Large",
      description: "Golden, crispy World Famous Fries lightly salted",
      price: 5.60,
      aliases: ["large fries", "big fries", "fries large", "upsize fries"],
      customizations: friesCustomizations,
    },
    {
      name: "Corn Cup Medium",
      description: "Sweet, buttery corn in a cup",
      price: 4.25,
      aliases: ["corn", "corn cup", "medium corn", "jagung"],
      customizations: [
        { name: "Extra Butter", priceExtra: 0 },
        { name: "No Butter", priceExtra: 0 },
      ],
    },
    {
      name: "Corn Cup Large",
      description: "Sweet, buttery corn in a large cup",
      price: 5.20,
      aliases: ["large corn", "corn cup large", "big corn"],
      customizations: [
        { name: "Extra Butter", priceExtra: 0 },
        { name: "No Butter", priceExtra: 0 },
      ],
    },
    {
      name: "Salted Egg Yolk Loaded Fries",
      description: "Crispy World Famous Fries loaded with a rich, savoury salted egg yolk sauce",
      price: 6.70,
      aliases: ["salted egg fries", "loaded fries", "salted egg loaded fries", "telur masin fries"],
    },
    {
      name: "Apple Pie",
      description: "Crispy, flaky pastry filled with warm cinnamon apple filling",
      price: 4.95,
      aliases: ["apple pie", "pie", "hot apple pie"],
    },
  ]);

  // ══════════════════════════════════════════════════════════
  // 6. DRINKS
  // ══════════════════════════════════════════════════════════
  await seedCategory("Drinks", 6, [
    {
      name: "Coca-Cola Small",
      description: "Ice-cold classic Coca-Cola",
      price: 4.00,
      aliases: ["small coke", "small coca cola", "coke small"],
      customizations: drinkCustomizations,
    },
    {
      name: "Coca-Cola Medium",
      description: "Ice-cold classic Coca-Cola",
      price: 4.50,
      aliases: ["coke", "coca cola", "medium coke", "coke medium"],
      customizations: drinkCustomizations,
    },
    {
      name: "Coca-Cola Large",
      description: "Ice-cold classic Coca-Cola",
      price: 5.00,
      aliases: ["large coke", "large coca cola", "coke large", "big coke"],
      customizations: drinkCustomizations,
    },
    {
      name: "Sprite Small",
      description: "Refreshing lemon-lime Sprite",
      price: 4.00,
      aliases: ["small sprite", "sprite small"],
      customizations: drinkCustomizations,
    },
    {
      name: "Sprite Medium",
      description: "Refreshing lemon-lime Sprite",
      price: 4.50,
      aliases: ["sprite", "medium sprite"],
      customizations: drinkCustomizations,
    },
    {
      name: "Sprite Large",
      description: "Refreshing lemon-lime Sprite",
      price: 5.00,
      aliases: ["large sprite", "sprite large", "big sprite"],
      customizations: drinkCustomizations,
    },
    {
      name: "Fanta Orange Small",
      description: "Bold, fruity Fanta Orange",
      price: 4.00,
      aliases: ["small fanta", "fanta small"],
      customizations: drinkCustomizations,
    },
    {
      name: "Fanta Orange Medium",
      description: "Bold, fruity Fanta Orange",
      price: 4.50,
      aliases: ["fanta", "fanta orange", "medium fanta"],
      customizations: drinkCustomizations,
    },
    {
      name: "Fanta Orange Large",
      description: "Bold, fruity Fanta Orange",
      price: 5.00,
      aliases: ["large fanta", "fanta large", "big fanta"],
      customizations: drinkCustomizations,
    },
    {
      name: "Milo Small",
      description: "Cold, chocolatey Milo — Malaysia's favourite",
      price: 4.50,
      aliases: ["small milo", "milo small", "iced milo small"],
      customizations: drinkCustomizations,
    },
    {
      name: "Milo Medium",
      description: "Cold, chocolatey Milo — Malaysia's favourite",
      price: 5.00,
      aliases: ["milo", "medium milo", "iced milo"],
      customizations: drinkCustomizations,
    },
    {
      name: "Milo Large",
      description: "Cold, chocolatey Milo — Malaysia's favourite",
      price: 5.50,
      aliases: ["large milo", "milo large", "big milo"],
      customizations: drinkCustomizations,
    },
    {
      name: "Orange Juice",
      description: "Fresh, chilled orange juice",
      price: 5.50,
      aliases: ["orange juice", "oj", "jus oren"],
    },
    {
      name: "Mineral Water",
      description: "Still mineral water",
      price: 3.00,
      aliases: ["water", "mineral water", "air mineral", "plain water"],
    },
    {
      name: "Chocolate Milkshake",
      description: "Thick, creamy chocolate milkshake",
      price: 9.00,
      aliases: ["chocolate milkshake", "choc milkshake", "chocolate shake"],
    },
    {
      name: "Strawberry Milkshake",
      description: "Thick, creamy strawberry milkshake",
      price: 9.00,
      aliases: ["strawberry milkshake", "strawberry shake"],
    },
    {
      name: "Vanilla Milkshake",
      description: "Thick, creamy vanilla milkshake",
      price: 9.00,
      aliases: ["vanilla milkshake", "vanilla shake", "milkshake"],
    },
  ]);

  // ══════════════════════════════════════════════════════════
  // 7. McCAFÉ
  // ══════════════════════════════════════════════════════════
  await seedCategory("McCafé", 7, [
    {
      name: "Kopi Susu",
      description: "Rich espresso with steamed condensed milk — a Malaysian coffee classic",
      price: 7.45,
      aliases: ["kopi susu", "kopi o", "white coffee", "mcd coffee"],
      customizations: mccafeCustomizations,
    },
    {
      name: "Americano",
      description: "Bold, smooth espresso with hot water",
      price: 7.00,
      aliases: ["americano", "black coffee", "hot americano"],
      customizations: mccafeCustomizations,
    },
    {
      name: "Cappuccino",
      description: "Espresso with steamed milk and a thick layer of frothy foam",
      price: 8.00,
      aliases: ["cappuccino", "cap", "hot cappuccino"],
      customizations: mccafeCustomizations,
    },
    {
      name: "Iced Latte",
      description: "Espresso with chilled milk over ice",
      price: 8.40,
      aliases: ["iced latte", "ice latte", "cold latte", "latte"],
      customizations: mccafeCustomizations,
    },
    {
      name: "Iced Americano",
      description: "Bold espresso with chilled water over ice",
      price: 7.50,
      aliases: ["iced americano", "ice americano", "cold americano", "cold black coffee"],
      customizations: mccafeCustomizations,
    },
    {
      name: "Milo Dinosaur",
      description: "Iced Milo topped with an extra scoop of Milo powder",
      price: 8.00,
      aliases: ["milo dinosaur", "milo dino", "milo ais dino"],
      customizations: [
        { name: "Extra Milo Powder", priceExtra: 0.5 },
        { name: "Less Ice", priceExtra: 0 },
        { name: "No Ice", priceExtra: 0 },
      ],
    },
    {
      name: "Ice Blended Caramel",
      description: "Blended ice drink with caramel and whipped cream",
      price: 13.68,
      aliases: ["ice blended caramel", "caramel frappe", "caramel ice blended"],
    },
    {
      name: "Ice Blended Mocha",
      description: "Blended ice drink with rich mocha and whipped cream",
      price: 13.68,
      aliases: ["ice blended mocha", "mocha frappe", "mocha ice blended"],
    },
    {
      name: "Hot Chocolate",
      description: "Rich, creamy hot chocolate",
      price: 8.00,
      aliases: ["hot chocolate", "hot choc", "milo panas"],
      customizations: [
        { name: "No Sugar", priceExtra: 0 },
        { name: "Extra Sugar", priceExtra: 0 },
        { name: "Oat Milk", priceExtra: 1.5 },
      ],
    },
  ]);

  // ══════════════════════════════════════════════════════════
  // 8. DESSERTS
  // ══════════════════════════════════════════════════════════
  await seedCategory("Desserts", 8, [
    {
      name: "OREO McFlurry",
      description: "Creamy vanilla soft serve swirled with OREO cookie crumbs",
      price: 7.78,
      aliases: ["mcflurry", "oreo mcflurry", "mc flurry", "mcflurry oreo", "ais krim mcflurry"],
      customizations: mcflurryCustomizations,
    },
    {
      name: "Chocolate McFlurry",
      description: "Creamy vanilla soft serve swirled with chocolate topping",
      price: 7.78,
      aliases: ["chocolate mcflurry", "choc mcflurry"],
      customizations: mcflurryCustomizations,
    },
    {
      name: "Vanilla Soft Serve",
      description: "Classic smooth and creamy vanilla soft serve ice cream",
      price: 3.00,
      aliases: ["soft serve", "vanilla soft serve", "ice cream", "ais krim", "cone", "vanilla cone"],
    },
    {
      name: "Strawberry Sundae",
      description: "Creamy vanilla soft serve with sweet strawberry topping",
      price: 3.50,
      aliases: ["strawberry sundae", "strawberry ice cream", "sundae strawberry"],
      customizations: sundaeCustomizations,
    },
    {
      name: "Chocolate Sundae",
      description: "Creamy vanilla soft serve with rich chocolate topping",
      price: 3.50,
      aliases: ["chocolate sundae", "choc sundae", "sundae chocolate"],
      customizations: sundaeCustomizations,
    },
  ]);

  // ══════════════════════════════════════════════════════════
  // 9. HAPPY MEAL
  // ══════════════════════════════════════════════════════════
  await seedCategory("Happy Meal", 9, [
    {
      name: "Happy Meal McChicken",
      description: "McChicken burger with small fries or corn, small drink and a toy",
      price: 11.13,
      aliases: ["happy meal chicken", "mcchicken happy meal", "kids meal chicken", "happy meal"],
      customizations: [
        { name: "Small Fries", priceExtra: 0 },
        { name: "Corn Cup", priceExtra: 0 },
        { name: "Coca-Cola", priceExtra: 0 },
        { name: "Milo", priceExtra: 0 },
        { name: "Orange Juice", priceExtra: 0 },
        { name: "Mineral Water", priceExtra: 0 },
      ],
    },
    {
      name: "Happy Meal McNuggets 4pc",
      description: "4 Chicken McNuggets with small fries or corn, small drink and a toy",
      price: 11.13,
      aliases: ["nuggets happy meal", "4pc nuggets happy meal", "kids meal nuggets", "happy meal nuggets", "happy meal mcnuggets", "mcnuggets happy meal", "happy meal with nuggets", "4 nugget happy meal", "nugget kids meal"],
      customizations: [
        ...nuggetDippingSauces,
        { name: "Small Fries", priceExtra: 0 },
        { name: "Corn Cup", priceExtra: 0 },
        { name: "Coca-Cola", priceExtra: 0 },
        { name: "Milo", priceExtra: 0 },
        { name: "Orange Juice", priceExtra: 0 },
        { name: "Mineral Water", priceExtra: 0 },
      ],
    },
    {
      name: "Happy Meal Ayam Goreng McD",
      description: "1pc Ayam Goreng McD with small fries or corn, small drink and a toy",
      price: 11.51,
      aliases: ["ayam goreng happy meal", "fried chicken happy meal", "kids meal ayam goreng", "happy meal ayam goreng", "happy meal fried chicken", "ayam goreng kids meal"],
      customizations: [
        { name: "Spicy", priceExtra: 0 },
        { name: "Regular (Non-Spicy)", priceExtra: 0 },
        { name: "Small Fries", priceExtra: 0 },
        { name: "Corn Cup", priceExtra: 0 },
        { name: "Coca-Cola", priceExtra: 0 },
        { name: "Milo", priceExtra: 0 },
        { name: "Orange Juice", priceExtra: 0 },
        { name: "Mineral Water", priceExtra: 0 },
      ],
    },
  ]);

  // ══════════════════════════════════════════════════════════
  // COMBO MEALS
  // ══════════════════════════════════════════════════════════

  // Look up IDs for combo main items, default side, and default drink
  const allItems = await prisma.menuItem.findMany({
    select: { id: true, name: true },
  });
  const itemMap = new Map(allItems.map((i) => [i.name, i.id]));

  const defaultSideId = itemMap.get("French Fries Medium") ?? null;
  const defaultDrinkId = itemMap.get("Coca-Cola Medium") ?? null;

  const combos = [
    // Burger combos
    { name: "Big Mac Meal", mainName: "Big Mac", basePrice: 18.90, discount: 1.50, popular: true, aliases: ["big mac meal", "big mac combo", "bigmac meal"] },
    { name: "Mega Mac Meal", mainName: "Mega Mac", basePrice: 21.00, discount: 1.50, popular: false, aliases: ["mega mac meal", "mega mac combo"] },
    { name: "McChicken Meal", mainName: "McChicken", basePrice: 14.90, discount: 1.00, popular: true, aliases: ["mcchicken meal", "chicken burger meal", "mc chicken meal"] },
    { name: "Double McChicken Meal", mainName: "Double McChicken", basePrice: 17.50, discount: 1.00, popular: false, aliases: ["double mcchicken meal", "double chicken meal"] },
    { name: "Spicy Chicken McDeluxe Meal", mainName: "Spicy Chicken McDeluxe", basePrice: 19.00, discount: 1.50, popular: true, aliases: ["mcdeluxe meal", "spicy mcdeluxe meal", "spicy chicken mcdeluxe meal", "chicken deluxe meal"] },
    { name: "Filet-O-Fish Meal", mainName: "Filet-O-Fish", basePrice: 14.00, discount: 1.00, popular: false, aliases: ["filet o fish meal", "fish burger meal", "fish meal"] },
    { name: "Double Filet-O-Fish Meal", mainName: "Double Filet-O-Fish", basePrice: 17.50, discount: 1.00, popular: false, aliases: ["double filet o fish meal", "double fish meal"] },
    { name: "Double Cheeseburger Meal", mainName: "Double Cheeseburger", basePrice: 17.00, discount: 1.00, popular: false, aliases: ["double cheeseburger meal", "double cheese meal"] },
    { name: "Smoky Grilled Beef Meal", mainName: "Smoky Grilled Beef Burger", basePrice: 20.50, discount: 1.50, popular: false, aliases: ["smoky grilled beef meal", "grilled beef meal", "smoky beef meal"] },
    { name: "Samurai Chicken Meal", mainName: "Samurai Chicken Burger", basePrice: 20.00, discount: 1.50, popular: false, aliases: ["samurai chicken meal", "samurai meal", "teriyaki chicken meal"] },
    { name: "Samurai Beef Meal", mainName: "Samurai Beef Burger", basePrice: 20.00, discount: 1.50, popular: false, aliases: ["samurai beef meal", "teriyaki beef meal"] },
    { name: "GCB Meal", mainName: "GCB (Grilled Chicken Burger)", basePrice: 18.00, discount: 1.50, popular: false, aliases: ["gcb meal", "grilled chicken burger meal", "grilled chicken meal"] },
    // Ayam Goreng combos
    { name: "Ayam Goreng McD 1pc Meal", mainName: "Ayam Goreng McD 1pc", basePrice: 13.90, discount: 1.00, popular: false, aliases: ["ayam goreng 1pc meal", "1pc ayam goreng meal", "fried chicken 1pc meal"] },
    { name: "Ayam Goreng McD 2pc Meal", mainName: "Ayam Goreng McD 2pc", basePrice: 20.00, discount: 1.50, popular: true, aliases: ["ayam goreng 2pc meal", "2pc ayam goreng meal", "fried chicken meal", "ayam goreng meal"] },
    // McNuggets combos
    { name: "McNuggets 6pc Meal", mainName: "Chicken McNuggets 6pc", basePrice: 15.00, discount: 1.00, popular: true, aliases: ["nuggets meal", "6pc nuggets meal", "6 piece nuggets meal", "mcnuggets meal"] },
    { name: "McNuggets 9pc Meal", mainName: "Chicken McNuggets 9pc", basePrice: 18.00, discount: 1.50, popular: false, aliases: ["9pc nuggets meal", "9 piece nuggets meal"] },
  ];

  for (const combo of combos) {
    const mainId = itemMap.get(combo.mainName);
    if (!mainId) {
      console.warn(`Skipping combo "${combo.name}" — main item "${combo.mainName}" not found`);
      continue;
    }
    await prisma.comboMeal.create({
      data: {
        name: combo.name,
        description: `${combo.mainName} with Medium Fries and a drink`,
        basePrice: combo.basePrice,
        discount: combo.discount,
        mainItemId: mainId,
        defaultSideId,
        defaultDrinkId,
        popular: combo.popular ?? false,
        aliases: {
          create: combo.aliases.map((alias) => ({ alias })),
        },
      },
    });
  }

  // Summary
  const itemCount = await prisma.menuItem.count();
  const customizationCount = await prisma.customization.count();
  const aliasCount = await prisma.menuItemAlias.count();
  const comboCount = await prisma.comboMeal.count();
  const comboAliasCount = await prisma.comboAlias.count();

  console.log(`Seed complete!`);
  console.log(`  ${itemCount} menu items`);
  console.log(`  ${customizationCount} customizations`);
  console.log(`  ${aliasCount} aliases`);
  console.log(`  ${comboCount} combo meals`);
  console.log(`  ${comboAliasCount} combo aliases`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
