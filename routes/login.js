const express = require("express");
const router = express.Router();
const prisma = require('../db'); 

router.get('/', (req, res) =>{
    const success = req.query.success === 'true';
    res.render("login", { title: "Log In", error: null, success: success });
});

router.get('/guest', (req, res) => {
    req.session.isGuest = true;
    res.redirect('/');
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

        // If the user's email is not verified, block the login
        if (!user.is_verified) {
            return res.render("login", { title: "Log In", error: "Please verify your email address before logging in." });
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