var express = require("express");
var router = express.Router();
var mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',     // host for connection
    port: 3306,            // default port for mysql is 3306
    database: 'spoiler_alert',      // database from which we want to connect our node application
    user: 'bronzeimus-prime',          // username of the mysql connection
    password: 'zmuf8r94111'       // password of the mysql connection
});

router.get("/", (req, res) =>{
    const perPage = 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * perPage;

    connection.query("SELECT COUNT(*) AS total FROM recall", function (error, countResult) {

    const totalRecalls = countResult[0].total;
    const totalPages = Math.ceil(totalRecalls / perPage);

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
                            ORDER BY recall.date DESC
                            LIMIT ${perPage} OFFSET ${offset}`,
                            function (error, results, fields) {
                            if (error != null) { console.log(error);
                                return res.status(500).send("Database error");
                            }
        return res.render("index", {title: "Home",
                                    recall_data: results,
                                    currentPage: page,
                                    totalPages: totalPages
            });
        });
    });
});

module.exports = router;