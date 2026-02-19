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
    connection.query(`SELECT 
                        recall.recall_id,
                        recall.description,
                        DATE_FORMAT(recall.date, '%Y-%m-%d') AS recall_date,
                        recall.company,
                        recall.regions,
                        recall.amount_sick,
                        recall.amount_dead,
                        recall.classification,
                        product.product_name
                        FROM recall
                        JOIN product
                        ON product.product_id = recall.product_id
                        ORDER BY recall.date DESC`,
                        function (error, results, fields) {
        if (error != null) { console.log(error);
            return res.status(500).send("Database error");
        }

        return res.render("recalls", {
            title: "Recalls",
            recall_data: results
        });
    });
});

module.exports = router;