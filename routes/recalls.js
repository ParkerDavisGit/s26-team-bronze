const express = require("express");
const router = express.Router();
const prisma = require('../db'); 

router.get('/', async (req, res) => {
  try {
    const allRecalls = await prisma.recalls.findMany({
  include: {
    product: true
  },
  orderBy: {
    recall_date: 'desc'
  }
});
    
    // Check if the session has a userId
    const isLoggedIn = req.session.userId ? true : false;

    let pantryProductIds = new Set();
    if (isLoggedIn) {
      const pantryItems = await prisma.inventoryItems.findMany({
        where: { user_id: req.session.userId },
        select: { product_id: true }
      });
      pantryProductIds = new Set(pantryItems.map(i => i.product_id));
    }

    res.render('recalls', {
      title: 'Recalls',
      recall_data: allRecalls,
      pantryProductIds: [...pantryProductIds],
      isLoggedIn: isLoggedIn
    });
    
  } catch (error) {
    console.error("Database error:", error);
    res.render('recalls', { title: 'Recalls Error', recall_data: [], isLoggedIn: false, pantryProductIds: [] });
  }
});

module.exports = router;