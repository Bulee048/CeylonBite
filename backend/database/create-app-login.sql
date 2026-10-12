-- CeylonBite Application Database Login & User Permissions Setup

USE master;
GO

-- 1. Create SQL Server Login for CeylonBite Application
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'CeylonBiteAppUser')
BEGIN
    CREATE LOGIN [CeylonBiteAppUser] WITH PASSWORD = N'CeylonBiteAppSecurePass2026!', CHECK_POLICY = OFF;
    PRINT '✅ Login CeylonBiteAppUser created.';
END
ELSE
BEGIN
    ALTER LOGIN [CeylonBiteAppUser] WITH PASSWORD = N'CeylonBiteAppSecurePass2026!', CHECK_POLICY = OFF;
    ALTER LOGIN [CeylonBiteAppUser] ENABLE;
    PRINT '✅ Login CeylonBiteAppUser updated and enabled.';
END
GO

USE CeylonBiteDB;
GO

-- 2. Create Database User for CeylonBiteAppUser
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'CeylonBiteAppUser')
BEGIN
    CREATE USER [CeylonBiteAppUser] FOR LOGIN [CeylonBiteAppUser];
    PRINT '✅ Database User CeylonBiteAppUser created in CeylonBiteDB.';
END
GO

-- 2b. Grant CONNECT on the default TDS TCP endpoint.
-- Required on SQL Server 2022+ / 2025 where SQL logins can otherwise fail with
-- "Login lacks connect endpoint permission" even though the public role has CONNECT.
IF NOT EXISTS (
    SELECT 1
    FROM sys.server_permissions p
    JOIN sys.server_principals prin ON p.grantee_principal_id = prin.principal_id
    WHERE prin.name = 'CeylonBiteAppUser'
      AND p.permission_name = 'CONNECT'
      AND p.major_id = (SELECT endpoint_id FROM sys.endpoints WHERE name = 'TSQL Default TCP')
)
BEGIN
    GRANT CONNECT ON ENDPOINT::[TSQL Default TCP] TO [CeylonBiteAppUser];
    PRINT '✅ Granted CONNECT on TSQL Default TCP endpoint to CeylonBiteAppUser.';
END
GO

-- 3. Grant Specific Least-Privilege Permissions on Application Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Users TO [CeylonBiteAppUser];
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Categories TO [CeylonBiteAppUser];
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Foods TO [CeylonBiteAppUser];
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Orders TO [CeylonBiteAppUser];
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.OrderItems TO [CeylonBiteAppUser];
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Favorites TO [CeylonBiteAppUser];
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.PromoCodes TO [CeylonBiteAppUser];
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Extras TO [CeylonBiteAppUser];

PRINT '✅ Least-privilege permissions (SELECT, INSERT, UPDATE, DELETE) granted to CeylonBiteAppUser on CeylonBiteDB tables.';
GO
