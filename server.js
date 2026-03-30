const express = require('express');

// import the routes
const indexRoutes = require('./routes/index');
const pantryRoutes = require('./routes/pantry');
const recallsRoutes = require('./routes/recalls');
const settingsRoutes = require('./routes/settings');
const loginRoutes = require('./routes/login');
const registerRoutes = require('./routes/register');
const session = require('express-session');
const verifyRouter = require('./routes/verify');

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

// use the routes
app.use('/', indexRoutes); // this is the first page
app.use('/pantry', pantryRoutes);
app.use('/recalls', recallsRoutes);
app.use('/settings', settingsRoutes);
app.use('/login', loginRoutes);
app.use('/register', registerRoutes);
app.use('/verify', verifyRouter);

// Route to handle user logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        }
        res.redirect('/');
    });
});

//start the server
app.listen(PORT, () => {
  console.log(`Server ready at: http://localhost:${PORT}`);
});