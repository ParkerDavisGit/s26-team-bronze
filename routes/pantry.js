const express = require("express");
const router = express.Router();
const prisma = require('../db'); 

router.get("/", async (req, res) => {
    try {
        const isLoggedIn = req.session.userId ? true : false;
        
        if (!isLoggedIn) {
            return res.render("pantry", {
                title: "Pantry",
                food_data: [],
                currentPage: 1,
                totalPages: 1,
                isLoggedIn: false
            });
        }

        const perPage = 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * perPage;

        const totalProducts = await prisma.inventoryItems.count({
            where: {
                user_id: req.session.userId
            }
        });
        const totalPages = Math.ceil(totalProducts / perPage);

        // const old_results = await prisma.$queryRaw`
        //     SELECT 
        //         i.item_id,
        //         p.product_id,
        //         p.upc, 
        //         p.product_name, 
        //         p.brand,
        //         r.recall_id,
        //         r.description,
        //         DATE(r.date) AS recall_date,
        //         r.company,
        //         r.regions,
        //         r.amount_sick,
        //         r.amount_dead,
        //         r.classification
        //     FROM products AS p
        //     LEFT JOIN recalls AS r
        //       ON p.product_id = r.product_id
        //     INNER JOIN InventoryItems as i
        //       ON p.product_id = i.product_id
        //     WHERE i.user_id = ${req.session.userId}
        //     ORDER BY i.item_id DESC
        //     LIMIT ${perPage} OFFSET ${offset}
        // `;

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
                                date: true,
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
            where: {
                user_id: req.session.userId
            },
            orderBy: {
                item_id: "desc"
            },
            take: perPage,
            skip: offset
        });

        console.log(results);
        console.log("\n\n")
        //console.log(old_results)

        return res.render("pantry", {
            title: "Pantry",
            food_data: results,
            currentPage: page,
            totalPages: totalPages,
            isLoggedIn: true
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
            where: { upc: upc },
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
                        upc: upc,
                        product_name: newProductName,
                        brand: newBrand
                    }
                });
                
                console.log("New product successfully saved to local database!");
            } else {
                // Product not found in external API either
                console.log("Product not found in API. Adding failed for UPC:", upc);
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
        // Should have an onscreen error here
        //res.render("login", { title: "Log In", error: "An internal server error occurred." });
    }
});

module.exports = router;