const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

router.get('/register', (req, res) => res.render('register', { error: null }));

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (password.length < 6)
      return res.render('register', { error: 'Password must be at least 6 characters' });

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length)
      return res.render('register', { error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email.toLowerCase(), hash]
    );
    req.session.userId = result.insertId;
    req.session.name = name;
    res.redirect('/dashboard');
  } catch (e) {
    console.error(e);
    res.render('register', { error: 'Something went wrong' });
  }
});

router.get('/login', (req, res) => res.render('login', { error: null }));

router.post('/login', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [req.body.email.toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(req.body.password, user.password)))
      return res.render('login', { error: 'Invalid email or password' });
    req.session.userId = user.id;
    req.session.name = user.name;
    res.redirect('/dashboard');
  } catch (e) {
    console.error(e);
    res.render('login', { error: 'Something went wrong' });
  }
});
router.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));

module.exports = router;