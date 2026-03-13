const express = require("express");
const router = express.Router();

const prisma = require('../db'); 

router.get('/', async (req, res) => {
  try {
    const allRecalls = await prisma.recalls.findMany();

    res.render('recalls', { 
      title: 'Recalls',
      recall_data: allRecalls 
    });
    
  } catch (error) {
    console.error("Database error:", error);
    
    res.render('recalls', { 
      title: 'Recalls Error',
      recall_data: [] 
    });
  }
});

module.exports = router;