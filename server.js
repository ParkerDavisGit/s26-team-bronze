const express = require('express');
const mysql = require('mysql');
const path = require('path');

const app = express();

// --- Configuration ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse POST request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' or 'static' folder
app.use(express.static(path.join(__dirname, 'static')));

// --- Database Connection ---
const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    database: 'spoiler_alert',
    user: 'bronzeimus-prime',
    password: 'zmuf8r94111'
});

connection.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database as id ' + connection.threadId);
});

// GET Route to show the form
app.get('/', (req, res) => {
    res.render('form_test', { title: 'Food Recall System' });
});

// POST Route to handle form submission with sequential ID
app.post('/add-user', (req, res) => {
    const { fname, lname } = req.body;
    
    // 1. Find the current maximum user_id in the table
    const findMaxIdSql = "SELECT MAX(user_id) AS max_id FROM User";
    
    connection.query(findMaxIdSql, (err, results) => {
        if (err) {
            console.error("Error finding max ID: ", err);
            return res.status(500).send("Database Error");
        }

        // Step 2: Calculate the next ID. If table is empty, start at 0.
        const maxId = results[0].max_id;
        const nextId = (maxId !== null) ? maxId + 1 : 0;
        
        const email = `${fname}.${lname}@gmail.com`;
        const sql = "INSERT INTO User (user_id, first_name, last_name, email, password, has_premium) VALUES (?, ?, ?, ?, 'default123', 0)";

        // Step 3: Insert the new user with the calculated nextId
        connection.query(sql, [nextId, fname, lname, email], (insertErr, result) => {
            if (insertErr) {
                console.error("Insert failed: ", insertErr);
                return res.status(500).send("Database Error during insertion");
            }
            console.log(`Successfully added!`);
            res.send(`Successfully added: ${fname} ${lname} with User ID: ${nextId}`);
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});