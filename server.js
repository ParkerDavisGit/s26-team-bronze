// Import Express
var express = require('express');
var indexRouter = require("./routes/index.js");
var recallsRouter = require("./routes/recalls.js");
var pantryRouter = require("./routes/pantry.js");
var settingsRouter = require("./routes/settings.js");

var app = express();
app.set('views', 'views');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));

app.use('/', indexRouter);
app.use('/recalls', recallsRouter);
app.use('/pantry', pantryRouter);
app.use('/settings', settingsRouter);


// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

/*
//MySQL Test
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
*/
