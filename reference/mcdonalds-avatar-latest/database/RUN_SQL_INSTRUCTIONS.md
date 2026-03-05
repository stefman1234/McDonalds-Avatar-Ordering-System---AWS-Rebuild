# How to Run SQL Scripts in Supabase - Click-by-Click Guide

**Time Required:** 5 minutes
**Difficulty:** Easy - Just copy and paste!

This guide will show you EXACTLY how to run the 4 SQL scripts to set up your McDonald's Avatar database.

---

## What You'll Be Doing

You're going to run 4 SQL scripts in this order:
1. **01-create-tables.sql** - Creates all the database tables
2. **02-seed-menu-items.sql** - Adds 50+ menu items
3. **03-seed-customizations.sql** - Adds 120+ customization options
4. **04-seed-combo-meals.sql** - Adds 20+ combo meal deals

---

## Step 1: Open Supabase SQL Editor

1. Open your web browser
2. Go to: **https://supabase.com**
3. Click **"Sign In"** (top right)
4. Log in with the same method you used before (GitHub or Email)
5. You'll see your dashboard with your projects

### Step 2: Select Your Project

1. You should see your project named **"Mcdo"**
2. Click on the **"Mcdo"** project card
3. Wait 2-3 seconds for the project to load
4. You'll see the project dashboard

### Step 3: Navigate to SQL Editor

1. Look at the **left sidebar** (vertical menu on the left)
2. Find the **"SQL Editor"** option (it has a </> icon)
3. Click **"SQL Editor"**
4. You'll see a page that says "SQL Editor" at the top
5. There's a big text area in the middle where you can type SQL

---

## Step 4: Run Script 1 - Create Tables

### Step 4a: Open the SQL File

1. On your computer, navigate to:
   ```
   Mcdonalds order avatar\mcdonalds-avatar\database\
   ```

2. Find the file: **`01-create-tables.sql`**

3. Open it with any text editor:
   - **Windows:** Right-click → "Open with" → "Notepad"
   - **Mac:** Right-click → "Open With" → "TextEdit"
   - **VS Code users:** Just open it in VS Code

### Step 4b: Copy All the SQL

1. Press **`Ctrl+A`** (Windows) or **`Cmd+A`** (Mac) to select all
2. Press **`Ctrl+C`** (Windows) or **`Cmd+C`** (Mac) to copy

### Step 4c: Paste into Supabase

1. Go back to your browser with Supabase SQL Editor open
2. Click inside the **big text area** (the SQL input box)
3. If there's any text already there, delete it:
   - Press **`Ctrl+A`** (or `Cmd+A`) to select all
   - Press **`Delete`** or **`Backspace`**

4. Paste your SQL:
   - Press **`Ctrl+V`** (Windows) or **`Cmd+V`** (Mac)

5. You should now see all the SQL code in the editor

### Step 4d: Run the SQL

1. Look at the **bottom-right corner** of the SQL editor
2. You'll see a button that says **"Run"** (or "RUN" in capital letters)
3. Click the **"Run"** button
4. Wait 5-10 seconds...
5. You'll see output at the bottom of the screen

### Step 4e: Check for Success

Look at the bottom panel. You should see:
- ✅ **"Success. No rows returned"** (this is GOOD!)
- OR you might see: **"✅ All tables created successfully!"**
- OR you might see green text with messages about tables being created

**If you see an error in RED:**
- Take a screenshot
- Send it to me
- Don't proceed to the next step

**If you see success (green or "Success"):**
- Great! Continue to Step 5

---

## Step 5: Run Script 2 - Seed Menu Items

### Step 5a: Clear the Editor

1. In the SQL Editor, click inside the text area
2. Press **`Ctrl+A`** (or `Cmd+A`) to select all
3. Press **`Delete`** to clear it

### Step 5b: Open and Copy the File

1. On your computer, open: **`02-seed-menu-items.sql`**
   - It's in the same `database` folder
2. Select all: **`Ctrl+A`** (or `Cmd+A`)
3. Copy: **`Ctrl+C`** (or `Cmd+C`)

### Step 5c: Paste and Run

