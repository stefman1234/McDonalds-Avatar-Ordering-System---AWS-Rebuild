# GitHub Setup Guide

This guide will help you push your McDonald's Avatar project to GitHub.

---

## Option 1: Quick Setup (Recommended)

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in top-right → **"New repository"**
3. Fill in details:
   - **Repository name:** `mcdonalds-avatar-ordering`
   - **Description:** "AI-powered McDonald's ordering kiosk with conversational avatar"
   - **Visibility:** Private (or Public if you want to share)
   - **DO NOT** initialize with README (we already have one)
4. Click **"Create repository"**

### Step 2: Connect Local Repository to GitHub

GitHub will show you commands. Use these instead (from project folder):

```bash
# Navigate to project folder
cd mcdonalds-avatar

# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/mcdonalds-avatar-ordering.git

# Verify remote added
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

### Step 3: Verify

1. Refresh your GitHub repository page
2. You should see all files uploaded
3. Check commits - you should see 3 commits (Phase 0.1, 0.2, 0.3)

---

## Option 2: Using GitHub CLI (gh)

If you have GitHub CLI installed:

```bash
cd mcdonalds-avatar

# Login to GitHub
gh auth login

# Create repo and push
gh repo create mcdonalds-avatar-ordering --private --source=. --push

# Or for public repo
gh repo create mcdonalds-avatar-ordering --public --source=. --push
```

---

## Important: Protect Your Secrets

### ⚠️ NEVER commit `.env.local` to GitHub!

Your `.gitignore` already prevents this, but double-check:

```bash
# Verify .env.local is ignored
git status

# Should NOT show .env.local
```

If `.env.local` appears, run:
```bash
git rm --cached .env.local
echo ".env.local" >> .gitignore
git add .gitignore
git commit -m "Ensure .env.local is ignored"
```

### What's Safe in Git
✅ `.env.example` - Template with no real credentials
✅ All code files
✅ Documentation
✅ README.md

### What's NEVER in Git
❌ `.env.local` - Contains real API keys
❌ `node_modules/` - Too large, installed via `npm install`
❌ `.next/` - Build artifacts

---

## Branch Protection (Optional but Recommended)

After pushing to GitHub:

1. Go to your repo → **Settings** → **Branches**
2. Click **"Add rule"**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass (if you set up CI/CD later)
5. Click **"Create"**

This prevents accidental direct commits to `main`.

---

## Recommended GitHub Workflow

### Daily Development

```bash
# Pull latest changes (if working with team)
git pull origin main

# Create feature branch for new phase
git checkout -b feature/phase-1-1-supabase

# Make changes, then commit
git add .
git commit -m "Phase 1.1: Supabase project setup complete"

# Push feature branch
git push -u origin feature/phase-1-1-supabase

# Create Pull Request on GitHub
# After review, merge to main
```

### Solo Development (Simpler)

```bash
# Work directly on main
# After completing each phase:
git add .
git commit -m "Phase 1.1: Supabase project setup complete"
git push origin main
```

---

## Viewing Your Project on GitHub

After pushing, you can:

1. **View code:** Browse files in your repository
2. **Check commits:** See all commits with messages
3. **Clone elsewhere:** Clone to another computer
4. **Share:** Share link with collaborators
5. **Deploy:** Connect to Vercel for automatic deployments

---

## Connecting Vercel to GitHub (For Deployment)

1. Go to [Vercel](https://vercel.com)
2. Sign in with GitHub
3. Click **"New Project"**
4. Import `mcdonalds-avatar-ordering` repository
5. Configure:
   - Framework: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Install Command: `npm install`
6. Add Environment Variables:
   - `GOOGLE_API_KEY`
   - `NEXT_PUBLIC_KLLEON_SDK_KEY`
   - `NEXT_PUBLIC_KLLEON_AVATAR_ID`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - etc.
7. Click **"Deploy"**

Every push to `main` will auto-deploy! 🚀

---

## Useful Git Commands

```bash
# Check status
git status

# View commit history
git log --oneline

# View changes
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# Delete branch
git branch -d feature/old-feature

# View all branches
git branch -a

# Pull latest from GitHub
git pull origin main

# Push to GitHub
git push origin main

# View remote URLs
git remote -v
```

---

## Troubleshooting

### "Permission denied (publickey)"

Set up SSH keys or use HTTPS with Personal Access Token:

```bash
# Use HTTPS with token
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/mcdonalds-avatar-ordering.git
```

### "Updates were rejected"

Someone else pushed changes. Pull first:

```bash
git pull origin main --rebase
git push origin main
```

### "Large file detected"

GitHub has a 100MB file limit. Check what's large:

```bash
git ls-files --others --ignored --exclude-standard
```

---

## Current Repository Status

After Phase 0 complete, your repo should have:

```
📁 mcdonalds-avatar/
├── 📄 README.md
├── 📄 IMPLEMENTATION_PLAN.md (this plan!)
├── 📄 GITHUB_SETUP.md (this guide)
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 tailwind.config.ts
├── 📄 next.config.js
├── 📁 app/
├── 📁 components/
├── 📁 lib/
├── 📁 types/
├── 📁 public/
└── 📁 Documentation/ (from parent folder)
```

**Total Commits:** 4
1. ✅ Phase 0.1: Initial project setup
2. ✅ Phase 0.2: TypeScript configuration
3. ✅ Phase 0.3: Tailwind & UI setup
4. ✅ Documentation: Implementation plan added

---

## Next Steps

1. ✅ Create GitHub repository
2. ✅ Push code to GitHub
3. ⏳ Continue with Phase 1.1 (Supabase setup)
4. ⏳ Keep committing after each phase
5. ⏳ Deploy to Vercel (after Phase 4 or 5)

---

**Last Updated:** 2025-11-11
**Status:** Ready to push to GitHub
