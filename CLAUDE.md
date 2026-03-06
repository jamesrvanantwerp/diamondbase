# DiamondBase — Claude Context

## What this is
Indoor baseball facility management app for DiamondBase.
Live: https://diamondbase.vercel.app

## Stack
- Next.js 16 App Router (`"use client"` components), TypeScript, Tailwind CSS v4
- Supabase for auth, database, real-time (client at `src/lib/supabase.ts`)
- Recharts for data viz, Framer Motion for animations, Lucide for icons
- Deployed on Vercel — to deploy: `vercel --prod` from project root

## Key context
- AuthContext (`src/context/AuthContext.tsx`): provides `user`, `member`, `isAdmin`, `refreshMember`
- BookingContext (`src/context/BookingContext.tsx`): provides user's upcoming bookings
- Dates stored as strings like `"Mar 6, 2026"` using `toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })`
- Admin accounts live in a separate `admins` table (no membership record)
- Mock data (HitTrax stats, league standings) lives in `src/lib/mockData.ts`

## Supabase tables
- `members` — user profiles with tier, credits_total, credits_used
- `bookings` — cage reservations (status: confirmed/cancelled)
- `admins` — admin-only accounts keyed by user_id
- `employees` + `shifts` — staff scheduling
- `expense_logs` + `revenue_logs` — manual financial entries

## Pages
- `/` — marketing homepage
- `/book` — cage booking flow (has easter eggs for specific date/cage combos)
- `/dashboard` — member dashboard with bookings, HitTrax stats (mock)
- `/leagues` — HitTrax facility stats + league standings
- `/admin` — admin dashboard (bookings by day, member list, financials overview)
- `/admin/employees` — staff schedule for week of Mar 2–8, 2026
- `/admin/finances` — revenue/expense tracking
- `/login` — sign in + 2-step signup with tier selection
