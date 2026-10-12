# CeylonBite — Fast-Food Ordering & Management Application

![CeylonBite Banner](https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200)

**CeylonBite** is a full-stack Sri Lankan fast-food ordering application built with **React Native + Expo (TypeScript)** on the frontend, a **Node.js + Express.js** REST API backend, and **Microsoft SQL Server (MS SQL)** for database management.

---

## 🌟 Features Overview

### 🍔 Customer Features
- **Authentic Food Catalog**: Browse categories (Burgers, Rice, Pizza, Chicken, Drinks, Desserts) fetched live from SQL Server.
- **Customizations & Cart**: Select spice levels and extra toppings; client cart managed locally with Zustand.
- **Secure Server-Validated Checkout**: Places orders through a multi-table SQL Server transaction.
- **Order Tracking**: Live order tracking (Pending → Confirmed → Preparing → Ready → Delivered).
- **Favorites & Profile**: Save favorite dishes and manage customer credentials.

### 👑 Admin Features
- **Dashboard & Analytics**: Track today's orders, total revenue, popular items, and weekly sales metrics.
- **Menu Management (CRUD)**: Add new food dishes, edit prices, and toggle item availability live.
- **Order Management**: Review incoming orders and update tracking statuses in real-time.
- **Customer Directory**: View customer order counts and spending histories safely (without exposed password hashes).

---

## 🛠 Technology Stack

- **Frontend**: React Native, Expo, TypeScript, Expo Router, Zustand (client cart), Vanilla StyleSheet (CeylonBite theme).
- **Backend API**: Node.js, Express.js, `mssql` driver, `jsonwebtoken` (JWT), `bcryptjs`.
- **Database Engine**: Microsoft SQL Server (`CeylonBiteDB`).
- **Database Management Tool**: SQL Server Management Studio 20 (SSMS).

---

## 📁 Project Structure

```
CeylonBite/
├── app/                      # Expo Router screens & layouts
│   ├── (auth)/               # Login & Register views
│   ├── (customer)/           # Home, Menu, Favorites, Orders, Profile
│   └── (admin)/              # Dashboard, Orders, Menu CRUD, Customers
├── components/               # UI components (Header, FoodCard, LoadingState)
├── services/                 # REST API services (api.ts, authService, menuService)
├── store/                    # Zustand stores (authStore, cartStore, favoriteStore)
├── docs/                     # Project & Viva Documentation (DATABASE, ERD, API, etc.)
├── backend/                  # Node.js + Express REST API Server
│   ├── src/
│   │   ├── config/db.js      # SQL Server connection pool (CeylonBiteAppUser)
│   │   ├── controllers/      # Auth, Food, Order, Favorite, Admin logic
│   │   ├── middleware/       # JWT auth & role guards
│   │   └── server.js         # Listener (Port 5001)
│   └── database/
│       ├── schema.sql        # Tables & CHECK constraints (fresh installs)
│       ├── migrations/       # 001, 002, 003 — upgrade scripts for existing DBs
│       ├── seed.sql          # Categories & Food menu items
│       └── create-app-login.sql # Least-privilege DB User setup
└── README.md
```

---

## ⚙️ Quick Installation & Setup Guide

### 1. Database Setup (MS SQL Server + SSMS)
1. Open **SSMS** and connect to your SQL Server instance (`localhost`).
2. Run [backend/database/schema.sql](file:///c:/Users/Nethshan%20Dulmin/Desktop/CeylonBite/backend/database/schema.sql) to create `CeylonBiteDB` (all tables, checks, and the `CEYLON20` promo code seed).
3. Run [backend/database/seed.sql](file:///c:/Users/Nethshan%20Dulmin/Desktop/CeylonBite/backend/database/seed.sql) to insert menu items.
4. Run [backend/database/create-app-login.sql](file:///c:/Users/Nethshan%20Dulmin/Desktop/CeylonBite/backend/database/create-app-login.sql) to configure the least-privilege login **`CeylonBiteAppUser`** (granted only `SELECT/INSERT/UPDATE/DELETE` on the app tables).

> **Upgrading an existing database?** Run the migration scripts in `backend/database/migrations/` in order (`001`, `002`, `003`) **before** `seed.sql`. Fresh installs do not need them — `schema.sql` already contains everything. Migration `003` creates the `Extras` add-on catalog that the food-detail screen and order pricing require.

### 2. Run Both Backend & Frontend Together (Recommended)
From the project root:
```bash
npm run dev
```
This runs both the Express backend API (Port 5001) and Expo frontend simultaneously in a single terminal.
- Press **`w`** in the terminal to launch the web preview.
- Or run **`npm run dev:web`** to start both and open web automatically.

### 3. Running Separately (Alternative)
**Backend:**
```bash
cd backend
npm run dev
```
Health Check: `http://localhost:5001/api/health`

**Frontend:**
```bash
# From project root
npm start
```
Press **`w`** to open Expo Web preview.

### 4. Running from another IDE or machine (VS Code, WebStorm, …)

The project is plain **Node.js + Expo**, so any IDE can run it — you just need **two terminals** (one for the API, one for the app). No IDE-specific config is required.

**Before moving the project elsewhere — two important gotchas**
1. **Uncommitted changes are not in `git`.** `git clone` only receives committed code. Either copy the whole project folder, or commit & push first:
   ```bash
   git add -A
   git commit -m "your message"
   git push
   ```
2. **`.env` and `backend/.env` are git-ignored**, so a clone will not include them. Recreate them from the templates and fill in your own values:
   ```bash
   copy .env.example .env
   copy backend\.env.example backend\.env
   ```
   Then set `DB_PASSWORD` and `JWT_SECRET` in `backend/.env`.

**VS Code**
1. **File → Open Folder →** `CeylonBite`.
2. **Terminal → New Terminal** (terminal 1):
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. **Terminal → New Terminal** (terminal 2), from the project root:
   ```bash
   npm install
   npx expo start
   ```
4. In the Expo terminal press **`w`** (web), **`a`** (Android emulator), or scan the QR code with the Expo Go app.

**WebStorm / IntelliJ / any IDE**
- Open the `CeylonBite` folder, then use the built-in terminal with the exact commands above, or create two npm run configurations: `start` (root `package.json`) and `dev` (`backend/package.json`).

**Requirements**
- **Node.js 18+** (tested on Node 22).
- **SQL Server** running locally on port **1433** with `CeylonBiteDB` created (see *Database Setup* above).

---

## 🔑 Admin Account Setup

To access the Admin Portal (`/(admin)/dashboard`):
1. Register a new user in the app (e.g. `admin@ceylonbite.lk`).
2. In SSMS, execute:
   ```sql
   UPDATE Users SET Role = 'admin' WHERE Email = 'admin@ceylonbite.lk';
   ```
3. Log out and log back in on the app.

---

## 🔮 Future Production Improvements

- Cloud SQL database deployment (Azure SQL / AWS RDS).
- Production API deployment with HTTPS SSL certificates.
- Refresh tokens for extended session management.
- Real payment gateway integration (PayHere / Stripe).
- Automated CI/CD pipelines and unit test suites.
