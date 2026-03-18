const express = require('express');

// import the routes
const indexRoutes = require('./routes/index');
const pantryRoutes = require('./routes/pantry');
const recallsRoutes = require('./routes/recalls');
const settingsRoutes = require('./routes/settings');
const usersRoutes = require('./routes/users');
const loginRoutes = require('./routes/login');
const registerRoutes = require('./routes/register');
const session = require('express-session');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// define the home route
// app.get('/', (req, res) => {
//   res.render('index', { title: 'Home' });
// });

// use the routes
app.use('/', indexRoutes); // this is the first page
app.use('/pantry', pantryRoutes);
app.use('/recalls', recallsRoutes);
app.use('/settings', settingsRoutes);
app.use('/users', usersRoutes);
app.use('/login', loginRoutes);
app.use('/register', registerRoutes);

//start the server
app.listen(PORT, () => {
  console.log(`Server ready at: http://localhost:${PORT}`);
});