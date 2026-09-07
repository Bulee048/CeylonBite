-- ===================================================
-- CEYLONBITE DATABASE SEED SCRIPT
-- ===================================================
USE CeylonBiteDB;
GO

-- 1. Insert Categories
IF NOT EXISTS (SELECT * FROM Categories WHERE Slug = 'burgers')
BEGIN
    INSERT INTO Categories (Name, Slug, IconName, SortOrder) VALUES
    ('Burgers', 'burgers', 'fast-food-outline', 1),
    ('Fried Chicken', 'chicken', 'restaurant-outline', 2),
    ('Rice & Kottu', 'rice', 'nutrition-outline', 3),
    ('Pizza', 'pizza', 'pizza-outline', 4),
    ('Wraps & Sides', 'wraps', 'flame-outline', 5),
    ('Drinks', 'drinks', 'beer-outline', 6),
    ('Desserts', 'desserts', 'ice-cream-outline', 7);
END;
GO

-- 2. Insert Foods
IF NOT EXISTS (SELECT * FROM Foods WHERE Name = 'Ceylon Crunch Burger')
BEGIN
    DECLARE @BurgerCatID INT = (SELECT CategoryID FROM Categories WHERE Slug = 'burgers');
    DECLARE @ChickenCatID INT = (SELECT CategoryID FROM Categories WHERE Slug = 'chicken');
    DECLARE @RiceCatID INT = (SELECT CategoryID FROM Categories WHERE Slug = 'rice');
    DECLARE @PizzaCatID INT = (SELECT CategoryID FROM Categories WHERE Slug = 'pizza');
    DECLARE @WrapsCatID INT = (SELECT CategoryID FROM Categories WHERE Slug = 'wraps');
    DECLARE @DrinksCatID INT = (SELECT CategoryID FROM Categories WHERE Slug = 'drinks');
    DECLARE @DessertsCatID INT = (SELECT CategoryID FROM Categories WHERE Slug = 'desserts');

    INSERT INTO Foods (CategoryID, Name, Description, Price, ImageURL, Rating, IsAvailable, IsPopular) VALUES
    (@BurgerCatID, 'Ceylon Crunch Burger', 'Crispy spiced chicken fillet topped with spicy sambal mayo, lettuce & melted cheddar on a toasted sesame bun.', 1490.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800', 4.9, 1, 1),
    (@ChickenCatID, 'Spicy Chicken Bucket (6 Pcs)', '6 pieces of signature double-crunch fried chicken seasoned with roasted Sri Lankan chili spices.', 3850.00, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=800', 4.8, 1, 1),
    (@RiceCatID, 'Hot Butter Chicken Rice', 'Fragrant basmati rice served with crunchy hot butter chicken, chili paste & fried egg.', 1890.00, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800', 4.9, 1, 1),
    (@PizzaCatID, 'BBQ Chicken Pizza', 'Hand-tossed pizza crust loaded with smokey BBQ chicken, red onion, mozzarella & sweet chili drizzle.', 2650.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800', 4.7, 1, 1),
    (@WrapsCatID, 'Crispy Chicken Wrap', 'Crispy tender strips wrapped in warm tortilla with fresh slaw and fiery garlic aioli.', 1250.00, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=800', 4.6, 1, 0),
    (@WrapsCatID, 'Loaded Ceylon Fries', 'Golden crinkle-cut fries smothered in cheese sauce, devilled chicken bits & spring onions.', 950.00, 'https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=800', 4.8, 1, 0),
    (@DessertsCatID, 'Chocolate Lava Cake', 'Warm rich dark chocolate cake with a molten liquid center, served warm.', 850.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800', 4.9, 1, 0),
    (@DrinksCatID, 'Lime Mojito', 'Refreshing crushed mint and fresh island lime soda served iced.', 650.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800', 4.7, 1, 0);
END;
GO