1. Go back to Supabase SQL Editor
2. Paste: **`Ctrl+V`** (or `Cmd+V`)
3. Click the **"Run"** button (bottom-right)
4. Wait 10-15 seconds... (this one takes a bit longer because it's adding 50+ items)

### Step 5d: Check for Success

You should see:
- ✅ **"Success"** message
- OR **"✅ Menu items seeded successfully! Created 50+ items."**
- OR green text with counts of items created

**If error:** Screenshot and send to me
**If success:** Continue to Step 6

---

## Step 6: Run Script 3 - Seed Customizations

### Step 6a: Clear, Copy, Paste

1. In SQL Editor: **`Ctrl+A`** → **`Delete`** (clear it)
2. Open: **`03-seed-customizations.sql`**
3. Select all and copy: **`Ctrl+A`** → **`Ctrl+C`**
4. Back to Supabase: **`Ctrl+V`** (paste)

### Step 6b: Run

1. Click **"Run"** button (bottom-right)
2. Wait 10-15 seconds...

### Step 6c: Check for Success

You should see:
- ✅ **"Success"**
- OR **"✅ Customization options seeded successfully!"**
- OR **"Total customization options created: 120+"** (or similar number)

**If error:** Screenshot and send to me
**If success:** Continue to Step 7

---

## Step 7: Run Script 4 - Seed Combo Meals (FINAL!)

### Step 7a: Clear, Copy, Paste

1. In SQL Editor: **`Ctrl+A`** → **`Delete`**
2. Open: **`04-seed-combo-meals.sql`**
3. Copy: **`Ctrl+A`** → **`Ctrl+C`**
4. Paste: **`Ctrl+V`** in Supabase

### Step 7b: Run

1. Click **"Run"** button
2. Wait 10-15 seconds...

### Step 7c: Check for Success

You should see:
- ✅ **"Success"**
- OR **"✅ Combo meals seeded successfully!"**
- OR **"DATABASE SETUP COMPLETE!"** with a summary showing:
  - Menu Items: ~50 items
  - Menu Sizes: ~10 size options
  - Customizations: ~120 options
  - Combo Meals: ~20 combos

**If you see this summary - CONGRATULATIONS! You're done! 🎉**

---

## Step 8: Verify Everything Works

Let's double-check that all tables have data:

### Step 8a: Check Menu Items

1. Clear the SQL Editor: **`Ctrl+A`** → **`Delete`**
2. Type (or paste) this simple query:
   ```sql
   SELECT COUNT(*) FROM menu_items;
   ```
3. Click **"Run"**
4. You should see a number around **50-55** in the results

### Step 8b: Check Customizations

1. Clear: **`Ctrl+A`** → **`Delete`**
2. Type:
   ```sql
   SELECT COUNT(*) FROM customization_options;
   ```
3. Click **"Run"**
4. You should see a number around **120-130**

### Step 8c: Check Combo Meals

1. Clear: **`Ctrl+A`** → **`Delete`**
2. Type:
   ```sql
   SELECT COUNT(*) FROM combo_meals;
   ```
3. Click **"Run"**
4. You should see a number around **18-22**

### Step 8d: View Actual Data (Optional but Cool!)

Want to see what you just created? Try this:

1. Clear the editor
2. Type:
   ```sql
   SELECT name, category, base_price FROM menu_items LIMIT 10;
   ```
3. Click **"Run"**
4. You'll see a table with 10 menu items like Big Mac, Quarter Pounder, etc.!

---

## 🎉 ALL DONE!

**What You Just Accomplished:**
- ✅ Created 7 database tables (menu_items, menu_item_sizes, customization_options, combo_meals, orders, order_items, conversation_sessions)
- ✅ Added 50+ menu items (burgers, chicken, breakfast, drinks, desserts)
- ✅ Added 120+ customization options (add, remove, modify)
- ✅ Added 20+ combo meal deals
- ✅ Set up proper indexes and relationships
- ✅ Your database is now ready for the AI Avatar to use!

---

## Troubleshooting

### "I see an error: 'relation already exists'"
This means you already ran the script before. That's okay! The data is already there.
- **Solution:** Skip to the next script, or just continue - everything is fine.

### "I see an error: 'column does not exist'"
This means you might have skipped a script.
- **Solution:** Make sure you ran the scripts in order: 01, 02, 03, 04

### "The Run button is grayed out"
- **Solution:** Click inside the SQL text area first, then try clicking Run again

### "I can't find the SQL Editor"
- Look for the </> icon in the left sidebar
- It might be called "SQL" or "SQL Editor"
- Try scrolling down the left sidebar

### "Nothing happens when I click Run"
- Wait 30 seconds - sometimes it takes a moment
- Check your internet connection
- Try refreshing the page and pasting the SQL again

### "I see a warning about RLS (Row Level Security)"
- This is normal! You can ignore it for now
- We'll configure security settings later

---

## What's Next?

Now that your database is set up, the next step is to:
1. Set up Prisma ORM to connect to this database
2. Create TypeScript types from the database schema
3. Build the API endpoints that will read from these tables

**Let me know when you've completed all 4 SQL scripts and I'll continue with Phase 1.3!**

---

## Quick Reference - All 4 Commands in Order

If you want to just copy-paste this into a note for yourself:

```
1. Run: 01-create-tables.sql
   (Creates all database tables)

2. Run: 02-seed-menu-items.sql
   (Adds 50+ menu items)

3. Run: 03-seed-customizations.sql
   (Adds 120+ customization options)

4. Run: 04-seed-combo-meals.sql
   (Adds 20+ combo meal deals)

✅ Done!
```
