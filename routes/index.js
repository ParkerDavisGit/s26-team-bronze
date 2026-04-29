const express = require("express");
const router = express.Router();
const prisma = require('../db');
const { getRecallCountSince, getRecallCountAllTime } = require('../services/fdaClient');

router.get("/", async (req, res) => {
    if (!req.session.userId && !req.session.isGuest) return res.redirect('/login');

    try {
        const isLoggedIn = !!req.session.userId;
        let firstName = null;

if (isLoggedIn) {
    const user = await prisma.users.findUnique({
        where: { user_id: req.session.userId }
    });

    firstName = user ? user.first_name : null;
}

        const perPage = 3;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * perPage;

        const totalRecalls = await prisma.recalls.count();
        const totalPages = Math.ceil(totalRecalls / perPage);

        const now = new Date();
        const [recallsPastMonth, recallsPast3Months, recallsPastYear, recallsAllTime] = await Promise.all([
            getRecallCountSince(new Date(now - 30 * 24 * 60 * 60 * 1000)).catch(() => 0),
            getRecallCountSince(new Date(now - 90 * 24 * 60 * 60 * 1000)).catch(() => 0),
            getRecallCountSince(new Date(now - 365 * 24 * 60 * 60 * 1000)).catch(() => 0),
            getRecallCountAllTime().catch(() => 0),
        ]);

        const userPantryRecalls = isLoggedIn ? await prisma.inventoryItems.count({
            where: { user_id: req.session.userId, product: { recalls: { some: { is_active: true } } } }
        }) : 0;

        const results = await prisma.$queryRaw`
            SELECT
                r.recall_id,
                r.description,
                DATE(r.recall_date) AS recall_date,
                r.company,
                r.regions,
                r.amount_sick,
                r.amount_dead,
                r.classification,
                p.product_name
            FROM recalls AS r
            JOIN products AS p
              ON p.product_id = r.product_id
            ORDER BY r.recall_date DESC
            LIMIT ${perPage} OFFSET ${offset}
        `;

        return res.render("index", {
            title: "Home",
            recall_data: results,
            currentPage: page,
            totalPages: totalPages,
            isLoggedIn: isLoggedIn,
            firstName: firstName,
            recallsPastMonth,
            recallsPast3Months,
            recallsPastYear,
            recallsAllTime,
            userPantryRecalls
        });

    } catch (error) {
        console.error("Database query failed:", error);
        return res.status(500).send("Database error");
    }
});

module.exports = router;
