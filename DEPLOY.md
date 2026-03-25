# AI CFO — Deployment Guide
## From zero to live in ~1 hour. Follow each step exactly.

---

## STEP 1 — Set up Supabase (15 min)

1. Go to **https://supabase.com** → click "Start for Free"
2. Sign up with your email
3. Click "New project"
   - Name: `aicfo`
   - Database password: choose a strong password (save it somewhere)
   - Region: **South Asia (ap-south-1)** — closest to India
   - Click "Create new project" — wait ~2 minutes
4. Once ready, go to **SQL Editor** (left sidebar)
5. Click "New query"
6. Open the file `supabase-schema.sql` from this folder
7. Copy ALL the text and paste it into the SQL editor
8. Click **"Run"** — you should see "Success"
9. Now go to **Settings → API** (left sidebar)
10. Copy these two values — you'll need them in Step 3:
    - **Project URL** (looks like: https://abcdefgh.supabase.co)
    - **anon public** key (long string starting with "eyJ...")
11. Go to **Authentication → Providers** → find "Phone" → enable it
    - For now, select "SMS" provider as "Twilio" or just leave default
    - ⚠️ For testing without SMS: go to Authentication → Settings → enable "Enable phone signup" and for development you can use the "OTP expiry" settings

---

## STEP 2 — Set up GitHub (10 min)

1. Go to **https://github.com** → sign up (free)
2. Click "+" → "New repository"
   - Name: `aicfo`
   - Keep it Public
   - Click "Create repository"
3. You'll see a page with setup instructions — ignore them for now

---

## STEP 3 — Upload the code to GitHub (10 min)

You need to upload the `aicfo` folder to GitHub. The easiest way:

1. Download and install **GitHub Desktop**: https://desktop.github.com
2. Open GitHub Desktop → sign in with your GitHub account
3. Click "Add" → "Add Existing Repository"
4. Browse to the `aicfo` folder → click "Add Repository"
5. If it says "not a git repo", click "create a repository" instead
6. Create a file called `.env` in the aicfo folder with this content:
   ```
   VITE_SUPABASE_URL=paste_your_project_url_here
   VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
   ```
   Replace the values with what you copied in Step 1
7. In GitHub Desktop: write commit message "Initial commit" → click "Commit to main"
8. Click "Publish repository" → keep it Public → click "Publish Repository"

---

## STEP 4 — Deploy on Vercel (10 min)

1. Go to **https://vercel.com** → sign up with your GitHub account
2. Click "Add New" → "Project"
3. Find your `aicfo` repository → click "Import"
4. Under "Environment Variables", add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Click **"Deploy"**
6. Wait ~2 minutes → you'll get a URL like `aicfo.vercel.app`

**That's it! Your app is live.**

---

## STEP 5 — Test it

1. Open your Vercel URL on your phone
2. Enter your mobile number → receive OTP → verify
3. Enter business name → choose language → start

**Share the URL with pilot MSMEs** — they can log in from any phone with their own number and their data will be saved permanently.

---

## STEP 6 — Custom domain (optional, ₹800/year)

If you want `aicfo.in` instead of `aicfo.vercel.app`:
1. Buy domain at GoDaddy or Namecheap
2. In Vercel → your project → Settings → Domains → add your domain
3. Follow the DNS instructions

---

## Troubleshooting

**"OTP not receiving"**
- Supabase free tier has limited SMS. For testing, go to Supabase → Authentication → Users → you can manually confirm users.
- For production, set up Twilio (free trial gives 1000 messages).

**"Error loading data"**
- Check that your .env values are correct in Vercel environment variables
- Make sure you ran the SQL schema in Supabase

**"White screen on open"**
- Open browser console (F12) → check for errors → usually a missing env variable

---

## Monthly costs at scale

| Service | Free tier | Paid |
|---------|-----------|------|
| Supabase | 500MB DB, 50MB storage, 50k auth users | $25/month |
| Vercel | 100GB bandwidth, unlimited deployments | $20/month |
| Twilio SMS | ~1000 free credits | ~₹0.20 per OTP |

For your first 100 pilots: **₹0/month**.
