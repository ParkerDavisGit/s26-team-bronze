var express = require("express");
var router = express.Router();

router.get("/", (req, res) =>{
    res.render("index", {title: "Express"});
});

router.get("/form-request", (req, res) =>{
    res.render("form_test", {title: "Express"});
});

module.exports = router;