require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./db');

const app = express();
app.set('view engine', 'ejs');
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MySQLStore(db.config),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('welcome');
});

app.get('/favicon.ico', (req, res) => res.redirect('/logo.svg'));
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/dashboard'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Running on port ' + PORT));