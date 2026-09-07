# System Architecture Documentation — CeylonBite

## 🏛 System Architecture Overview

CeylonBite is designed using a decoupled 3-tier client-server architecture.

```
┌─────────────────────────────────────────────────────────┐
│              React Native + Expo (TypeScript)            │
│                 Frontend User Interface                 │
└────────────────────────────┬────────────────────────────┘
                             │
                      HTTP REST API (JSON)
                             │
┌────────────────────────────▼────────────────────────────┐
│                  Node.js + Express.js                    │
│                    REST API Server                      │
└────────────────────────────┬────────────────────────────┘
                             │
                      mssql Connection Pool
                             │
┌────────────────────────────▼────────────────────────────┐
│                Microsoft SQL Server 2025                │
│                 Database Engine (DBMS)                  │
└────────────────────────────▲────────────────────────────┘
                             │
                 Management & Inspection
                             │
┌────────────────────────────┴────────────────────────────┐
│        SQL Server Management Studio 20 (SSMS)           │
│                    Management Tool                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 Tier Responsibilities

### 1. Frontend Tier: React Native + Expo (TypeScript)
- Renders mobile and web interfaces using Expo Router.
- Manages local client state (cart additions, active filters) using Zustand.
- Sends REST HTTP requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) with JWT Bearer headers to the backend server.
- **Never connects directly to Microsoft SQL Server**.

### 2. Application Tier: Node.js + Express.js
- Implements RESTful HTTP endpoints.
- Validates request payloads and recalculates prices server-side.
- Hashes passwords using `bcryptjs` and signs/verifies JWT tokens.
- Protects administrative routes via role middleware (`requireRole('admin')`).
- Connects to Microsoft SQL Server via parameterized `mssql` connection pooling.

### 3. Database Tier: Microsoft SQL Server & SSMS

> [!IMPORTANT]
> **Database Engine vs Management Tool Distinction**:
> - **Microsoft SQL Server**: The actual relational database management platform (DBMS) running as a background service (`MSSQLSERVER`), managing transactions, storage, indices, and security permissions.
> - **SQL Server Management Studio (SSMS)**: An administrative client GUI tool used by developers/administrators to query, visualize tables, run `.sql` scripts, and manage database security. SSMS is NOT the database itself.

---

## 🔒 Security Architecture Highlights

1. **Dedicated Database Application Account**:
   The Express backend connects using `CeylonBiteAppUser` with explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` grants on application tables. It does not use the `sa` account or possess `sysadmin` privileges.

2. **Parameterized SQL Query Guards**:
   All database queries bind parameters using `@param` placeholders via the `mssql` driver to protect against SQL Injection attacks.

3. **Stateless JWT Authorization**:
   Session tokens expire after 7 days and encode `userId` and `role`. Protected endpoints enforce role guards on the server side.
