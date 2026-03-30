const express = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const transporter = require('../utils/mailer');

const router = express.Router();

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
            return res.render("register", { 
                title: "Register", 
                error: "This email is already registered. Please log in." 
            });
        }

        // 2. Calculate the next available user_id
        const lastUser = await prisma.users.findFirst({
            orderBy: { user_id: 'desc' }
        });
        const nextUserId = lastUser ? lastUser.user_id + 1 : 1;

        // 3. Generate a random 32-byte verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // 4. Create the new user in the database
        const newUser = await prisma.users.create({
            data: {
                user_id: nextUserId,
                first_name: first_name,
                last_name: last_name,
                email: email,
                password: password,
                has_premium: 0,
                free_scans_left: 5,
                is_verified: false,               // Set default verification status to false
                verification_token: verificationToken // Store the generated token
            }
        });

        // 5. Assemble and send the verification email
        // Note: Ensure localhost:3000 matches your local development port
        const verifyUrl = `http://localhost:3000/verify?token=${verificationToken}`;
        
        const mailOptions = {
            from: '"Spoiler Alert" <noreply@spoileralert.com>', // Sender display name and address
            to: email, // The email address the user just registered with
            subject: 'Verify your email address - Spoiler Alert',
            html: `
                <h2>Welcome to Spoiler Alert, ${first_name}!</h2>
                <p>Please click the button below to verify your email address and activate your account:</p>
                <a href="${verifyUrl}" style="background-color: #EAA221; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email</a>
                <p><br>Or copy and paste this link into your browser:</p>
                <p><a href="${verifyUrl}">${verifyUrl}</a></p>
            `
        };

        // Execute the email sending process
        await transporter.sendMail(mailOptions);
        console.log("New user registered and verification email sent to:", newUser.email);

        console.log("[DEV MODE] Verification Link:", verifyUrl);

        // 6. Redirect to the login page upon successful registration
        res.redirect('/login?registered=true');

    } catch (error) {
        console.error("Registration Error:", error);
        res.render("register", { 
            title: "Register", 
            error: "An error occurred during registration. Please try again." 
        });
    }
});

module.exports = router;