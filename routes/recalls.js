var express = require("express");
var router = express.Router();

router.get("/", (req, res) =>{
    res.render("recalls", {title: "Recalls"});
});

module.exports = router;