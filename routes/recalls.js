const express = require("express");
const router = express.Router();
const prisma = require('../db'); 

router.get('/', async (req, res) => {
  try {
    const allRecalls = await prisma.recalls.findMany();
    
    // Check if the session has a userId
    const isLoggedIn = req.session.userId ? true : false;

    res.render('recalls', { 
      title: 'Recalls',
      recall_data: allRecalls,
      isLoggedIn: isLoggedIn  // Pass this boolean to the frontend
    });
    
  } catch (error) {
    console.error("Database error:", error);
    res.render('recalls', { title: 'Recalls Error', recall_data: [], isLoggedIn: false });
  }
});

module.exports = router;