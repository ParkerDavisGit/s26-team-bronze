var express = require("express");
var router = express.Router();
const prisma = require('../db');

router.get('/', async (req, res) => {
    const isLoggedIn = !!req.session.userId;
    let user = null;

    if (isLoggedIn) {
        user = await prisma.users.findUnique({ where: { user_id: req.session.userId } });
    }

    res.render('settings', {
        title: 'Settings',
        isLoggedIn,
        user,
        success: req.query.success === '1'
    });
});

router.post('/', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');

    const { region_filter, notify_pantry_only } = req.body;

    await prisma.users.update({
        where: { user_id: req.session.userId },
        data: {
            region_filter: region_filter || null,
            notify_pantry_only: notify_pantry_only === 'on'
        }
    });

    res.redirect('/settings?success=1');
});

router.post('/delete', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');

    const userId = req.session.userId;

    await prisma.inventoryItems.deleteMany({ where: { user_id: userId } });
    await prisma.users.delete({ where: { user_id: userId } });

    req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
