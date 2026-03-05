# Supabase Setup Guide - Step by Step

This guide will walk you through setting up Supabase for the McDonald's Avatar project. **Every single click is documented.**

**Time Required:** 10-15 minutes
**Cost:** FREE (up to 500MB database, 2GB bandwidth)

---

## Part 1: Create Supabase Account (5 minutes)

### Step 1: Go to Supabase Website

1. Open your web browser
2. Go to: **https://supabase.com**
3. You should see the Supabase homepage

### Step 2: Sign Up

1. Look at the top-right corner of the page
2. Click the **"Start your project"** button (it's green)
   - OR click **"Sign In"** if you see that instead

3. You'll see sign-in options. Choose one:

   **Option A: GitHub (Recommended)**
   - Click the **"Continue with GitHub"** button
   - If you're logged into GitHub, it will ask for permission
   - Click **"Authorize supabase"** (green button)
   - Done! Skip to Part 2.

   **Option B: Email**
   - Click the **"Sign up with email"** link (at the bottom)
   - Enter your email address
   - Enter a password (at least 8 characters)
   - Click **"Sign Up"** button
   - Check your email inbox
   - Find the email from Supabase (subject: "Confirm Your Signup")
   - Click the **"Confirm your mail"** link in the email
   - You'll be redirected back to Supabase
   - Done!

### Step 3: You're In!

You should now see the Supabase Dashboard. It will say "Welcome to Supabase" or show your projects (if this isn't your first time).

---

## Part 2: Create Your Project (5 minutes)

### Step 1: Start New Project

1. You should see a page that says **"Let's get started"**
2. If you see existing projects, look for a button that says **"New Project"** (usually green, top-right area)
3. Click **"New Project"** button

### Step 2: Create Organization (First Time Only)

If this is your first project, you'll need to create an organization first:

1. A popup will appear: **"Create a new organization"**
2. In the **"Name"** field, type: `Personal` (or your name)
3. Click **"Create organization"** button (at the bottom of popup)
4. Wait 2-3 seconds...
5. Now you'll see the **"Create a new project"** form

### Step 3: Fill in Project Details

You should now see a form with several fields. Fill them in **EXACTLY** like this:

1. **Name:**
   - Click in the "Name" text box
   - Type: `Mcdo`
   - (This is case-sensitive, use capital M and lowercase cdo)

2. **Database Password:**
   - Click in the "Database Password" text box
   - Type: `mcdo`
   - (All lowercase)
   - ⚠️ **IMPORTANT:** Remember this password! Write it down.

3. **Region:**
   - Click the dropdown (it says something like "West US (North California)")
   - Choose the region **closest to your physical location**
   - For USA: Choose any US region
   - For Europe: Choose Europe regions
   - For Asia: Choose Asia Pacific regions
   - **This is important for speed!**

4. **Pricing Plan:**
   - Look at the pricing options (Free, Pro, etc.)
   - The **"Free"** plan should already be selected (it's usually highlighted)
   - If not, click the **"Free"** box
   - It says: "Perfect for hobby projects and prototypes"
   - ✅ This is sufficient for our project!

### Step 4: Create the Project

1. Review your entries:
   - Name: `Mcdo`
   - Password: `mcdo`
   - Region: (your choice)
   - Plan: Free

2. Click the big **"Create new project"** button at the bottom

3. Wait for the project to be created...
   - You'll see: "Setting up your project..."
   - This takes about **1-2 minutes**
   - Do NOT close the browser tab!
   - ☕ You can grab a coffee while waiting

4. When done, you'll see: "Your project is ready!"

---

## Part 3: Get Your Connection Details (5 minutes)

Now we need to copy 3 important pieces of information from Supabase to your project.

### Step 1: Navigate to Project Settings

1. You should now be on your project dashboard
2. Look at the **left sidebar** (vertical menu)
3. Scroll to the bottom of the sidebar
4. Click the **⚙️ Settings** icon (it looks like a gear)
5. A submenu will appear
6. Click **"API"** in the submenu

### Step 2: You Should See API Settings Page

You should now see a page titled **"API Settings"** or **"Project API keys"**

There are several sections on this page. We need information from 2 sections:

---

### Step 3: Copy Project URL

1. Find the section titled **"Project URL"** or **"Config"**
2. You'll see a box with a URL that looks like:
   ```
   https://abcdefghijklmnop.supabase.co
   ```
3. Look for a **📋 copy icon** next to the URL (usually on the right side)
4. Click the copy icon
5. ✅ The URL is now copied!

**Now paste it in your .env.local file:**

1. Switch to VS Code (or your code editor)
2. Open the file: `.env.local` (in the root of mcdonalds-avatar folder)
3. Find this line:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   ```
4. Select the part that says `https://your-project.supabase.co`
5. Press `Ctrl+V` (or `Cmd+V` on Mac) to paste
6. It should now look like:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   ```
7. **Save the file** (`Ctrl+S` or `Cmd+S`)

---

### Step 4: Copy Anon Public Key

1. Scroll down on the same Supabase page
2. Find the section titled **"Project API keys"**
3. You'll see two keys:
   - `anon` `public` (this is the one we need now)
   - `service_role` `secret` (we'll get this next)

4. Look at the **anon public** key
   - It's a LONG string that starts with `eyJ...`
   - It will be several lines long
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMDUxNjQwMCwiZXhwIjoxOTQ2MDkyNDAwfQ.ABC123...`

5. Find the **📋 copy icon** next to this key
6. Click the copy icon
7. ✅ The anon key is now copied!

**Now paste it in your .env.local file:**

1. Go back to VS Code
2. In `.env.local` file, find this line:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```
3. Select `your_anon_key_here`
4. Press `Ctrl+V` (or `Cmd+V`) to paste
5. It should now look like:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
6. **Save the file** (`Ctrl+S`)

---

### Step 5: Copy Service Role Key

1. Go back to the Supabase browser tab
2. Still on the same **"Project API keys"** section
3. Now look at the **service_role secret** key
   - This is also a LONG string starting with `eyJ...`
   - ⚠️ **IMPORTANT:** This key is SECRET! Never share it publicly!

4. You might need to click a **"Reveal"** button to see it
   - Look for an eye icon 👁️ or "Reveal" text
   - Click it to show the full key

5. Find the **📋 copy icon** next to the service_role key
6. Click the copy icon
7. ✅ The service role key is now copied!

**Now paste it in your .env.local file:**

1. Go back to VS Code
2. In `.env.local` file, find this line:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
3. Select `your_service_role_key_here`
4. Press `Ctrl+V` (or `Cmd+V`) to paste
5. It should now look like:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
6. **Save the file** (`Ctrl+S`)

---

## Part 4: Verify Your .env.local File

Your `.env.local` file should now have these 3 lines filled in (among others):

```env
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M... (very long)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M... (very long, different from anon)
```

### Double Check:
- ✅ URL starts with `https://` and ends with `.supabase.co`
- ✅ Both keys start with `eyJ`
- ✅ Anon key and Service Role key are DIFFERENT
- ✅ No extra spaces before or after the values
- ✅ No quotation marks around the values
- ✅ File is saved

---

## Part 5: Test the Connection

Now let's verify that your project can connect to Supabase!

### Step 1: Create Supabase Client

This is already done! But let me create a test to verify it works.

1. I'll create a test file for you
2. Then you'll run it to verify the connection

### Step 2: Wait for My Test Code

I'll create the test in the next step. Don't do anything yet!

---

## 🎉 Supabase Project Created!

**What You've Done:**
- ✅ Created a Supabase account
- ✅ Created a project named "Mcdo"
- ✅ Copied Project URL
- ✅ Copied Anon Public Key
- ✅ Copied Service Role Key
- ✅ Updated .env.local file

**What's Next:**
I'll now:
1. Create Supabase client utility
2. Create a test connection
3. Verify everything works
4. Then move to Phase 1.2 (creating database tables)

---

## Troubleshooting

### "Can't find the copy icon"
- Look for these symbols: 📋 or ⎘ or two overlapping squares
- Or try clicking the key value itself - sometimes clicking highlights it, then press `Ctrl+C`

### "The keys are too long, I can't see them all"
- That's normal! They're supposed to be very long (200+ characters)
- Just click the copy icon - it copies the entire key
- Don't try to manually select and copy

### "I see 'Invalid API key' error"
- Make sure you copied the ENTIRE key (no spaces cut off)
- Make sure there are no extra spaces in .env.local
- Make sure there are no quotes around the values

### "I forgot my database password"
- That's okay! You won't need it for now
- It's only needed if you want to connect using database tools like pgAdmin
- We'll use the API keys instead

### "Supabase says 'Project creation failed'"
- Try again with a different project name
- Or try refreshing the page and starting over
- Or try a different browser

---

**Ready?** Let me know when you've completed all the steps above, and I'll continue with the code!
