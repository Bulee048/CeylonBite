-- ===================================================
-- CEYLONBITE MICROSOFT SQL SERVER SCHEMA
-- SSMS Execution Target: CeylonBiteDB
-- ===================================================

-- Create database if not exists
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'CeylonBiteDB')
BEGIN
    CREATE DATABASE CeylonBiteDB;
END;
GO

USE CeylonBiteDB;
GO

-- ---------------------------------------------------
-- 1. USERS TABLE
-- ---------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        UserID INT IDENTITY(1,1) PRIMARY KEY,
        FullName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(150) UNIQUE NOT NULL,
        Phone NVARCHAR(20) NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        Role NVARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (Role IN ('customer', 'admin')),
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
    );
END;
GO

-- ---------------------------------------------------
-- 2. CATEGORIES TABLE
-- ---------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
BEGIN
    CREATE TABLE Categories (
        CategoryID INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        Slug NVARCHAR(100) UNIQUE NOT NULL,
        ImageURL NVARCHAR(500) NULL,
        IconName NVARCHAR(100) DEFAULT 'fast-food-outline',
        IsActive BIT DEFAULT 1,
        SortOrder INT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETDATE()
    );
END;
GO

-- ---------------------------------------------------
-- 3. FOODS TABLE
-- ---------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Foods')
BEGIN
    CREATE TABLE Foods (
        FoodID INT IDENTITY(1,1) PRIMARY KEY,
        CategoryID INT NOT NULL,
        Name NVARCHAR(150) NOT NULL,
        Description NVARCHAR(1000) NULL,
        Price DECIMAL(10,2) NOT NULL CHECK (Price >= 0),
        ImageURL NVARCHAR(500) NULL,
        Rating DECIMAL(2,1) DEFAULT 4.5,
        IsAvailable BIT DEFAULT 1,
        IsPopular BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_Foods_Categories FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID) ON DELETE CASCADE
    );
END;
GO

-- ---------------------------------------------------
-- 4. ORDERS TABLE
-- ---------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Orders')
BEGIN
    CREATE TABLE Orders (
        OrderID INT IDENTITY(1,1) PRIMARY KEY,
        OrderNumber NVARCHAR(30) UNIQUE NOT NULL,
        UserID INT NOT NULL,
        CustomerName NVARCHAR(100) NULL,
        CustomerPhone NVARCHAR(20) NULL,
        OrderType NVARCHAR(20) NOT NULL CHECK (OrderType IN ('delivery', 'pickup')),
        Status NVARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (Status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
        PaymentMethod NVARCHAR(30) NOT NULL CHECK (PaymentMethod IN ('cash', 'card', 'wallet')),
        Subtotal DECIMAL(10,2) NOT NULL,
        DeliveryFee DECIMAL(10,2) DEFAULT 0,
        Discount DECIMAL(10,2) DEFAULT 0,
        Total DECIMAL(10,2) NOT NULL,
        DeliveryAddress NVARCHAR(500) NULL,
        DeliveryInstructions NVARCHAR(1000) NULL,
        ScheduledTime DATETIME2 NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_Orders_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
    );
END;
GO

-- ---------------------------------------------------
-- 5. ORDER ITEMS TABLE
-- ---------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderItems')
BEGIN
    CREATE TABLE OrderItems (
        OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
        OrderID INT NOT NULL,
        FoodID INT NULL,
        FoodName NVARCHAR(150) NOT NULL,
        Quantity INT NOT NULL CHECK (Quantity > 0),
        BasePrice DECIMAL(10,2) NOT NULL,
        SelectedSpice NVARCHAR(50) NULL,
        Extras NVARCHAR(MAX) NULL,
        UnitTotal DECIMAL(10,2) NOT NULL,
        LineTotal DECIMAL(10,2) NOT NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItems_Foods FOREIGN KEY (FoodID) REFERENCES Foods(FoodID) ON DELETE SET NULL
    );
END;
GO

-- ---------------------------------------------------
-- 6. FAVORITES TABLE
-- ---------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Favorites')
BEGIN
    CREATE TABLE Favorites (
        FavoriteID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        FoodID INT NOT NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_Favorites_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
        CONSTRAINT FK_Favorites_Foods FOREIGN KEY (FoodID) REFERENCES Foods(FoodID) ON DELETE CASCADE,
        CONSTRAINT UQ_User_Food UNIQUE (UserID, FoodID)
    );
END;
GO
