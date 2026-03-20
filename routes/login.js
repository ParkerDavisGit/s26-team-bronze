const express = require("express");
const router = express.Router();
const prisma = require('../db'); 

router.get('/', (req, res) =>{
    res.render("login", { title: "Log In" });
});

router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.users.findFirst({
            where: { email: email }
        });

        if (!user) {
            return res.render("login", { title: "Log In", error: "User not found. Please try again." });
        }

        if (user.password !== password) {
            return res.render("login", { title: "Log In", error: "Incorrect password." });
        }

        // Store user ID in session
        req.session.userId = user.user_id;

        console.log("Login successful for:", user.email);
        res.redirect('/');

    } catch (error) {
        console.error("Login Error:", error);
        res.render("login", { title: "Log In", error: "An internal server error occurred." });
    }
});

module.exports = router;