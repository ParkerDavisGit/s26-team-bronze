const express = require("express");
const router = express.Router();
const prisma = require('../db'); 
const NotificationService = require('../services/notificationService');
const RecallMonitorService = require("../services/recallMonitorService");
const FDARecallService = require("../services/fdaRecallService");

router.get('/', (req, res) =>{
    const success = req.query.success === 'true';
    res.render("admin", { title: "Admin Panel", error: null, success: success });
});

router.post('/', async (req, res) => {
    try {
        // Store user ID in session
        //req.session.userId = user.user_id;
        const { recall } = req.body;

        let recallService = new FDARecallService();
        let recallDictionary = JSON.parse(recall);

        let parsedRecall = {
            classification: recallDictionary.classification,
            reason_for_recall: recallDictionary.reason_for_recall || 'No description provided',
            recall_date: recallService.parseDate(recallDictionary.recall_initiation_date || recallDictionary.report_date),
            report_date: recallService.parseDate(recallDictionary.report_date),
            recall_number: recallDictionary.recall_number || null,
            company: recallDictionary.recalling_firm,
            regions: recallDictionary.state ? [recallDictionary.state] : [],
            productDescription: recallDictionary.product_description,
            isActive: true,
            amountSick: 0,
            amountDead: 0,
            productKeywords: recallService.extractKeywords(recallDictionary.product_description, recallDictionary.reason_for_recall),
            extractedUPCs: recallService.extractUPCs(recallDictionary.product_description),
            recallingFirm: recallDictionary.recalling_firm
        };

        let productId = await recallService.findMatchingProduct(parsedRecall);
        console.log(productId);

        const newRecall = await prisma.recalls.create({
            data: {
                product_id: productId,
                is_active: parsedRecall.isActive,
                reason_for_recall: parsedRecall.reason_for_recall,
                recall_date: parsedRecall.recall_date,
                report_date: parsedRecall.report_date,
                recall_number: parsedRecall.recall_number,
                company: parsedRecall.company,
                regions: parsedRecall.regions.join(', '),
                amount_sick: parsedRecall.amountSick,
                amount_dead: parsedRecall.amountDead,
                product_keywords: parsedRecall.productKeywords,
                classification: parsedRecall.classification
            }
        });

        console.log(parsedRecall);

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