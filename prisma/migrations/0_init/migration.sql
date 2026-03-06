-- CreateTable
CREATE TABLE "InventoryItems" (
    "item_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date_added" DATETIME NOT NULL,
    "price" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Products" (
    "product_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "upc" BIGINT NOT NULL,
    "product_name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "image_link" TEXT
);

-- CreateTable
CREATE TABLE "Recalls" (
    "recall_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_id" INTEGER NOT NULL,
    "is_active" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "company" TEXT NOT NULL,
    "regions" TEXT NOT NULL,
    "amount_sick" INTEGER NOT NULL,
    "amount_dead" INTEGER NOT NULL,
    "product_keywords" TEXT NOT NULL,
    "classification" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Users" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "has_premium" INTEGER NOT NULL,
    "free_scans_left" INTEGER
);

