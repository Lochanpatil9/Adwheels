# AdWheels — Claude Project Context

## What is AdWheels?
AdWheels is a rickshaw advertising marketplace operating in **Indore & Bhopal, India**.
- Advertisers pay to display banner ads on rickshaws
- Drivers earn extra income by carrying those banners
- Core USP: **Ad goes live on roads within 90 minutes of payment**
- Starting price: ₹1,500/month for 1 rickshaw

---

## Tech Stack
- **Frontend:** React 18 + Vite, React Router, Lucide icons, react-hot-toast
- **Backend:** Node.js + Express running on port 3001
- **Database & Auth:** Supabase (PostgreSQL, Auth, Storage)
- **Payments:** Razorpay (test keys active, backend verified)
- **Deployed:** Vercel (frontend), backend local only for now

---

## Project Structure
```
Adwheels/
├── CLAUDE.md
├── .claude/
│   ├── settings.json
│   ├── agents/
│   │   ├── code-reviewer.md
│   │   ├── debugger.md
│   │   ├── test-writer.md
│   │   ├── refactorer.md
│   │   ├── doc-writer.md
│   │   └── security-auditor.md
│   ├── commands/
│   │   ├── review.md
│   │   ├── debug.md
│   │   ├── test.md
│   │   ├── refactor.md
│   │   ├── docs.md
│   │   └── audit.md
│   └── hooks/
│       ├── pre-commit.sh
│       └── lint-on-save.sh
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── supabase.js       ← Supabase client
│   │   │   └── api.js            ← Backend fetch calls
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   ← Auth state, signOut
│   │   │   └── ThemeContext.jsx
│   │   ├── components/
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── RickshawLoader.jsx
│   │   └── pages/
│   │       ├── LandingPage.jsx        ← Public landing page
│   │       ├── AuthPage.jsx           ← Login + Signup + Forgot Password
│   │       ├── ResetPasswordPage.jsx  ← Password reset
│   │       ├── AdvertiserDashboard.jsx
│   │       ├── DriverDashboard.jsx
│   │       └── AdminDashboard.jsx
│   ├── .env                      ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
│   └── vite.config.js
├── backend/
│   ├── lib/
│   │   └── supabase.js           ← Supabase admin client
│   ├── routes/
│   │   ├── health.js             ← GET /api/health
│   │   ├── leads.js              ← POST /api/leads/enterprise, POST /api/leads/register
│   │   ├── payments.js           ← POST /api/payments/create-order, POST /api/payments/verify
│   │   └── campaigns.js          ← GET /api/campaigns/expiry-check, POST /api/campaigns/:id/cancel
│   ├── .env                      ← SUPABASE_URL, SUPABASE_SERVICE_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
│   └── server.js
└── vercel.json                   ← Vercel routing config
```

---

## Supabase Database Schema
```sql
users            → id, full_name, phone, city, role (advertiser/driver/admin), upi_id, vehicle_number, is_verified
plans            → id, name, price, rickshaw_count, driver_payout, print_reimbursement, has_live_tracking, has_account_manager, is_urgent
campaigns        → id, advertiser_id, plan_id, banner_url, city, area, company_name, status, activated_at, created_at
driver_jobs      → id, driver_id, campaign_id, status (offered/accepted/active/completed/rejected)
daily_proofs     → id, driver_job_id, driver_id, photo_url, proof_date, status (pending/approved/rejected), reviewed_by
earnings         → id, driver_id, driver_job_id, campaign_id, company_name, amount, earning_date, type
payouts          → id, driver_id, amount, upi_id, status (requested/processing/paid/failed), requested_at, paid_at
driver_locations → id, driver_id, driver_job_id, latitude, longitude, updated_at
enterprise_leads → id, full_name, phone, email, company_name, city, message, status (new/contacted/converted/closed), created_at
notifications    → id, user_id, type, title, message, is_read, created_at
```

**RLS Notes:**
- `users` table — RLS disabled
- `driver_jobs` table — RLS disabled
- All other tables — RLS enabled with specific policies

**Key DB Function:**
```sql
auto_assign_drivers(campaign_id uuid)
-- Assigns free verified drivers in same city
-- Only picks drivers NOT in active/offered/accepted jobs
-- Updates campaign status to active if drivers assigned
```

---

## Campaign Status Flow
```
pending → paid → active → completed
                        → cancelled (only from pending)
```
- `activated_at` timestamp set when campaign becomes active
- Campaigns auto-expire after 30 days via `/api/campaigns/expiry-check`
- Expiry check runs on backend startup and every 24 hours

---

