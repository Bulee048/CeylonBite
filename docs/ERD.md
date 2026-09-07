# Entity-Relationship Diagram (ERD) — CeylonBiteDB

## 📊 Visual ER Diagram

```mermaid
erDiagram
    Users ||--o{ Orders : "places"
    Users ||--o{ Favorites : "saves"
    Categories ||--o{ Foods : "contains"
    Foods ||--o{ OrderItems : "appears in"
    Foods ||--o{ Favorites : "marked in"
    Orders ||--|{ OrderItems : "includes"

    Users {
        int UserID PK
        nvarchar FullName
        nvarchar Email UK
        nvarchar Phone
        nvarchar PasswordHash
        nvarchar Role
        bit IsActive
        datetime2 CreatedAt
    }

    Categories {
        int CategoryID PK
        nvarchar Name
        nvarchar Slug UK
        nvarchar ImageURL
        bit IsActive
        int SortOrder
    }

    Foods {
        int FoodID PK
        int CategoryID FK
        nvarchar Name
        nvarchar Description
        decimal Price
        nvarchar ImageURL
        decimal Rating
        bit IsAvailable
        bit IsPopular
    }

    Orders {
        int OrderID PK
        nvarchar OrderNumber UK
        int UserID FK
        nvarchar OrderType
        nvarchar Status
        nvarchar PaymentMethod
        decimal Subtotal
        decimal DeliveryFee
        decimal Total
        datetime2 CreatedAt
    }

    OrderItems {
        int OrderItemID PK
        int OrderID FK
        int FoodID FK
        nvarchar FoodName
        int Quantity
        decimal BasePrice
        decimal LineTotal
    }

    Favorites {
        int FavoriteID PK
        int UserID FK
        int FoodID FK
        datetime2 CreatedAt
    }
```

---

## 📝 Relationship Explanations

1. **`Users` 1 → Many `Orders`**:
   - A single customer can place multiple orders over time.
   - Each order is linked to exactly one user via `Orders.UserID`.

2. **`Orders` 1 → Many `OrderItems`**:
   - An order contains one or more food line items.
   - Each line item belongs to a specific order via `OrderItems.OrderID`.

3. **`Foods` 1 → Many `OrderItems`**:
   - A menu dish can appear in many order line items across different customer orders.
   - Linked via `OrderItems.FoodID`.

4. **`Categories` 1 → Many `Foods`**:
   - Each food category (e.g. Burgers) contains multiple food items.
   - Linked via `Foods.CategoryID`.

5. **`Users` 1 → Many `Favorites`**:
   - A user can favorite multiple dishes.
   - Linked via `Favorites.UserID`.

6. **`Foods` 1 → Many `Favorites`**:
   - A food item can be favorited by multiple users.
   - Enforced by a unique composite constraint `(UserID, FoodID)`.
