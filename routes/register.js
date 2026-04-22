const express = require("express");
const router = express.Router();
const prisma = require('../db'); 
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

router.get('/', (req, res) => {
    res.render("register", { title: "Register" });
});

router.get('/verify', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.send("Invalid verification link.");
        }

        // Find the user with this specific token
        const user = await prisma.users.findFirst({
            where: { verification_token: token }
        });

        if (!user) {
            return res.send("Verification link expired or invalid.");
        }

        // Update user: Set verified to true and clear the token
        await prisma.users.update({
            where: { user_id: user.user_id },
            data: {
                is_verified: true,
                verification_token: null 
            }
        });

        console.log(`User ${user.email} verified successfully.`);
        
        // Redirect to login page after success
        res.redirect('/login');

    } catch (error) {
        console.error("Verification Route Error:", error);
        res.status(500).send("Internal Server Error during verification.");
    }
});

router.post('/', async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;

        const existingUser = await prisma.users.findFirst({
            where: { email: email }
        });

        if (existingUser) {
            return res.render("register", { title: "Register", error: "Email already registered." });
        }

        const lastUser = await prisma.users.findFirst({ orderBy: { user_id: 'desc' } });
        const nextUserId = lastUser ? lastUser.user_id + 1 : 1;

        // Generate a unique 64-character hex token
        const token = crypto.randomBytes(32).toString('hex');

        // Create user with the token and is_verified set to false
        const newUser = await prisma.users.create({
            data: {
                user_id: nextUserId,
                first_name: first_name,
                last_name: last_name,
                email: email,
                password: password,
                has_premium: false,
                free_scans_left: 5,
                verification_token: token,
                is_verified: false
            }
        });

        // Construct the verification link (adjust the domain for production)
        const verificationLink = `http://localhost:3000/register/verify?token=${token}`;

        const mailOptions = {
            from: `"Spoiler Alert Team" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify your Account - Spoiler Alert',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #332701;">One last step, ${first_name}!</h2>
                    <p>Please click the button below to verify your email address and activate your account:</p>
                    <a href="${verificationLink}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #EAA221; color: black; text-decoration: none; font-weight: bold; border-radius: 5px; margin: 20px 0;">
                       Verify My Email
                    </a>
                    <p style="font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link into your browser:<br>${verificationLink}</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.error("Mail Error:", error);
            else console.log("Verification link sent.");
        });

        // Redirect to login page with success message
        res.redirect('/login?success=true');

    } catch (error) {
        console.error("Registration Error:", error);
        res.render("register", { title: "Register", error: "An error occurred." });
    }
});

module.exports = router;