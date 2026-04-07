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


// Adding an item to the pantry
router.post("/add", async (req, res) => {
    try {
        const { upc } = req.body;

        const lastItem = await prisma.inventoryItems.findFirst({
            orderBy: { item_id: 'desc' }
        });

        const nextItemId = lastItem ? lastItem.item_id + 1 : 1;

        const existingProducts = await prisma.products.findFirst({
            where: { upc: upc },
        });

        if (!existingProducts) {
            console.log("New item failed to add: ", upc);

            res.redirect('/pantry');

            return;
        }

        console.log(existingProducts);
        
        const itemToSave = await prisma.inventoryItems.create({
            data: {
                item_id: nextItemId,
                product_id: existingProducts["product_id"],
                user_id: req.session.userId,
                price: 0.0
            }
        });

        console.log("New item added successfully:", upc);

        res.redirect('/pantry');
    } catch (error) {
        console.error("Login Error:", error);
        // Should have an onscreen error here
        //res.render("login", { title: "Log In", error: "An internal server error occurred." });
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