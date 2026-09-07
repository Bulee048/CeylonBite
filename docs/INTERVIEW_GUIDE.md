# Comprehensive Viva & Technical Interview Guide — CeylonBite

## 🎓 Essential Q&A

### 1. What is CeylonBite?
**Answer**: CeylonBite is a full-stack fast-food ordering and restaurant management system. Customers can browse food categories, customize spice levels, manage a shopping cart, place orders, and track delivery statuses. Restaurant administrators can manage food menus live, update order statuses, and view sales analytics.

### 2. Why React Native & Expo?
**Answer**: React Native allows building native cross-platform applications (iOS, Android, Web) using a single TypeScript codebase. Expo simplifies build configurations, routing via Expo Router, and development previews without needing complex native build setups.

### 3. Why TypeScript?
**Answer**: TypeScript provides strict static typing, catching potential runtime errors (e.g. missing object fields or incorrect type conversions) during compile-time and offering auto-completion across services and UI components.

### 4. Why Zustand for state management?
**Answer**: Zustand is lightweight, boilerplate-free, and avoids unnecessary re-renders compared to Redux. It is ideal for local client-side state like shopping cart items and active user sessions.

### 5. Why Node.js & Express.js?
**Answer**: Node.js offers high-concurrency non-blocking I/O ideal for handling multiple REST API requests simultaneously. Express.js provides clean routing and middleware architecture for authentication and authorization.

### 6. Why Microsoft SQL Server?
**Answer**: CeylonBite contains strongly relational structured data (users, orders, line items, foods, categories). SQL Server ensures data integrity through Foreign Keys, Primary Keys, CHECK constraints, and ACID-compliant multi-table SQL Transactions when placing orders.

### 7. Why SQL Server Management Studio (SSMS)?
**Answer**: Microsoft SQL Server is the database engine running as a background service, while SSMS is the desktop client tool used to query tables, execute `.sql` scripts, inspect records, and manage security logins.

### 8. Why SQL instead of MongoDB?
**Answer**: Food ordering requires strict relational integrity (e.g. an order must link to an existing user, and order items must reference existing foods with guaranteed price calculations). Relational SQL databases prevent orphaned records and handle transactional rollbacks natively.

### 9. What is a REST API & why doesn't React Native connect directly to SQL Server?
**Answer**: Direct database connections from mobile or browser clients would expose database credentials and allow malicious users to execute arbitrary SQL queries. A Node.js REST API acts as a secure intermediary layer enforcing authentication, input validation, and business logic.

### 10. How does authentication & password security work?
**Answer**: User passwords are never stored plain-text; they are hashed using `bcryptjs` with salt round 10. On login, `bcrypt.compare()` verifies credentials, and the server generates a signed JSON Web Token (JWT) containing the user's `userId` and `role`. Protected requests pass this token in the `Authorization: Bearer <token>` header.

### 11. What is the difference between 401 Unauthorized and 403 Forbidden?
**Answer**:
- **401 Unauthorized**: The user is unauthenticated (missing or invalid JWT token).
- **403 Forbidden**: The user is authenticated but lacks permission for the requested action (e.g. a customer trying to access an admin menu creation endpoint).

### 12. Why are SQL Transactions used when placing an order?
**Answer**: Placing an order requires writing to both the `Orders` table and `OrderItems` table. Wrapping these queries in `BEGIN TRANSACTION ... COMMIT` ensures that if insertion fails at any step, the entire operation is rolled back, preventing incomplete or corrupt orders.

### 13. Why use a dedicated application database user instead of `sa`?
**Answer**: Following the Principle of Least Privilege, the application connects via `CeylonBiteAppUser` with grants limited to `SELECT`, `INSERT`, `UPDATE`, `DELETE` on application tables. Server-level administrative privileges (`sysadmin`) are revoked to minimize security risks if backend credentials were ever compromised.
