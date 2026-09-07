# REST API Documentation — CeylonBite

Base API URL: `http://localhost:5001/api`

---

## 🔐 Authentication Endpoints

### 1. Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+94 77 123 4567",
    "password": "Password123!"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Account created successfully",
    "data": {
      "token": "<JWT_TOKEN>",
      "user": { "id": 2, "fullName": "John Doe", "email": "john@example.com", "role": "customer" }
    }
  }
  ```

---

### 2. Login User
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "Password123!"
  }
  ```

---

### 3. Get Authenticated Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth Required**: Yes (`Bearer <token>`)

---

## 🍔 Menu Catalog Endpoints

### 4. Get Categories
- **Method**: `GET`
- **Path**: `/api/categories`
- **Auth Required**: No

---

### 5. Get Foods Catalog
- **Method**: `GET`
- **Path**: `/api/foods`
- **Query Parameters**: `?search=burger&category=burgers&popular=true`
- **Auth Required**: No

---

### 6. Get Food Details
- **Method**: `GET`
- **Path**: `/api/foods/:id`
- **Auth Required**: No

---

## ❤️ Favorites Endpoints

### 7. Get Customer Favorites
- **Method**: `GET`
- **Path**: `/api/favorites`
- **Auth Required**: Yes (`customer`)

---

### 8. Add Favorite
- **Method**: `POST`
- **Path**: `/api/favorites/:foodId`
- **Auth Required**: Yes (`customer`)

---

### 9. Remove Favorite
- **Method**: `DELETE`
- **Path**: `/api/favorites/:foodId`
- **Auth Required**: Yes (`customer`)

---

## 📦 Customer Order Endpoints

### 10. Place Order
- **Method**: `POST`
- **Path**: `/api/orders`
- **Auth Required**: Yes (`customer`)
- **Request Body**:
  ```json
  {
    "orderType": "delivery",
    "paymentMethod": "cash",
    "deliveryAddress": "No. 25 Galle Road, Colombo",
    "deliveryInstructions": "Ring bell",
    "items": [
      { "foodId": "1", "quantity": 2, "selectedSpice": "Medium Spice", "extras": ["Extra Cheese"] }
    ]
  }
  ```

---

### 11. Get My Orders
- **Method**: `GET`
- **Path**: `/api/orders/my`
- **Auth Required**: Yes (`customer`)

---

### 12. Get Order Details
- **Method**: `GET`
- **Path**: `/api/orders/:id`
- **Auth Required**: Yes (`customer`)

---

## 👑 Admin Endpoints (Require `Role = 'admin'`)

### 13. Create Food Item
- **Method**: `POST`
- **Path**: `/api/admin/foods`
- **Auth Required**: Yes (`admin`)

---

### 14. Update Food Item
- **Method**: `PUT`
- **Path**: `/api/admin/foods/:id`
- **Auth Required**: Yes (`admin`)

---

### 15. Toggle Food Availability
- **Method**: `PATCH`
- **Path**: `/api/admin/foods/:id/availability`
- **Auth Required**: Yes (`admin`)

---

### 16. Get All Orders (Admin)
- **Method**: `GET`
- **Path**: `/api/admin/orders`
- **Auth Required**: Yes (`admin`)

---

### 17. Update Order Status
- **Method**: `PATCH`
- **Path**: `/api/admin/orders/:id/status`
- **Auth Required**: Yes (`admin`)
- **Request Body**: `{ "status": "preparing" }`

---

### 18. Get Customer List
- **Method**: `GET`
- **Path**: `/api/admin/customers`
- **Auth Required**: Yes (`admin`)

---

### 19. Get Admin Dashboard Summary
- **Method**: `GET`
- **Path**: `/api/admin/dashboard`
- **Auth Required**: Yes (`admin`)
