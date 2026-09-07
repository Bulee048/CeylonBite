-- ===================================================
-- CREATE OR PROMOTE ADMIN USER IN CEYLONBITE DB
-- ===================================================
USE CeylonBiteDB;
GO

-- Option 1: Promote an existing registered customer to admin
-- (First register via app with email admin@ceylonbite.lk, then run this)
UPDATE Users
SET Role = 'admin'
WHERE Email = 'admin@ceylonbite.lk';
GO

SELECT UserID, FullName, Email, Role FROM Users WHERE Role = 'admin';
GO
