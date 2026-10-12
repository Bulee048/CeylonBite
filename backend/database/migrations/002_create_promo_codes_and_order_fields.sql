-- Migration 002: Create PromoCodes table and add PromoCode/DiscountAmount columns to Orders
USE CeylonBiteDB;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PromoCodes')
BEGIN
    CREATE TABLE PromoCodes (
        PromoID INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(50) UNIQUE NOT NULL,
        DiscountType NVARCHAR(20) NOT NULL CHECK (DiscountType IN ('percent', 'fixed')),
        DiscountValue DECIMAL(10,2) NOT NULL CHECK (DiscountValue > 0),
        MinOrderAmount DECIMAL(10,2) DEFAULT 0,
        ExpiresAt DATETIME2 NULL,
        IsActive BIT DEFAULT 1,
        UsageLimit INT NULL,
        UsedCount INT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Created PromoCodes table.';
END;
GO

IF COL_LENGTH('Orders', 'PromoCode') IS NULL
BEGIN
    ALTER TABLE Orders ADD PromoCode NVARCHAR(50) NULL;
END;
GO

IF COL_LENGTH('Orders', 'DiscountAmount') IS NULL
BEGIN
    ALTER TABLE Orders ADD DiscountAmount DECIMAL(10,2) DEFAULT 0;
END;
GO

-- Seed CEYLON20 Promo Code if not exists
IF NOT EXISTS (SELECT * FROM PromoCodes WHERE Code = 'CEYLON20')
BEGIN
    INSERT INTO PromoCodes (Code, DiscountType, DiscountValue, MinOrderAmount, IsActive)
    VALUES ('CEYLON20', 'percent', 20.00, 0.00, 1);
    PRINT 'Seeded CEYLON20 promo code.';
END;
GO
