const express = require("express");
const router = express.Router();
const prisma = require('../db'); 
const NotificationService = require('../services/notificationService');
const RecallMonitorService = require("../services/recallMonitorService");

router.get('/', (req, res) =>{
    const success = req.query.success === 'true';
    res.render("admin", { title: "Admin Panel", error: null, success: success });
});

router.post('/', async (req, res) => {
    try {
        // Store user ID in session
        //req.session.userId = user.user_id;

        const newRecall = await prisma.recalls.create({
            data: {
                product_id: 26,
                is_active: true,
                description: "Product has Salmonella contamination",
                recall_date: "2026-04-29T04:00:00.000+00:00",
                company: "Birds Eye Voila!",
                regions: "Country Wide",
                amount_sick: 43,
                amount_dead: 2,
                product_keywords: "Salmonella",
                classification: "I"
            }
        });

        const newRecalls = [];
        newRecalls.push(newRecall);
        const notificationService = new NotificationService();
        notificationService.processRecallNotifications(newRecalls);
        res.redirect('/');

    } catch (error) {
        console.error("Login Error:", error);
        res.render("login", { title: "Log In", error: "An internal server error occurred." });
    }
});

module.exports = router;