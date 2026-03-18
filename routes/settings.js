var express = require("express");
var router = express.Router();

router.get('/', (req, res) => {
  const isLoggedIn = req.session.userId ? true : false;

  res.render('settings', {
    title: 'Settings',
    isLoggedIn: isLoggedIn
  });
});

module.exports = router;