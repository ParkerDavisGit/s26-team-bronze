// Import Express
const express = require('express');
const   mysql = require('mysql'); 

const app = express();
const dir_static = __dirname + "/static";

// Site pages
app.get('/', (req, res)=>{
    res.status(200);
    res.set('Content-Type', 'text/html');
    res.send("Welcome to root URL of Server");
});

app.get('/gello', (req, res)=>{
    const options = {
        root: dir_static
    };
    
    res.status(200);
    res.set('Content-Type', 'text/html');
    res.sendFile("gello.html", options);
});


// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});


// MySQL Test
// const connection = mysql.createConnection({
//     host: 'localhost',     // host for connection
//     port: 3306,            // default port for mysql is 3306
//     database: 'test_users',      // database from which we want to connect our node application
//     user: 'joe',          // username of the mysql connection
//     password: 'joemama'       // password of the mysql connection
// });

// connection.connect(function(err) {
//   if (err) throw err;
//   connection.query("SELECT name FROM cats", function (error, results, fields) {
//     if (error != null) { console.log(error); return; }
//     console.log(results);
//   });
// });
