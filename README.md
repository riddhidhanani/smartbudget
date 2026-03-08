# SmartBudget Tracker

A full-stack personal finance application for individuals and freelancers to track income, expenses, and subscriptions — with AI-powered monthly financial summaries.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS v4, Recharts, React Router v6, Axios
- **Backend:** Node.js, Express.js, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT (stored in httpOnly cookies)
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Testing:** Jest + Supertest (backend), Vitest + React Testing Library (frontend)

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a connection string to a hosted instance)
- An Anthropic API key

## Setup

### 1. Clone and install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure environment variables

Copy the template and fill in your values:

```bash
cd server
cp .env .env.local   # optional, or edit .env directly
```

Edit `server/.env`:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/smartbudget"
JWT_SECRET="your-secret-key-here"
ANTHROPIC_API_KEY="sk-ant-..."
PORT=5000
```

### 3. Set up the database

Make sure PostgreSQL is running and the `smartbudget` database exists:

```bash
psql -U postgres -c "CREATE DATABASE smartbudget;"
```

Then run Prisma migrations:

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Seed demo data

```bash
cd server
npm run prisma:seed
```

This creates:
- Demo user: `demo@smartbudget.com` / `demo1234`
- 10 transactions for February 2026
- 4 subscriptions (Netflix, Spotify, Adobe CC, GitHub Pro) with realistic renewal dates

### 5. Start the application

**Backend (terminal 1):**
```bash
cd server
npm run dev
# Runs on http://localhost:5000
```

**Frontend (terminal 2):**
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) and log in with the demo account.

## Running Tests

### Backend tests (Jest + Supertest)

```bash
cd server
npm test
```

Covers:
- Auth routes: register, login, invalid credentials
- Transaction routes: CRUD with auth middleware
- Subscription routes: create, renewal alert logic
- AI summary route: mocked Claude API

### Frontend tests (Vitest + React Testing Library)

```bash
cd client
npm test
```

Covers:
- `TransactionForm`: renders, validates, submits
- `SubscriptionForm`: renders, validates, submits
- `RenewalBanner`: shows/hides based on renewal date, color coding

## Project Structure

```
smartbudget/
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── __tests__/          # Frontend tests
│       ├── components/         # Reusable components
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── RenewalBanner.jsx
│       │   ├── TransactionForm.jsx
│       │   └── SubscriptionForm.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── lib/
│       │   └── api.js          # Axios API client
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Transactions.jsx
│       │   └── Subscriptions.jsx
│       └── test/
│           └── setup.js
├── server/                     # Node.js + Express backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # Seed script
│   └── src/
│       ├── __tests__/          # Backend tests
│       ├── lib/
│       │   └── prisma.js       # Prisma client singleton
│       ├── middleware/
│       │   └── auth.js         # JWT middleware
│       ├── routes/
│       │   ├── auth.js
│       │   ├── transactions.js
│       │   ├── subscriptions.js
│       │   └── summary.js      # AI summary route
│       └── index.js            # Express app entry point
└── README.md
```

## Features

### Dashboard
- Summary cards: Total Income, Total Expenses, Subscriptions Total, Net Balance
- Pie chart: spending by category
- Bar chart: income vs expenses (last 6 months)
- Line chart: daily spending trend
- Renewal alert banner (auto-shows for subscriptions renewing within 3 days)
- AI Summary button powered by Claude

### Transactions
- Filter by month, year, and category
- Add / Edit / Delete transactions
- Subscription-generated charges are marked with a 📋 badge

### Subscriptions
- Renewal countdown badges (🔴 ≤1 day, 🟡 ≤3 days, ✅ safe)
- Monthly cost total shown in header
- Add / Edit / Delete subscriptions

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout (clears cookie) |
| GET | `/api/transactions` | Get transactions (filter: `month`, `year`, `category`) |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/subscriptions` | Get all subscriptions |
| POST | `/api/subscriptions` | Create subscription |
| PUT | `/api/subscriptions/:id` | Update subscription |
| DELETE | `/api/subscriptions/:id` | Delete subscription |
| GET | `/api/subscriptions/alerts` | Get subscriptions renewing within 3 days |
| POST | `/api/summary` | Generate AI financial summary |
