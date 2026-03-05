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

// Shared customization templates
const burgerCustomizations = [
  { name: "No Pickles", priceExtra: 0 },
  { name: "No Onions", priceExtra: 0 },
  { name: "No Lettuce", priceExtra: 0 },
  { name: "No Tomato", priceExtra: 0 },
  { name: "No Ketchup", priceExtra: 0 },
  { name: "No Mustard", priceExtra: 0 },
  { name: "No Cheese", priceExtra: 0 },
  { name: "Extra Pickles", priceExtra: 0 },
  { name: "Extra Onions", priceExtra: 0 },
  { name: "Extra Lettuce", priceExtra: 0 },
  { name: "Extra Cheese", priceExtra: 0.5 },
  { name: "Extra Sauce", priceExtra: 0.5 },
  { name: "Add Bacon", priceExtra: 1.5 },
  { name: "Add Tomato", priceExtra: 0.3 },
  { name: "Add Mac Sauce", priceExtra: 0.3 },
];

const chickenCustomizations = [
  { name: "No Lettuce", priceExtra: 0 },
  { name: "No Mayo", priceExtra: 0 },
  { name: "No Tomato", priceExtra: 0 },
  { name: "Extra Lettuce", priceExtra: 0 },
  { name: "Extra Mayo", priceExtra: 0 },
  { name: "Add Cheese", priceExtra: 0.5 },
  { name: "Add Bacon", priceExtra: 1.5 },
  { name: "Add Tomato", priceExtra: 0.3 },
];

const nuggetCustomizations = [
  { name: "BBQ Sauce", priceExtra: 0 },
  { name: "Sweet & Sour Sauce", priceExtra: 0 },
  { name: "Hot Mustard", priceExtra: 0 },
  { name: "Honey Mustard", priceExtra: 0 },
  { name: "Ranch Sauce", priceExtra: 0 },
  { name: "Buffalo Sauce", priceExtra: 0 },
  { name: "Tangy BBQ Sauce", priceExtra: 0 },
  { name: "Creamy Ranch", priceExtra: 0 },
];

const drinkCustomizations = [
  { name: "No Ice", priceExtra: 0 },
  { name: "Light Ice", priceExtra: 0 },
  { name: "Extra Ice", priceExtra: 0 },
];

const coffeeCustomizations = [
  { name: "No Sugar", priceExtra: 0 },
  { name: "Extra Sugar", priceExtra: 0 },
  { name: "No Cream", priceExtra: 0 },
  { name: "Extra Cream", priceExtra: 0 },
  { name: "Add Caramel Syrup", priceExtra: 0.6 },
  { name: "Add Vanilla Syrup", priceExtra: 0.6 },
  { name: "Add Hazelnut Syrup", priceExtra: 0.6 },
  { name: "Substitute Oat Milk", priceExtra: 0.7 },
];

const mcflurryCustomizations = [
  { name: "Extra Topping", priceExtra: 0.5 },
  { name: "Add Caramel Drizzle", priceExtra: 0.3 },
  { name: "Add Chocolate Drizzle", priceExtra: 0.3 },
];

