const express = require("express");
const router = express.Router();
const prisma = require('../db'); 

router.get('/', async (req, res) => {
  try {
        const isLoggedIn = req.session.userId ? true : false;
        
        const perPage = 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * perPage;

        const totalRecalls = await prisma.recalls.count();
        const totalPages = Math.ceil(totalRecalls / perPage);

        const results = await prisma.$queryRaw`
            SELECT 
                r.recall_id,
                r.description,
                DATE(r.date) AS recall_date, 
                r.company,
                r.regions,
                r.amount_sick,
                r.amount_dead,
                r.classification,
                p.product_name
            FROM recalls AS r
            JOIN products AS p 
              ON p.product_id = r.product_id
            ORDER BY r.date DESC
            LIMIT ${perPage} OFFSET ${offset}
        `;

        return res.render("recalls", {
            title: "Recalls",
            recall_data: results,
            currentPage: page,
            totalPages: totalPages,
            isLoggedIn: isLoggedIn
        });
    
  } catch (error) {
    console.error("Database error:", error);
    res.render('recalls', { title: 'Recalls Error', recall_data: [], isLoggedIn: false });
  }
});

module.exports = router;