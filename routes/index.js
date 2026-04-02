const express = require("express");
const router = express.Router();

const prisma = require('../db'); 

router.get("/", async (req, res) => {
    try {
    // Check if the session has a userId
    const isLoggedIn = req.session.userId ? true : false;

    res.render('index', { 
      title: 'Home',
      isLoggedIn: isLoggedIn  // Pass this boolean to the frontend
    });
    
  } catch (error) {
    console.error("Database error:", error);
    res.render('index', { title: 'Error', isLoggedIn: false });
  }
});

module.exports = router;