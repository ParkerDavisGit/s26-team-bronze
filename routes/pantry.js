var express = require("express");
var mysql = require('mysql');
var router = express.Router();

const connection = mysql.createConnection({
    host: 'localhost',     // host for connection
    port: 3306,            // default port for mysql is 3306
    database: 'spoiler_alert',      // database from which we want to connect our node application
    user: 'bronzeimus-prime',          // username of the mysql connection
    password: 'zmuf8r94111'       // password of the mysql connection
});

router.get("/", (req, res) =>{
    connection.query("SELECT upc, product_name, brand FROM product", function (error, results, fields) {
        if (error != null) { console.log(error);
            return res.status(500).send("Database error");
        }

        return res.render("pantry", {
            title: "Pantry",
            food_data: results
        });
    });

    
});

module.exports = router;