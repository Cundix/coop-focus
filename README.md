# Co-op Focus

A zero-cost, competitive productivity web application tailored for two remote academic power users. Built with Next.js 15 (App Router), Tailwind CSS (OLED Theme), and Supabase.

## Features
- **OLED Minimalist UI:** Ultra-minimalist, distraction-free monochrome OLED black design.
- **Live Match Scoreboard:** Synchronized competitive tracker (User A vs User B).
- **Timebox Scheduler:** Schedule deep work blocks (30m to 3h).
- **Goal Management:** Daily, Weekly, and Monthly (max 7) priorities.
- **Supabase Backend:** Zero-cost scalable DB, Auth, and Realtime sync.

## Setup Instructions

1. **Install Dependencies:**
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

2. **Database Setup:**
   - Create a free project on [Supabase](https://supabase.com).
   - Go to the SQL Editor in your Supabase dashboard.
   - Copy the contents of `supabase/schema.sql` and run it to set up all tables, triggers, and RLS policies.

3. **Environment Variables:**
   - Copy `.env.example` to `.env.local`
   - Fill in your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project settings.

4. **Run Locally:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment (Zero Cost)
Deploy instantly to **Vercel** or **Netlify**:
1. Push this repository to GitHub.
2. Import the project in Vercel/Netlify.
3. Add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables in the platform dashboard.
4. Deploy! It automatically handles Next.js App Router optimizations.
