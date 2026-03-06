var express = require("express");
var router = express.Router();

router.get("/", (req, res) =>{
    res.render("login", {title: "Log In"});
});

module.exports = router;