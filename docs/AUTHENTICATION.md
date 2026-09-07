# Authentication & Authorization Architecture — CeylonBite

## 🔒 Authentication Flow

```
[Customer / Admin]
       │
       ├─► 1. Register: POST /api/auth/register
       │      • Password hashed via bcryptjs (Salt rounds: 10)
       │      • Stored as PasswordHash in SQL Server Users table
       │      • Role forced to 'customer'
       │
       ├─► 2. Login: POST /api/auth/login
       │      • bcrypt.compare(inputPassword, user.PasswordHash)
       │      • Generates JWT Token (Payload: { userId, role }, Expires: 7d)
       │      • Frontend receives JWT & stores in AsyncStorage / localStorage
       │
       └─► 3. Authenticated Request: Headers: { Authorization: "Bearer <token>" }
              • Express authMiddleware verifies JWT signature
              • Decoded user object attached to req.user
```

---

## 🛡 Authentication vs Authorization

- **Authentication (Who are you?)**: Handles verifying user identity during login using `bcryptjs` password comparison and issuing a signed JWT token. Handled by `authMiddleware.js`.
- **Authorization (What are you allowed to do?)**: Enforces permission limits on protected endpoints based on user roles (`customer` vs `admin`). Handled by `roleMiddleware.js`.

---

## 🛑 Status Codes & Security Errors

- **`401 Unauthorized`**: Returned when an HTTP request missing an `Authorization: Bearer <token>` header or carrying an expired/invalid JWT attempts to access a protected route.
- **`403 Forbidden`**: Returned when an authenticated customer attempts to invoke an administrative action (e.g. updating order status or creating food items).
