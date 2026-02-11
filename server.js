// Import Express
const express = require('express');
const   mysql = require('mysql'); 

const app = express();
const dir_static = __dirname + "/static";

app.use(express.static(dir_static));

// Site Pages
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: dir_static });
});


// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});


// MySQL Test
const connection = mysql.createConnection({
    host: 'localhost',     // host for connection
    port: 3306,            // default port for mysql is 3306
    database: 'spoiler_alert',      // database from which we want to connect our node application
    user: 'bronzeimus-prime',          // username of the mysql connection
    password: 'zmuf8r94111'       // password of the mysql connection
});

connection.connect(function(err) {
  if (err) throw err;
  connection.query("SELECT * FROM user", function (error, results, fields) {
    if (error != null) { console.log(error); return; }
    console.log(results);
  });
});
