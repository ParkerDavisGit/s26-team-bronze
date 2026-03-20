const express = require("express");
const router = express.Router();
const prisma = require('../db'); 

router.get('/', (req, res) => {
    res.render("register", { title: "Register" });
});

router.post('/', async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;

        // 1. Check if the email already exists in the database
        const existingUser = await prisma.users.findFirst({
            where: { email: email }
        });

        if (existingUser) {
            // Return error if email is already registered
            return res.render("register", { 
                title: "Register", 
                error: "This email is already registered. Please log in." 
            });
        }

        // 2. Calculate the next available user_id
        const lastUser = await prisma.users.findFirst({
            orderBy: { user_id: 'desc' }
        });

        // Add 1 to the highest ID
        const nextUserId = lastUser ? lastUser.user_id + 1 : 1;

        // 3. Create new user 
        const newUser = await prisma.users.create({
            data: {
                user_id: nextUserId,
                first_name: first_name,
                last_name: last_name,
                email: email,
                password: password,
                has_premium: 0,
                free_scans_left: 5 
            }
        });

        console.log("New user registered successfully:", newUser.email);

        // 4. Redirect to login page after successful registration
        res.redirect('/login');

    } catch (error) {
        console.error("Registration Error:", error);
        res.render("register", { 
            title: "Register", 
            error: "An error occurred during registration. Please try again." 
        });
    }
});

module.exports = router;