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
    const perPage = 3;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * perPage;

    connection.query("SELECT COUNT(*) AS total FROM product", function (error, countResult) {

    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / perPage);

        connection.query(`SELECT 
                            product.product_id,
                            product.upc, 
                            product.product_name, 
                            product.brand,
                            recall.recall_id,
                            recall.description,
                            DATE_FORMAT(recall.date, '%Y-%m-%d') AS recall_date,
                            recall.company,
                            recall.regions,
                            recall.amount_sick,
                            recall.amount_dead,
                            recall.classification
                            FROM product
                            LEFT JOIN recall
                            ON product.product_id = recall.product_id
                            LIMIT ${perPage} OFFSET ${offset}`, 
                            function (error, results, fields) {
                                if (error != null) { console.log(error);
                                return res.status(500).send("Database error");
                            }

            return res.render("pantry", {
                title: "Pantry",
                food_data: results,
                currentPage: page,
                totalPages: totalPages
            });
        });
    });
});

module.exports = router;