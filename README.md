
<div align="center">

# Orison POS
### Advanced multi-store Point of Sale for Orison Retail — Samsung Experience Stores, Pune

9 stores · Smart AI features · Deep analytics · One-click Vercel deploy

</div>

---

## ✨ Features

**🛒 POS Terminal**
- Barcode / SKU search (press **F2** anywhere), category tiles with live stock badges
- Line-item discounts, order-level discount %, GST slabs (18% / 28%) computed per line
- **Split payments** — mix UPI + Card + Cash in one bill, auto change calculation
- **Hold & resume** parked sales, walk-in or loyalty customer attach (1 pt / ₹100)
- **Smart attach AI** — "frequently bought together" suggestions learned from real sales pairs
- Printable thermal-style receipts (GST invoice, editable footer)

**📊 Advanced Analytics**
- Revenue trends, category mix, payment mix, store comparison
- **AI demand forecast** — trend regression + weekday seasonality with 80% confidence band
- **Sales heatmap** (day × hour) for staff rostering
- **ABC analysis** revenue concentration, margins, AOV, GST collection
- **Auto restock planner** — velocity, days-of-cover, suggested order qty & investment value

**🤖 AI Insights Engine (runs locally — zero API cost, nothing blocks deployment)**
- Week-on-week growth signals, best/worst store detection, hero SKU tracking
- Demand anomaly detection (±2.2σ spike/dip alerts)
- Slow-mover detection with bundling / inter-store transfer advice
- Optional: set `OPENAI_API_KEY` in Vercel to upgrade the Analytics summary to GPT prose — gracefully falls back to the local engine when absent

**🏪 Multi-store & Access Control**
- All 9 Orison stores: Amanora Mall, Season Mall, Viman Nagar, Wakad, Pimple Saudagar, Ravet, Moshi, Chinchwad, Viman Nagar Service Centre
- Roles: **Admin** (all stores) · **Manager** (own store) · **Cashier** (POS + orders)
- Per-store inventory with stock-in/out audit log, low-stock alerts, CSV exports

## 🔐 Demo logins

| Profile | PIN | Access |
|---|---|---|
| Aarav Mehta | `orison123` | Admin — all 9 stores |
| Priya Nair | `orison123` | Manager — Amanora Mall |
| Rohan Kale | `orison123` | Cashier — Amanora Mall |

## 🚀 Deploy to Vercel

```bash
# 1. Push to Git
git init
git add .
git commit -m "Orison POS v1"
git branch -M main
git remote add origin https://github.com/<you>/orison-pos.git
git push -u origin main

# 2. Deploy
npx vercel --prod        # or import the repo at vercel.com/new
```

No environment variables are required. Optional: add `OPENAI_API_KEY` for GPT summaries.

## 🧱 Stack & architecture

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS, hand-rolled design system (Samsung-blue brand) |
| Charts | Recharts |
| Data | Local-first: demo engine seeds 150 days × 9 stores (~25k orders, deterministic), persisted in `localStorage`; live sales, stock, customers, users & settings persist across sessions |
| AI | Client-side statistics engine + optional OpenAI route (`/api/ai`) with graceful fallback |

## 🔧 Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

## 🗺️ Going to production

Swap the `src/lib/db.ts` localStorage layer for Supabase/Neon (Postgres) or Firebase — the `buildAll()` / action functions are the single seam to replace. Add real auth (NextAuth/Clerk) in `src/lib/auth.ts`. Barcode scanners work out of the box as HID keyboards (focus search, scan, Enter).

---
© 2026 Orison Retail Pvt. Ltd.