## Pricing Plans (LOCKED — never change these)
| Plan       | Rickshaws | Price/mo   | Driver Gets |
|------------|-----------|------------|-------------|
| Starter    | 1         | ₹1,500     | ₹600        |
| Basic      | 3         | ₹5,500     | ₹600 each   |
| Growth     | 7         | ₹11,000    | ₹650 each   |
| Pro        | 15        | ₹21,000    | ₹700 each   |
| Enterprise | 25+       | Custom     | ₹750+ each  |

---

## API Routes
| Method | Route                              | What it does                          |
|--------|------------------------------------|---------------------------------------|
| GET    | /api/health                        | Server health check                   |
| POST   | /api/leads/enterprise              | Save enterprise lead                  |
| POST   | /api/leads/register                | Save landing page registration        |
| POST   | /api/payments/create-order         | Create Razorpay order                 |
| POST   | /api/payments/verify               | Verify payment + activate campaign    |
| GET    | /api/campaigns/expiry-check        | Mark expired campaigns as completed   |
| POST   | /api/campaigns/:id/cancel          | Cancel pending campaign               |
| GET    | /api/campaigns/:id/stats           | Get campaign proof stats              |
| POST   | /api/notifications/send            | Send in-app notification              |

---

## Features Status
| Feature                        | Status        |
|-------------------------------|---------------|
| Auth (login/signup/reset)      | ✅ Done        |
| Campaign creation              | ✅ Done        |
| Banner upload (Supabase)       | ✅ Done        |
| Razorpay payment               | ✅ Done        |
| Auto assign drivers            | ✅ Done        |
| Driver busy/free system        | ✅ Done        |
| Daily proof upload             | ✅ Done        |
| Earnings tracking              | ✅ Done        |
| Payout management              | ✅ Done        |
| Campaign analytics             | ✅ Done        |
| Campaign expiry (30 days)      | ✅ Done        |
| Campaign cancel                | ✅ Done        |
| Admin campaign filters         | ✅ Done        |
| Enterprise leads               | ✅ Done        |
| Landing page                   | ✅ Done        |
| In-app notifications (bell)    | ⏳ In Progress |
| WhatsApp notifications         | ⏳ Pending     |
| Razorpay webhook verification  | ⏳ Pending     |
| Driver rating system           | ⏳ Pending     |
| Campaign renewal               | ⏳ Pending     |
| Admin revenue analytics        | ⏳ Pending     |
| Referral system                | ⏳ Pending     |

---

## Design System (NEVER change these)
```
Colors:
  Background:  #F5F5F5 (dashboards)  /  #080808 (landing page)
  Card:        #FFFFFF (dashboards)  /  #111111 (landing page)
  Yellow:      #FFBF00
  Orange:      #FF8C00
  Green:       #1DB954
  Red:         #E53935
  Blue:        #1565C0
  Grey:        #888888
  Purple:      #a855f7

Fonts: Bebas Neue (numbers/display), Syne (headings/buttons), DM Sans (body)

Style rule: INLINE STYLES ONLY — no Tailwind, no CSS files
```

---

## App Routing Logic (App.jsx)
```
Loading           → Spinner
PASSWORD_RECOVERY → ResetPasswordPage
Not logged in     → LandingPage (onGetStarted → AuthPage)
role = driver     → DriverDashboard
role = admin      → AdminDashboard
role = advertiser → AdvertiserDashboard
No role yet       → AuthPage (setupMode)
```

---

## Git Workflow
```bash
# Before starting any work
git pull

# After completing work
git add .
git commit -m "descriptive message"
git push
```
**Branch:** `main` is production. Create feature branches for big changes.

---

## STRICT RULES — Read before touching anything
1. **NEVER** modify `AuthContext.jsx` or `App.jsx` routing logic
2. **NEVER** change pricing plan amounts — they are locked
3. **NEVER** modify `auto_assign_drivers` SQL function without explicit instruction
4. **NEVER** put Razorpay or Supabase secrets in frontend code
5. **NEVER** use `rm -rf` or `git push --force`
6. **NEVER** read `.env` files — use environment variable names only
7. **ALWAYS** use inline styles — never add CSS files or Tailwind classes
8. **ALWAYS** preserve existing working functionality when adding new features
9. **ALWAYS** git pull before starting, git push after finishing
10. **Frontend agents** — only touch `frontend/src/`
11. **Backend agents** — only touch `backend/`
12. **Never create `.sql` files** — present SQL in clearly marked code blocks labeled "RUN IN SUPABASE SQL EDITOR"

---

## Environment Variables
**Frontend (.env):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (http://localhost:3001 in dev)

**Backend (.env):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `PORT` (3001)
- `FRONTEND_URL` (http://localhost:5173)

---

## Local Dev Commands
```bash
# Frontend
cd frontend && npm run dev     # http://localhost:5173

# Backend
cd backend && node server.js   # http://localhost:3001

# Health check
curl http://localhost:3001/api/health
```