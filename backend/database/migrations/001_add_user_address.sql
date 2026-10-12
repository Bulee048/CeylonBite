-- Migration 001: Add Address column to Users table
USE CeylonBiteDB;
GO

IF COL_LENGTH('Users', 'Address') IS NULL
BEGIN
    ALTER TABLE Users ADD Address NVARCHAR(500) NULL;
    PRINT 'Added Address column to Users table.';
END;
GO
