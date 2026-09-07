# Database Documentation — CeylonBiteDB

## 📖 Database Overview

`CeylonBiteDB` is a relational database designed for Microsoft SQL Server to manage users, product categories, food menu items, customer orders, order line items, and customer favorites for the CeylonBite fast-food ordering application.

---

## 🗄 Table Schemas & Relationships

### 1. `Users`
Stores account profiles for both customers and restaurant administrators.

- **Primary Key**: `UserID` (`INT IDENTITY(1,1)`)
- **Key Columns**:
  - `FullName` (`NVARCHAR(100)` NOT NULL): Full name of the user.
  - `Email` (`NVARCHAR(150)` UNIQUE NOT NULL): Unique email address used for authentication.
  - `Phone` (`NVARCHAR(20)`): Contact phone number.
  - `PasswordHash` (`NVARCHAR(255)` NOT NULL): `bcrypt` password hash. Never stored plain-text.
  - `Role` (`NVARCHAR(20)` NOT NULL DEFAULT `'customer'`): Role constraint (`CHECK (Role IN ('customer', 'admin'))`).
  - `IsActive` (`BIT` NOT NULL DEFAULT 1): Active status flag.
  - `CreatedAt` / `UpdatedAt` (`DATETIME2` DEFAULT `GETDATE()`): Audit timestamps.

---

### 2. `Categories`
Stores food categories used to group dishes in the menu.

- **Primary Key**: `CategoryID` (`INT IDENTITY(1,1)`)
- **Key Columns**:
  - `Name` (`NVARCHAR(100)` NOT NULL): Display category title (e.g., Burgers, Rice, Pizza).
  - `Slug` (`NVARCHAR(100)` UNIQUE NOT NULL): URL-friendly slug identifier (e.g., `burgers`).
  - `ImageURL` (`NVARCHAR(500)`): Cover image link.
  - `IsActive` (`BIT` DEFAULT 1): Category availability flag.
  - `SortOrder` (`INT` DEFAULT 0): Display priority.

---

### 3. `Foods`
Stores the fast-food menu items offered by CeylonBite.

- **Primary Key**: `FoodID` (`INT IDENTITY(1,1)`)
- **Foreign Key**: `CategoryID` → `Categories(CategoryID)`
- **Key Columns**:
  - `Name` (`NVARCHAR(150)` NOT NULL): Name of the dish.
  - `Description` (`NVARCHAR(1000)`): Full description of ingredients and preparation.
  - `Price` (`DECIMAL(10,2)` NOT NULL): Price in LKR (`CHECK (Price >= 0)`).
  - `ImageURL` (`NVARCHAR(500)`): High-resolution food image.
  - `Rating` (`DECIMAL(2,1)` DEFAULT 0): Average customer rating.
  - `IsAvailable` (`BIT` DEFAULT 1): Menu item availability status.
  - `IsPopular` (`BIT` DEFAULT 0): Featured tag for popular items.

---

### 4. `Orders`
Stores customer orders and header-level metadata.

- **Primary Key**: `OrderID` (`INT IDENTITY(1,1)`)
- **Foreign Key**: `UserID` → `Users(UserID)`
- **Key Columns**:
  - `OrderNumber` (`NVARCHAR(30)` UNIQUE NOT NULL): Human-readable tracking number (e.g., `CB982741`).
  - `OrderType` (`NVARCHAR(20)` NOT NULL): `delivery` or `pickup` (`CHECK (OrderType IN ('delivery', 'pickup'))`).
  - `Status` (`NVARCHAR(30)` NOT NULL DEFAULT `'pending'`): Status constraint (`CHECK (Status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'))`).
  - `PaymentMethod` (`NVARCHAR(30)` NOT NULL): Payment choice (`CHECK (PaymentMethod IN ('cash', 'card', 'wallet'))`).
  - `Subtotal`, `DeliveryFee`, `Discount`, `Total` (`DECIMAL(10,2)` NOT NULL): Server-recalculated totals.
  - `DeliveryAddress` (`NVARCHAR(500)`), `DeliveryInstructions` (`NVARCHAR(1000)`): Address details.

---

### 5. `OrderItems`
Stores individual line items linked to an order.

- **Primary Key**: `OrderItemID` (`INT IDENTITY(1,1)`)
- **Foreign Keys**:
  - `OrderID` → `Orders(OrderID)`
  - `FoodID` → `Foods(FoodID)`
- **Key Columns**:
  - `FoodName` (`NVARCHAR(150)` NOT NULL): Preserved dish title at purchase time.
  - `Quantity` (`INT` NOT NULL): Purchased count (`CHECK (Quantity > 0)`).
  - `BasePrice` (`DECIMAL(10,2)` NOT NULL): Base unit price at checkout time.
  - `SelectedSpice` (`NVARCHAR(50)`): Customer spice level selection.
  - `Extras` (`NVARCHAR(MAX)`): JSON string storing extra toppings or add-ons.
  - `UnitTotal`, `LineTotal` (`DECIMAL(10,2)` NOT NULL): Calculated item totals.

---

### 6. `Favorites`
Stores customer favorite dishes.

- **Primary Key**: `FavoriteID` (`INT IDENTITY(1,1)`)
- **Foreign Keys**:
  - `UserID` → `Users(UserID)`
  - `FoodID` → `Foods(FoodID)`
- **Constraints**: `UNIQUE (UserID, FoodID)` prevents duplicate favorite records.

---

## 💡 Key Database Terminology Explained

- **Primary Key (PK)**: A unique column (e.g. `UserID`) that uniquely identifies each row in a database table.
- **Foreign Key (FK)**: A column referencing the Primary Key of another table (e.g. `OrderID` in `OrderItems`) to enforce relational integrity.
- **Unique Constraint**: A rule ensuring no two rows contain identical values in specified columns (e.g. `Email` or `OrderNumber`).
- **Check Constraint**: A condition that validates column data before insertion (e.g. `Price >= 0` or `Role IN ('customer', 'admin')`).
- **Identity**: An auto-incrementing column (e.g. `IDENTITY(1,1)`) managed automatically by SQL Server.
- **DECIMAL(10,2)**: Exact fixed-point numeric type storing up to 10 digits with 2 decimal places, preventing floating-point rounding errors for currency.
- **NVARCHAR(N)**: Variable-length Unicode character string supporting international characters up to $N$ characters.
- **BIT**: Integer type storing `1` (True) or `0` (False).
- **DATETIME2**: High-precision date and time stamp recording fractional seconds.

---

## ⚡ SQL Order Transactions Explained

When an order is created, the backend executes a **SQL Transaction**:

```sql
BEGIN TRANSACTION;
  -- 1. Insert into Orders table
  INSERT INTO Orders (OrderNumber, UserID, Subtotal, DeliveryFee, Total, ...)
  VALUES ('CB982741', 2, 2980.00, 350.00, 3330.00, ...);

  -- 2. Insert line items into OrderItems table
  INSERT INTO OrderItems (OrderID, FoodID, FoodName, Quantity, BasePrice, LineTotal)
  VALUES (1, 1, 'Ceylon Crunch Burger', 2, 1490.00, 2980.00);

COMMIT TRANSACTION;
```

### Why Transactions are Mandatory
If the server loses power or encounters an error after creating the `Orders` row but before writing `OrderItems`, a **ROLLBACK** is automatically triggered. This guarantees that an order cannot exist in the database without its corresponding line items (atomicity).
