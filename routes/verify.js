const express = require('express');
const prisma = require('../db'); 

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // 1. Extract the token from the URL query string 
        const { token } = req.query;

        if (!token) {
            return res.render("login", { 
                title: "Log In", 
                error: "Invalid or missing verification token." 
            });
        }

        // 2. Find the user with this exact token in the database
        const user = await prisma.users.findFirst({
            where: { verification_token: token }
        });

        // 3. If no user is found, the token is invalid or already used
        if (!user) {
            return res.render("login", { 
                title: "Log In", 
                error: "Invalid or expired verification link. Please register again or log in." 
            });
        }

        // 4. Update the user's status to verified and clear the token
        await prisma.users.update({
            where: { user_id: user.user_id },
            data: {
                is_verified: true,
                verification_token: null
            }
        });

        console.log("User successfully verified:", user.email);

        // 5. Render the login page with a success message 
        res.render("login", { 
            title: "Log In", 
            success: "Email verified successfully! You can now log in."
        });

    } catch (error) {
        console.error("Verification Error:", error);
        res.render("login", { 
            title: "Log In", 
            error: "An internal server error occurred during verification." 
        });
    }
});

module.exports = router;