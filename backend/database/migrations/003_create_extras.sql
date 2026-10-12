-- Migration 003: Create the Extras (add-on/topping) catalog.
--
-- Prices for extras are billed by the API from this table; the client is never
-- authoritative for an add-on price. Safe to run on an existing database.
USE CeylonBiteDB;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Extras')
BEGIN
    CREATE TABLE Extras (
        ExtraID INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        Price DECIMAL(10,2) NOT NULL CHECK (Price >= 0),
        IsAvailable BIT NOT NULL DEFAULT 1,
        SortOrder INT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Created Extras table.';
END;
GO

IF NOT EXISTS (SELECT * FROM Extras WHERE Name = 'Extra Cheese')
BEGIN
    INSERT INTO Extras (Name, Price, IsAvailable, SortOrder) VALUES
    ('Extra Cheese', 250.00, 1, 1),
    ('Extra Chicken', 450.00, 1, 2),
    ('Signature Sauce', 150.00, 1, 3);
    PRINT 'Seeded standard extras.';
END;
GO
