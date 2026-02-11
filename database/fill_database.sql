USE spoiler_alert;

INSERT INTO User (user_id, first_name, last_name, email, password, has_premium, free_scans_left)
VALUES(0, "george", "steves", 'george@gmail.com', 'password123', true, 0);

INSERT INTO User (user_id, first_name, last_name, email, password, has_premium, free_scans_left)
VALUES(1, "Spike", "Witwicky", 'spikey@gmail.com', 'spikester2003', true, 0);

INSERT INTO User (user_id, first_name, last_name, email, password, has_premium, free_scans_left)
VALUES(2, "Miko", "Nakadai", 'nakadai@yahoo.com', 'bulkhead10132', true, 0);

INSERT INTO User (user_id, first_name, last_name, email, password, has_premium, free_scans_left)
VALUES(3, "Sōji", "Yoshikawa", 'Soshi@gmail.com', 'optimus03$', false, 13);

INSERT INTO User (user_id, first_name, last_name, email, password, has_premium, free_scans_left)
VALUES(4, "Rafael ", "Esquivel", 'Rafbee@gmail.com', 'bumble!02', true, 0);

INSERT INTO User (user_id, first_name, last_name, email, password, has_premium, free_scans_left)
VALUES(5, "Jack", "Darby", 'jaxmotors@gmail.com', 'arcee!2006', false, 5);

INSERT INTO User (user_id, first_name, last_name, email, password, has_premium, free_scans_left)
VALUES(6, "Astoria", "Carlton-Ritz", 'astoriaritz@gmail.com', 'powerglide', false, 23);


INSERT INTO Product (product_id, upc, product_name, brand)
VALUES (0, 017400106751, "Mahatma Enriched Extra Long Grain Rice - 2lbs", "Mahatma");

INSERT INTO Product (product_id, upc, product_name, brand)
VALUES (1, 030800805000, "Christmas Lifesavers Candy Canes - 12 Count 5.3OZ", "Spangler");

INSERT INTO Product (product_id, upc, product_name, brand)
VALUES (2, 078742231044, "Great Value French Roast 100% Arabica Dark Roast Ground Coffee 12 Oz", "Walmart Stores Inc");

INSERT INTO Product (product_id, upc, product_name, brand)
VALUES (3, 078742113784, "Great Value Creamy Peanut Butter 64 Oz", "Sunco Foods Inc");

INSERT INTO Product (product_id, upc, product_name, brand)
VALUES (4, 078742082752, "Great Value Chunk Light Tuna in Water 5 Oz", "Walmart Stores Inc");

INSERT INTO Product (product_id, upc, product_name, brand)
VALUES (5, 605388187161, "Half & Half", "Wal-mart Stores, Inc.");

INSERT INTO Product (product_id, upc, product_name, brand)
VALUES (6, 078742353227, "100% Grated Parmesan Cheese", "Wal-mart Stores, Inc.");



INSERT INTO Recall (recall_id, product_id, is_active, description, date, company, regions, amount_sick, amount_dead, product_keywords, classification)
VALUES (0, 3, true, "THEY PUT THE EGGS IN THE PEANUT BUTTER", '2026-2-5', "Sunco Foods Inc", "Nevada", 5000, 2000, "salmonella, peanut", "CLASS I");

INSERT INTO Recall (recall_id, product_id, is_active, description, date, company, regions, amount_sick, amount_dead, product_keywords, classification)
VALUES (1, 6, false, "Cheese was not grated enough, too course, may be a choking hazard", '2025-4-1', "Wal-mart Stores, Inc.", "Alaska", 1, 0, "choking, dairy", "CLASS III");



INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (0, 1, 4, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (1, 3, 4, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (2, 0, 2, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (3, 1, 2, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (4, 6, 2, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (5, 2, 5, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (6, 5, 5, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (7, 0, 1, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (8, 4, 1, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (9, 6, 1, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (10, 1, 6, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (11, 2, 6, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (12, 5, 6, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (13, 3, 3, '2026-2-1', 1.50);

INSERT INTO InventoryItem (item_id, product_id, user_id, date_added, price)
VALUES (14, 3, 3, '2026-2-3', 1.50);

