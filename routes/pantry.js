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

        const perPage = 3;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * perPage;

        const totalProducts = await prisma.inventoryItems.count({
            where: {
                user_id: req.session.userId
            }
        });
        const totalPages = Math.ceil(totalProducts / perPage);

        const results = await prisma.$queryRaw`
            SELECT 
                p.product_id,
                p.upc, 
                p.product_name, 
                p.brand,
                r.recall_id,
                r.description,
                DATE(r.date) AS recall_date,
                r.company,
                r.regions,
                r.amount_sick,
                r.amount_dead,
                r.classification
            FROM products AS p
            LEFT JOIN recalls AS r
              ON p.product_id = r.product_id
            INNER JOIN InventoryItems as i
              ON p.product_id = i.product_id
            WHERE i.user_id = ${req.session.userId}
            LIMIT ${perPage} OFFSET ${offset}
        `;

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
router.post("/", async (req, res) => {
    try {
        const { upc } = req.body;

        const lastItem = await prisma.inventoryItems.findFirst({
            orderBy: { item_id: 'desc' }
        });

        const nextItemId = lastItem ? lastItem.item_id + 1 : 1;

        const existingProducts = await prisma.products.findFirst({
            where: { upc: upc },
        });

        if (Object.keys(existingProducts).length < 2) {
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

module.exports = router;