async function main() {
  // Clear existing data in correct order
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customization.deleteMany();
  await prisma.menuItemAlias.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();

  // ═══════════════ BURGERS (10 items) ═══════════════
  await seedCategory("Burgers", 1, [
    {
      name: "Big Mac",
      description: "Two 100% beef patties, special sauce, lettuce, cheese, pickles, onions on a sesame seed bun",
      price: 8.99,
      aliases: ["big mac", "bigmac", "the big mac"],
      customizations: burgerCustomizations,
    },
    {
      name: "Quarter Pounder with Cheese",
      description: "Quarter pound 100% fresh beef, two slices of cheese, onions, pickles, mustard and ketchup",
      price: 9.49,
      aliases: ["quarter pounder", "qpc", "quarter pounder with cheese", "1/4 pounder"],
      customizations: burgerCustomizations,
    },
    {
      name: "Double Quarter Pounder with Cheese",
      description: "Two quarter pound 100% fresh beef patties with cheese, onions, pickles",
      price: 11.49,
      aliases: ["double quarter pounder", "double qpc", "double quarter"],
      customizations: burgerCustomizations,
    },
    {
      name: "Double Cheeseburger",
      description: "Two 100% beef patties with two slices of cheese, pickles, onions, ketchup and mustard",
      price: 5.49,
      aliases: ["double cheeseburger", "double cheese"],
      customizations: burgerCustomizations,
    },
    {
      name: "McDouble",
      description: "Two 100% beef patties, one slice of cheese, pickles, onions, ketchup and mustard",
      price: 3.99,
      aliases: ["mcdouble", "mc double"],
      customizations: burgerCustomizations.slice(0, 10),
    },
    {
      name: "Cheeseburger",
      description: "100% beef patty with cheese, pickles, onions, ketchup and mustard",
      price: 3.49,
      aliases: ["cheeseburger", "cheese burger"],
      customizations: burgerCustomizations.slice(0, 10),
    },
    {
      name: "Hamburger",
      description: "100% beef patty with pickles, onions, ketchup and mustard on a toasted bun",
      price: 2.99,
      aliases: ["hamburger", "plain burger", "burger"],
      customizations: burgerCustomizations.slice(0, 8),
    },
    {
      name: "Big N' Tasty",
      description: "Quarter pound beef, lettuce, tomato, onion, pickle with mayo on a sesame bun",
      price: 7.49,
      aliases: ["big n tasty", "big and tasty", "bnt"],
      customizations: burgerCustomizations,
    },
    {
      name: "McChicken Deluxe Burger",
      description: "Crispy chicken with lettuce, tomato, and mayo on a premium bun",
      price: 8.49,
      aliases: ["mcchicken deluxe", "deluxe chicken burger", "chicken deluxe"],
      customizations: chickenCustomizations,
    },
    {
      name: "Bacon Smokehouse Burger",
      description: "Thick-cut applewood smoked bacon, beef, crispy onions, cheese, and smoky sauce",
      price: 10.99,
      aliases: ["bacon smokehouse", "smokehouse burger", "smokehouse"],
      customizations: burgerCustomizations,
    },
  ]);

  // ═══════════════ CHICKEN & FISH (8 items) ═══════════════
  await seedCategory("Chicken & Fish", 2, [
    {
      name: "McChicken",
      description: "Crispy chicken patty with lettuce and mayonnaise",
      price: 4.49,
      aliases: ["mcchicken", "mc chicken", "chicken burger", "chicken sandwich"],
      customizations: chickenCustomizations,
    },
    {
      name: "Spicy McChicken",
      description: "Spicy crispy chicken patty with lettuce and mayonnaise",
      price: 5.49,
      aliases: ["spicy mcchicken", "spicy chicken", "spicy mc chicken"],
      customizations: chickenCustomizations,
    },
    {
      name: "Crispy Chicken Sandwich",
      description: "Southern style crispy chicken breast with pickles on a potato roll",
      price: 7.99,
      aliases: ["crispy chicken sandwich", "crispy chicken", "chicken sandwich deluxe"],
      customizations: chickenCustomizations,
    },
    {
      name: "20pc Chicken McNuggets",
      description: "20 pieces of tender chicken McNuggets",
      price: 12.99,
      aliases: ["20 piece nuggets", "20 nuggets", "20 mcnuggets", "twenty nuggets"],
      customizations: nuggetCustomizations,
    },
    {
      name: "10pc Chicken McNuggets",
      description: "10 pieces of tender chicken McNuggets",
      price: 7.99,
      aliases: ["nuggets", "chicken nuggets", "mcnuggets", "10 piece nuggets", "10 nuggets"],
      customizations: nuggetCustomizations,
    },
    {
      name: "6pc Chicken McNuggets",
      description: "6 pieces of tender chicken McNuggets",
      price: 5.49,
      aliases: ["6 piece nuggets", "6 nuggets", "small nuggets", "6 piece"],
      customizations: nuggetCustomizations,
    },
    {
      name: "4pc Chicken McNuggets",
      description: "4 pieces of tender chicken McNuggets",
      price: 3.99,
      aliases: ["4 piece nuggets", "4 nuggets", "kids nuggets"],
      customizations: nuggetCustomizations,
    },
    {
      name: "Filet-O-Fish",
      description: "Wild-caught fish filet with tartar sauce and cheese on a steamed bun",
      price: 6.99,
      aliases: ["filet o fish", "fish burger", "fish sandwich", "fillet of fish", "fish filet"],
      customizations: [
        { name: "No Tartar Sauce", priceExtra: 0 },
        { name: "No Cheese", priceExtra: 0 },
        { name: "Extra Tartar Sauce", priceExtra: 0 },
        { name: "Add Lettuce", priceExtra: 0 },
      ],
    },
  ]);

  // ═══════════════ SIDES (8 items) ═══════════════
  await seedCategory("Sides", 3, [
    {
      name: "Large Fries",
      description: "Golden, crispy World Famous Fries",
      price: 4.99,
      aliases: ["large fries", "big fries", "fries large"],
      customizations: [{ name: "No Salt", priceExtra: 0 }, { name: "Extra Salt", priceExtra: 0 }],
    },
    {
      name: "Medium Fries",
      description: "Golden, crispy World Famous Fries",
      price: 3.99,
      aliases: ["medium fries", "fries", "regular fries"],
      customizations: [{ name: "No Salt", priceExtra: 0 }, { name: "Extra Salt", priceExtra: 0 }],
    },
    {
      name: "Small Fries",
      description: "Golden, crispy World Famous Fries",
      price: 2.99,
      aliases: ["small fries", "fries small", "kid fries"],
      customizations: [{ name: "No Salt", priceExtra: 0 }, { name: "Extra Salt", priceExtra: 0 }],
    },
    {
      name: "Apple Slices",
      description: "Fresh, crisp apple slices",
      price: 1.99,
      aliases: ["apple slices", "apples", "apple"],
    },
    {
      name: "Side Salad",
      description: "Fresh mixed greens with grape tomatoes",
      price: 3.49,
      aliases: ["side salad", "salad", "garden salad"],
      customizations: [
        { name: "Ranch Dressing", priceExtra: 0 },
        { name: "Balsamic Vinaigrette", priceExtra: 0 },
        { name: "Caesar Dressing", priceExtra: 0 },
        { name: "No Dressing", priceExtra: 0 },
      ],
    },
    {
      name: "Mozzarella Sticks (3pc)",
      description: "3 crispy golden mozzarella sticks with marinara sauce",
      price: 3.99,
      aliases: ["mozzarella sticks", "mozz sticks", "cheese sticks", "3 piece mozzarella"],
    },
    {
      name: "Mozzarella Sticks (6pc)",
      description: "6 crispy golden mozzarella sticks with marinara sauce",
      price: 6.49,
      aliases: ["6 piece mozzarella sticks", "6 mozz sticks", "large mozzarella sticks"],
    },
    {
      name: "Hash Brown",
      description: "Crispy, golden hash brown",
      price: 2.49,
      aliases: ["hash brown", "hashbrown", "hash browns"],
    },
  ]);

  // ═══════════════ DRINKS (12 items) ═══════════════
  await seedCategory("Drinks", 4, [
    {
      name: "Large Coca-Cola",
      description: "Ice-cold Coca-Cola",
      price: 3.99,
      aliases: ["large coke", "large coca cola", "big coke"],
      customizations: drinkCustomizations,
    },
    {
      name: "Medium Coca-Cola",
      description: "Ice-cold Coca-Cola",
      price: 2.99,
      aliases: ["coke", "coca cola", "medium coke"],
      customizations: drinkCustomizations,
    },
    {
      name: "Small Coca-Cola",
      description: "Ice-cold Coca-Cola",
      price: 1.99,
      aliases: ["small coke", "small coca cola"],
      customizations: drinkCustomizations,
    },
    {
      name: "Large Sprite",
      description: "Refreshing Sprite",
      price: 3.99,
      aliases: ["large sprite", "big sprite"],
      customizations: drinkCustomizations,
    },
    {
      name: "Medium Sprite",
      description: "Refreshing Sprite",
      price: 2.99,
      aliases: ["sprite", "medium sprite"],
      customizations: drinkCustomizations,
    },
    {
      name: "Small Sprite",
      description: "Refreshing Sprite",
      price: 1.99,
      aliases: ["small sprite"],
      customizations: drinkCustomizations,
    },
    {
      name: "Large Fanta Orange",
      description: "Bold citrus Fanta Orange",
      price: 3.99,
      aliases: ["large fanta", "big fanta", "large orange fanta"],
      customizations: drinkCustomizations,
    },
    {
      name: "Medium Fanta Orange",
      description: "Bold citrus Fanta Orange",
      price: 2.99,
      aliases: ["fanta", "fanta orange", "medium fanta", "orange soda"],
      customizations: drinkCustomizations,
    },
    {
      name: "Orange Juice",
      description: "Minute Maid Orange Juice",
      price: 3.49,
      aliases: ["orange juice", "oj"],
    },
    {
      name: "Milk",
      description: "1% low-fat milk",
      price: 2.49,
      aliases: ["milk", "low fat milk"],
    },
    {
      name: "Hot Coffee",
      description: "Premium roast coffee",
      price: 2.49,
      aliases: ["coffee", "hot coffee", "regular coffee", "black coffee"],
      customizations: coffeeCustomizations,
    },
    {
      name: "Iced Coffee",
      description: "Premium roast iced coffee with cream",
      price: 3.99,
      aliases: ["iced coffee", "ice coffee", "cold coffee"],
      customizations: coffeeCustomizations,
    },
  ]);

  // ═══════════════ DESSERTS (8 items) ═══════════════
  await seedCategory("Desserts", 5, [
    {
      name: "McFlurry with OREO",
      description: "Creamy vanilla soft serve with OREO cookie pieces",
      price: 5.99,
      aliases: ["mcflurry", "oreo mcflurry", "mc flurry", "mcflurry oreo"],
      customizations: mcflurryCustomizations,
    },
    {
      name: "McFlurry with M&M'S",
      description: "Creamy vanilla soft serve with M&M'S chocolate candy pieces",
      price: 5.99,
      aliases: ["m&m mcflurry", "mnm mcflurry", "mcflurry m and m"],
      customizations: mcflurryCustomizations,
    },
    {
      name: "Vanilla Cone",
      description: "Creamy vanilla soft serve in a cone",
      price: 2.49,
      aliases: ["vanilla cone", "ice cream cone", "cone", "soft serve"],
    },
    {
      name: "Hot Fudge Sundae",
      description: "Vanilla soft serve with hot fudge topping and peanuts",
      price: 3.99,
      aliases: ["sundae", "hot fudge sundae", "fudge sundae"],
      customizations: [
        { name: "No Peanuts", priceExtra: 0 },
        { name: "Extra Fudge", priceExtra: 0.3 },
        { name: "Add Whipped Cream", priceExtra: 0 },
      ],
    },
    {
      name: "Hot Caramel Sundae",
      description: "Vanilla soft serve with warm caramel topping",
      price: 3.99,
      aliases: ["caramel sundae", "hot caramel sundae"],
      customizations: [
        { name: "No Peanuts", priceExtra: 0 },
        { name: "Extra Caramel", priceExtra: 0.3 },
        { name: "Add Whipped Cream", priceExtra: 0 },
      ],
    },
    {
      name: "Apple Pie",
      description: "Crispy, flaky crust filled with hot apple filling",
      price: 2.49,
      aliases: ["apple pie", "pie", "hot apple pie"],
    },
    {
      name: "Chocolate Chip Cookie",
      description: "Warm, soft-baked chocolate chip cookie",
      price: 1.99,
      aliases: ["cookie", "chocolate chip cookie", "choc chip cookie"],
    },
    {
      name: "Chocolate Shake",
      description: "Creamy chocolate milkshake made with vanilla soft serve",
      price: 4.99,
      aliases: ["chocolate shake", "choc shake", "chocolate milkshake"],
      customizations: [
        { name: "Add Whipped Cream", priceExtra: 0 },
        { name: "Add Cherry", priceExtra: 0 },
      ],
    },
  ]);

  // ═══════════════ BREAKFAST (10 items) ═══════════════
  const breakfastCustomizations = [
    { name: "No Cheese", priceExtra: 0 },
    { name: "Extra Cheese", priceExtra: 0.5 },
    { name: "Add Bacon", priceExtra: 1.5 },
    { name: "Add Sausage", priceExtra: 1.5 },
    { name: "Sub Egg Whites", priceExtra: 0 },
  ];

  await seedCategory("Breakfast", 6, [
    {
      name: "Egg McMuffin",
      description: "Freshly cracked egg, Canadian bacon and cheese on a toasted English muffin",
      price: 5.49,
      aliases: ["egg mcmuffin", "egg muffin", "mcmuffin"],
      customizations: breakfastCustomizations,
    },
    {
      name: "Sausage McMuffin",
      description: "Hot, savory sausage on a toasted English muffin",
      price: 3.99,
      aliases: ["sausage mcmuffin", "sausage muffin"],
      customizations: breakfastCustomizations,
    },
    {
      name: "Sausage McMuffin with Egg",
      description: "Sausage, egg, and cheese on a toasted English muffin",
      price: 5.99,
      aliases: ["sausage egg mcmuffin", "sausage mcmuffin with egg", "sausage egg muffin"],
      customizations: breakfastCustomizations,
    },
    {
      name: "Bacon, Egg & Cheese Biscuit",
      description: "Thick-cut applewood smoked bacon, egg, and cheese on a warm biscuit",
      price: 5.99,
      aliases: ["bacon egg cheese biscuit", "bec biscuit", "bacon biscuit"],
      customizations: breakfastCustomizations,
    },
    {
      name: "Sausage Burrito",
      description: "Seasoned sausage, scrambled eggs, cheese, peppers in a flour tortilla",
      price: 3.49,
      aliases: ["sausage burrito", "breakfast burrito", "burrito"],
      customizations: [
        { name: "No Cheese", priceExtra: 0 },
        { name: "No Peppers", priceExtra: 0 },
        { name: "Add Salsa", priceExtra: 0 },
      ],
    },
    {
      name: "Hotcakes",
      description: "Three fluffy hotcakes with butter and syrup",
      price: 5.99,
      aliases: ["hotcakes", "pancakes", "hot cakes"],
      customizations: [
        { name: "No Butter", priceExtra: 0 },
        { name: "Extra Syrup", priceExtra: 0 },
        { name: "Add Sausage", priceExtra: 1.5 },
      ],
    },
    {
      name: "Hotcakes & Sausage",
      description: "Three fluffy hotcakes with butter, syrup, and sausage",
      price: 7.49,
      aliases: ["hotcakes and sausage", "pancakes and sausage", "big breakfast hotcakes"],
    },
    {
      name: "Sausage McGriddles",
      description: "Sausage between two griddle cakes with maple flavor",
      price: 4.49,
      aliases: ["sausage mcgriddles", "mcgriddle", "mcgriddles"],
      customizations: breakfastCustomizations,
    },
    {
      name: "Sausage, Egg & Cheese McGriddles",
      description: "Sausage, egg, and cheese between two maple-flavored griddle cakes",
      price: 6.49,
      aliases: ["sausage egg cheese mcgriddles", "egg mcgriddle", "sec mcgriddles"],
      customizations: breakfastCustomizations,
    },
    {
      name: "Fruit & Maple Oatmeal",
      description: "Whole grain oats, diced apples, cranberry raisin blend with maple cream",
      price: 3.99,
      aliases: ["oatmeal", "fruit oatmeal", "maple oatmeal", "fruit and maple oatmeal"],
      customizations: [
        { name: "No Cream", priceExtra: 0 },
        { name: "No Brown Sugar", priceExtra: 0 },
        { name: "No Fruit", priceExtra: 0 },
      ],
    },
  ]);

  // ═══════════════ HAPPY MEAL (4 items) ═══════════════
  await seedCategory("Happy Meal", 7, [
    {
      name: "Hamburger Happy Meal",
      description: "Hamburger, small fries, apple slices, and a drink",
      price: 5.99,
      aliases: ["hamburger happy meal", "happy meal", "kids meal", "kid meal"],
      customizations: [
        { name: "Sub Cheeseburger", priceExtra: 0.5 },
        { name: "Apple Juice Drink", priceExtra: 0 },
        { name: "Milk", priceExtra: 0 },
        { name: "Chocolate Milk", priceExtra: 0 },
      ],
    },
    {
      name: "4pc McNuggets Happy Meal",
      description: "4 Chicken McNuggets, small fries, apple slices, and a drink",
      price: 5.99,
      aliases: ["nugget happy meal", "mcnugget happy meal", "4 piece happy meal"],
      customizations: [
        ...nuggetCustomizations.slice(0, 4),
        { name: "Apple Juice Drink", priceExtra: 0 },
        { name: "Milk", priceExtra: 0 },
        { name: "Chocolate Milk", priceExtra: 0 },
      ],
    },
    {
      name: "6pc McNuggets Happy Meal",
      description: "6 Chicken McNuggets, small fries, apple slices, and a drink",
      price: 6.99,
      aliases: ["6 piece nugget happy meal", "big happy meal", "6 piece happy meal"],
      customizations: [
        ...nuggetCustomizations.slice(0, 4),
        { name: "Apple Juice Drink", priceExtra: 0 },
        { name: "Milk", priceExtra: 0 },
        { name: "Chocolate Milk", priceExtra: 0 },
      ],
    },
    {
      name: "Cheeseburger Happy Meal",
      description: "Cheeseburger, small fries, apple slices, and a drink",
      price: 6.49,
      aliases: ["cheeseburger happy meal", "cheese happy meal"],
      customizations: [
        { name: "No Pickles", priceExtra: 0 },
        { name: "No Onions", priceExtra: 0 },
        { name: "Apple Juice Drink", priceExtra: 0 },
        { name: "Milk", priceExtra: 0 },
        { name: "Chocolate Milk", priceExtra: 0 },
      ],
    },
  ]);

  // ═══════════════ COMBO MEALS (21 combos) ═══════════════
  await prisma.comboAlias.deleteMany();
  await prisma.comboMeal.deleteMany();

  // Look up main items for combos
  const mainItems = await prisma.menuItem.findMany({
    where: {
      name: {
        in: [
          "Big Mac", "Quarter Pounder with Cheese", "Double Quarter Pounder with Cheese",
          "McChicken", "Crispy Chicken Sandwich", "Spicy McChicken",
          "10pc Chicken McNuggets", "20pc Chicken McNuggets", "6pc Chicken McNuggets",
          "Filet-O-Fish", "Double Cheeseburger", "Cheeseburger",
          "Bacon Smokehouse Burger", "Big N' Tasty",
          "Egg McMuffin", "Sausage McMuffin with Egg", "Bacon, Egg & Cheese Biscuit",
          "Sausage McGriddles", "Hotcakes & Sausage", "Sausage, Egg & Cheese McGriddles",
          "McDouble",
        ],
      },
    },
  });

  const itemMap = new Map(mainItems.map((i) => [i.name, i.id]));

  const combos = [
    { name: "Big Mac Meal", mainName: "Big Mac", basePrice: 12.99, discount: 1.5, aliases: ["big mac meal", "big mac combo"], popular: true },
    { name: "Quarter Pounder Meal", mainName: "Quarter Pounder with Cheese", basePrice: 13.49, discount: 1.5, aliases: ["quarter pounder meal", "qpc meal", "quarter pounder combo"] },
    { name: "Double QP Meal", mainName: "Double Quarter Pounder with Cheese", basePrice: 15.49, discount: 1.5, aliases: ["double quarter pounder meal", "double qp meal", "double qp combo"] },
    { name: "McChicken Meal", mainName: "McChicken", basePrice: 8.99, discount: 1.0, aliases: ["mcchicken meal", "mcchicken combo", "chicken meal"] },
    { name: "Crispy Chicken Meal", mainName: "Crispy Chicken Sandwich", basePrice: 11.99, discount: 1.5, aliases: ["crispy chicken meal", "crispy chicken combo"] },
    { name: "Spicy McChicken Meal", mainName: "Spicy McChicken", basePrice: 9.99, discount: 1.0, aliases: ["spicy mcchicken meal", "spicy chicken meal", "spicy chicken combo"] },
    { name: "10pc McNuggets Meal", mainName: "10pc Chicken McNuggets", basePrice: 11.99, discount: 1.5, aliases: ["nugget meal", "10 piece meal", "mcnugget meal", "nuggets meal"], popular: true },
    { name: "20pc McNuggets Meal", mainName: "20pc Chicken McNuggets", basePrice: 16.99, discount: 1.5, aliases: ["20 piece meal", "large nugget meal", "20 nugget meal"] },
    { name: "6pc McNuggets Meal", mainName: "6pc Chicken McNuggets", basePrice: 9.49, discount: 1.0, aliases: ["6 piece meal", "small nugget meal", "6 nugget meal"] },
    { name: "Filet-O-Fish Meal", mainName: "Filet-O-Fish", basePrice: 10.99, discount: 1.0, aliases: ["filet o fish meal", "fish meal", "fish combo"] },
    { name: "Double Cheeseburger Meal", mainName: "Double Cheeseburger", basePrice: 9.49, discount: 1.0, aliases: ["double cheeseburger meal", "double cheese meal"] },
    { name: "Cheeseburger Meal", mainName: "Cheeseburger", basePrice: 7.49, discount: 1.0, aliases: ["cheeseburger meal", "cheese burger meal"] },
    { name: "Bacon Smokehouse Meal", mainName: "Bacon Smokehouse Burger", basePrice: 14.99, discount: 1.5, aliases: ["smokehouse meal", "bacon smokehouse combo"] },
    { name: "Big N' Tasty Meal", mainName: "Big N' Tasty", basePrice: 11.49, discount: 1.5, aliases: ["big n tasty meal", "bnt meal"] },
    { name: "McDouble Meal", mainName: "McDouble", basePrice: 7.99, discount: 1.0, aliases: ["mcdouble meal", "mc double meal"] },
    { name: "Egg McMuffin Meal", mainName: "Egg McMuffin", basePrice: 7.99, discount: 1.0, aliases: ["egg mcmuffin meal", "mcmuffin meal", "breakfast meal"] },
    { name: "Sausage McMuffin w/ Egg Meal", mainName: "Sausage McMuffin with Egg", basePrice: 8.49, discount: 1.0, aliases: ["sausage egg mcmuffin meal", "sausage mcmuffin meal"] },
    { name: "Bacon Egg Cheese Biscuit Meal", mainName: "Bacon, Egg & Cheese Biscuit", basePrice: 8.49, discount: 1.0, aliases: ["bec biscuit meal", "bacon biscuit meal"] },
    { name: "Sausage McGriddles Meal", mainName: "Sausage McGriddles", basePrice: 7.49, discount: 1.0, aliases: ["mcgriddle meal", "sausage mcgriddle meal"] },
    { name: "Hotcakes & Sausage Meal", mainName: "Hotcakes & Sausage", basePrice: 9.99, discount: 1.0, aliases: ["hotcakes meal", "pancake meal"] },
    { name: "SEC McGriddles Meal", mainName: "Sausage, Egg & Cheese McGriddles", basePrice: 8.99, discount: 1.0, aliases: ["sec mcgriddle meal", "egg mcgriddle meal"] },
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
        description: `${combo.mainName} with medium fries and medium drink`,
        basePrice: combo.basePrice,
        discount: combo.discount,
        mainItemId: mainId,
        popular: combo.popular ?? false,
        aliases: {
          create: combo.aliases.map((alias) => ({ alias })),
        },
      },
    });
  }

  // Count totals
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
