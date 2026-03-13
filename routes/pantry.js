const express = require("express");
const router = express.Router();
const prisma = require('../db'); 

router.get("/", async (req, res) => {
    try {
        const perPage = 3;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * perPage;

        const totalProducts = await prisma.products.count();
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
            LIMIT ${perPage} OFFSET ${offset}
        `;

        return res.render("pantry", {
            title: "Pantry",
            food_data: results,
            currentPage: page,
            totalPages: totalPages
        });

    } catch (error) {
        console.error("Database query failed:", error);
        return res.status(500).send("Database error");
    }
});

module.exports = router;