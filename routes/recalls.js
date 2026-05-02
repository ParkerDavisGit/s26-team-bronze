const express = require("express");
const router = express.Router();
const prisma = require('../db');
const FDARecallService = require('../services/fdaRecallService');

router.get('/', async (req, res) => {
  try {
    const isLoggedIn = !!req.session.userId;

    let regionFilter = null;
    if (isLoggedIn) {
      const user = await prisma.users.findUnique({ where: { user_id: req.session.userId }, select: { region_filter: true } });
      regionFilter = user?.region_filter || null;
    }

    const whereClause = regionFilter ? { regions: { contains: regionFilter } } : {};

    const allRecalls = await prisma.recalls.findMany({
      where: whereClause,
      include: { product: true },
      orderBy: { recall_date: 'desc' }
    });

    let pantryProductIds = new Set();
    if (isLoggedIn) {
      const pantryItems = await prisma.inventoryItems.findMany({
        where: { user_id: req.session.userId },
        select: { product_id: true }
      });
      pantryProductIds = new Set(pantryItems.map(i => i.product_id));
    }

    const mostRecent = allRecalls.length > 0 ? (allRecalls[0].recall_date || allRecalls[0].date) : null;

    res.render('recalls', {
      title: 'Recalls',
      recall_data: allRecalls,
      pantryProductIds: [...pantryProductIds],
      isLoggedIn: isLoggedIn,
      mostRecentDate: mostRecent ? new Date(mostRecent).toLocaleDateString() : 'N/A',
      totalRecalls: allRecalls.length,
      regionFilter
    });
    
  } catch (error) {
    console.error("Database error:", error);
    res.render('recalls', { title: 'Recalls Error', recall_data: [], isLoggedIn: false, pantryProductIds: [], mostRecentDate: 'N/A', totalRecalls: 0, regionFilter: null });
  }
});

router.post('/refresh', async (req, res) => {
    try {
        const days = parseInt(req.body.days) || 30;
        const fdaService = new FDARecallService();
        const newRecalls = await fdaService.checkForNewRecalls(days);
        res.json({ success: true, added: newRecalls.length, days });
    } catch (error) {
        console.error('Error refreshing recalls:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch from FDA API' });
    }
});

router.post('/clear', async (req, res) => {
    try {
        const { count } = await prisma.recalls.deleteMany();
        res.json({ success: true, deleted: count });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to clear recalls' });
    }
});

module.exports = router;