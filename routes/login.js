const express = require("express");
const router = express.Router();
const prisma = require('../db'); 

router.get('/', (req, res) =>{
    res.render("login", { title: "Log In" });
});

router.post('/', async (req, res) => {
    try {
        let { email, password } = req.body;

        email = email.trin().toLowerCase();

        const user = await prisma.users.findFirst({
            where: { email: email }
        });

        if (!user || user.password !== password) {
            return res.render("login", {
                title: "Log In",
                error: "Incorrect email or password."
            });
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