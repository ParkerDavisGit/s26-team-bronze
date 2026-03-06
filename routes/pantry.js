var express = require("express");
var sqlite3 = require('sqlite3');
var router = express.Router();

const db = new sqlite3.Database('database/spoiler_alert.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
});

router.get("/", (req, res) =>{
    db.all("SELECT upc, product_name, brand FROM Products", [], (err, rows) => {
        if (err) return console.error(err.message);

        return res.render("pantry", {
            title: "Pantry",
            food_data: rows
        });
    });
});

module.exports = router;