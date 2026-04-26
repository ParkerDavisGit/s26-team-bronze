const express = require("express");
const router = express.Router();
const prisma = require('../db');

async function checkFDARecalls(upc, productId) {
    const res = await fetch(`https://api.fda.gov/food/enforcement.json?search=product_description:%22${upc}%22&limit=10`);
    const { results = [] } = await res.json();

    let count = 0;
    for (const r of results) {
        const exists = await prisma.recalls.findFirst({
            where: { description: r.reason_for_recall, company: r.recalling_firm }
        });
        if (exists) continue;

        const year = r.report_date.substring(0, 4);
        const month = r.report_date.substring(4, 6);
        const day = r.report_date.substring(6, 8);

        await prisma.recalls.create({
            data: {
                product_id: productId,
                is_active: true,
                description: r.reason_for_recall || 'No description provided',
                recall_date: new Date(`${year}-${month}-${day}`),
                company: r.recalling_firm,
                regions: r.state || '',
                amount_sick: 0,
                amount_dead: 0,
                product_keywords: '',
                classification: r.classification || ''
            }
        });
        count++;
    }
    return count;
}

router.get("/", async (req, res) => {
    try {
        const isLoggedIn = !!req.session.userId;
        
        if (!isLoggedIn) {
            return res.render("pantry", {
                title: "Pantry",
                food_data: [],
                currentPage: 1,
                totalPages: 1,
                isLoggedIn: false,
                searchQuery: "",
                error: ""
            });
        }

        const perPage = 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * perPage;
        const searchQuery = req.query.search || "";

        // Build where clause for searching
        let whereClause = {
            user_id: req.session.userId
        };

        // If search query exists, add filter for product name or brand
        if (searchQuery.trim()) {
            whereClause.AND = [
                {
                    product: {
                        OR: [
                            { product_name: { contains: searchQuery } },
                            { brand: { contains: searchQuery } }
                        ]
                    }
                }
            ];
        }

        const totalProducts = await prisma.inventoryItems.count({
            where: whereClause
        });
        const totalPages = Math.ceil(totalProducts / perPage);
        const results = await prisma.inventoryItems.findMany({
            select: {
                item_id: true,
                product: {
                    select: {
                        product_id: true,
                        upc: true,
                        product_name: true,
                        brand: true,
                        recalls: {
                            select: {
                                recall_id: true,
                                description: true,
                                recall_date: true,
                                company: true,
                                regions: true,
                                amount_sick: true,
                                amount_dead: true,
                                classification: true
                            }
                        }
                    }
                },
            },
            where: whereClause,
            orderBy: {
                item_id: "desc"
            },
            take: perPage,
            skip: offset
        });

        console.log(results);
        console.log("\n\n")
        //console.log(old_results)

        const errorMessage = req.session.errorMessage || '';
        delete req.session.errorMessage; // Clear after displaying

        return res.render("pantry", {
            title: "Pantry",
            food_data: results,
            currentPage: page,
            totalPages: totalPages,
            isLoggedIn: true,
            searchQuery: searchQuery,
            error: errorMessage
        });

    } catch (error) {
        console.error("Database query failed:", error);
        return res.status(500).send("Database error");
    }
});


// Adding an item to the pantry with Open Food Facts API integration
router.post("/add", async (req, res) => {
    try {
        const { upc } = req.body;

        // 1. Check if the product already exists in the local database
        let existingProduct = await prisma.products.findFirst({
            where: { upc: String(upc) },
        });

        // 2. If not, fetch it from the API
        if (!existingProduct) {
            console.log("Product not in local DB. Fetching from external API...", upc);
            
            const apiUrl = `https://world.openfoodfacts.net/api/v2/product/${upc}.json`;
            const response = await fetch(apiUrl);
            const apiData = await response.json();

            // Status 1 means the product was found in the external database
            if (apiData.status === 1) {
                // Extract product details, provide fallback strings if null
                const newProductName = apiData.product.product_name || "Unknown Product";
                const newBrand = apiData.product.brands || "Unknown Brand";

                // Manually calculate the next product_id (Auto-increment workaround)
                const lastProduct = await prisma.products.findFirst({
                    orderBy: { product_id: 'desc' }
                });
                const nextProductId = lastProduct ? lastProduct.product_id + 1 : 1;

                // Save this new product to the local Products table
                existingProduct = await prisma.products.create({
                    data: {
                        product_id: nextProductId,
                        upc: String(upc),
                        product_name: newProductName,
                        brand: newBrand
                    }
                });
                
                console.log("New product successfully saved to local database!");
            } else {
                // Product not found in external API either
                console.log("Product not found in API. Adding failed for UPC:", upc);
                req.session.errorMessage = 'Product not found - try a different UPC';
                return res.redirect('/pantry');
            }
        }

        // 3. Add the product to the user's Pantry
        const lastItem = await prisma.inventoryItems.findFirst({
            orderBy: { item_id: 'desc' }
        });
        const nextItemId = lastItem ? lastItem.item_id + 1 : 1;
        
        await prisma.inventoryItems.create({
            data: {
                item_id: nextItemId,
                product_id: existingProduct.product_id,
                user_id: req.session.userId,
                price: 0.0
            }
        });

        const recallCount = await checkFDARecalls(upc, existingProduct.product_id);
        if (recallCount > 0) {
            req.session.errorMessage = `⚠️ RECALL ALERT: The product you just added (${existingProduct.product_name}) has ${recallCount} active recall${recallCount > 1 ? 's' : ''}. Please check your pantry for details.`;
        }

        console.log("New item added to pantry successfully:", upc);
        res.redirect('/pantry');

    } catch (error) {
        console.error("Add to Pantry Error:", error);
        res.redirect('/pantry');
    }
});

// Removing an item from the pantry
router.post("/remove", async (req, res) => {
    try {
        const { item_id } = req.body;

        if (!item_id) {
            console.error("No item_id provided for removal.");
            return res.redirect('/pantry');
        }

        await prisma.inventoryItems.delete({
            where: {
                item_id: parseInt(item_id)
            }
        });

        console.log("Item removed successfully:", item_id);

        res.redirect('/pantry');

    } catch (error) {
        console.error("Error removing item:", error);
        req.session.errorMessage = 'Failed to remove item - please try again';
        res.redirect('/pantry');
    }
});

module.exports = router;