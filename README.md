# AdWheels

AdWheels is a hyperlocal advertising platform that connects advertisers with auto-rickshaw drivers. Advertisers create campaigns with banner ads, drivers display them on their vehicles and earn daily payouts.

## Tech Stack

- **Frontend** — React 18 + Vite, React Router, Lucide icons, react-hot-toast
- **Backend** — Node.js + Express
- **Database & Auth** — Supabase (PostgreSQL, Auth, Storage)

## Project Structure

```
Adwheels/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── pages/     # LandingPage, AuthPage, Admin/Advertiser/DriverDashboard
│   │   ├── components/# DashboardLayout, LoadingSpinner
│   │   ├── context/   # AuthContext (centralized auth state)
│   │   ├── lib/       # supabase.js, api.js
│   │   └── index.css  # Global styles
│   ├── .env           # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│   └── vite.config.js # Dev proxy for /api → backend
│
├── backend/           # Express API server
│   ├── routes/        # leads.js, health.js
│   ├── lib/           # supabase.js (service role client)
│   ├── seed.js        # Seeds auth users + all test data
│   ├── schema.sql     # Database schema (tables, RLS, storage)
│   └── .env           # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PORT
│
├── frontend/.env.example  # Frontend env (pre-filled for demo)
└── backend/.env.example   # Backend env (pre-filled for demo)
```

## Prerequisites

- Node.js >= 18

## Quick Start

### 1. Clone and set up env files

```bash
git clone <repo-url>
cd Adwheels

# Copy the pre-filled env files (credentials included for demo)
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

> The `.env.example` files already contain working Supabase credentials for the demo project. Just copy them and you're good to go.

### 2. Create the database schema (one-time)

> Skip this step if the Supabase project already has tables set up.

1. Open the Supabase dashboard
2. Go to **SQL Editor → New query**
3. Copy the contents of `backend/schema.sql`, paste, and click **Run**

This creates all tables, RLS policies, and storage buckets.

### 3. Install dependencies and seed the database

```bash
cd backend
npm install
npm run seed
```

This automatically creates:
- 5 auth users with confirmed emails
- User profiles, plans, campaigns, driver jobs, earnings, payouts
- Enterprise leads and landing page registrations

### 4. Start the app

Open two terminals:

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm install
npm run dev
```

The app will be running at `http://localhost:5173`

## Test Accounts

After running the seed, you can log in with these credentials:

| Email | Password | Role | Dashboard |
|-------|----------|------|-----------|
| `admin@adwheels.com` | `Admin@123` | Admin | Manage campaigns, drivers, payouts |
| `advertiser@test.com` | `Test@123` | Advertiser | Create campaigns, upload banners |
| `driver@test.com` | `Test@123` | Driver | View jobs, upload proofs, request payouts |
| `advertiser2@test.com` | `Test@123` | Advertiser | Second advertiser account |
| `driver2@test.com` | `Test@123` | Driver | Second driver account |

## User Roles

### Admin
- View and approve/reject campaigns
- Manage driver jobs and assignments
- Process payout requests
- View enterprise leads and registrations

### Advertiser
- Browse advertising plans (Starter / Growth / Pro)
- Create campaigns with banner uploads
- Track campaign status and performance

### Driver
- View and accept available jobs
- Upload daily photo proofs
- Track earnings (daily, weekly, monthly)
- Request payouts to UPI

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles (linked to Supabase Auth) |
| `plans` | Advertising plans with pricing |
| `campaigns` | Advertiser campaigns |
| `driver_jobs` | Job assignments linking drivers to campaigns |
| `daily_proofs` | Driver photo proof uploads |
| `earnings` | Daily driver earnings |
| `payouts` | Payout requests and status |
| `enterprise_leads` | Enterprise contact form submissions |
| `registrations` | Landing page signups |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/leads/enterprise` | Submit enterprise lead form |
| `POST` | `/api/leads/register` | Submit landing page registration |

## Scripts

### Frontend

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
```

### Backend

```bash
npm run dev      # Start with auto-reload (port 3001)
npm start        # Start without auto-reload
npm run seed     # Seed database with test data
npm run setup-db # Attempt to create schema (requires SQL Editor fallback)
```
