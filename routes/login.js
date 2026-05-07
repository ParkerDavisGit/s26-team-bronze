const express = require("express");
const router = express.Router();
const prisma = require('../db');
const crypto = require('crypto');
const NotificationService = require('../services/notificationService');
const notificationService = new NotificationService();

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

        if (!user || user.password !== password) {
            return res.render("login", {
                title: "Log In",
                error: " Incorrect email or password.  Please try again."
            })
        };

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

router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { title: 'Forgot Password', error: null, success: null });
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = await prisma.users.findFirst({ where: { email: email.trim().toLowerCase() } });

    if (!user) {
        return res.render('forgot-password', { title: 'Forgot Password', error: null, success: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.users.update({
        where: { user_id: user.user_id },
        data: { reset_token: token, reset_token_expires: expires }
    });

    const resetLink = `http://localhost:3000/login/reset-password/${token}`;
    await notificationService.transporter.sendMail({
        from: `"Spoiler Alert Team" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset - Spoiler Alert',
        html: `<p>Hi ${user.first_name},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, ignore this email.</p>`
    });

    res.render('forgot-password', { title: 'Forgot Password', error: null, success: 'If that email exists, a reset link has been sent.' });
});

router.get('/reset-password/:token', async (req, res) => {
    const user = await prisma.users.findFirst({
        where: { reset_token: req.params.token, reset_token_expires: { gt: new Date() } }
    });

    if (!user) return res.render('reset-password', { title: 'Reset Password', error: 'Reset link is invalid or has expired.', token: null });
    res.render('reset-password', { title: 'Reset Password', error: null, token: req.params.token });
});

router.post('/reset-password/:token', async (req, res) => {
    const { password } = req.body;
    const user = await prisma.users.findFirst({
        where: { reset_token: req.params.token, reset_token_expires: { gt: new Date() } }
    });

    if (!user) return res.render('reset-password', { title: 'Reset Password', error: 'Reset link is invalid or has expired.', token: null });

    await prisma.users.update({
        where: { user_id: user.user_id },
        data: { password, reset_token: null, reset_token_expires: null }
    });

    res.redirect('/login?success=true');
});

module.exports = router;