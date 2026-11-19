const router = require('express').Router();
const db = require('../db');

const requireLogin = (req, res, next) =>
  req.session.userId ? next() : res.redirect('/login');

router.use(requireLogin);

// READ: list visitors and feedback
router.get('/dashboard', async (req, res) => {
  const uid = req.session.userId;
  const [visitors] = await db.query('SELECT * FROM visitors WHERE user_id = ? ORDER BY time_in DESC', [uid]);
  const [feedbacks] = await db.query('SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC', [uid]);
  res.render('dashboard', { name: req.session.name, visitors, feedbacks, sent: req.query.sent });
});

// CREATE: check in a visitor
router.post('/visitors', async (req, res) => {
  const b = req.body;
  await db.query(
    'INSERT INTO visitors (user_id, full_name, id_number, phone, person_visited, purpose) VALUES (?, ?, ?, ?, ?, ?)',
    [req.session.userId, b.full_name, b.id_number, b.phone, b.person_visited, b.purpose]);
  res.redirect('/dashboard');
});

// UPDATE: edit details
router.get('/visitors/:id/edit', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM visitors WHERE id = ? AND user_id = ?',
    [req.params.id, req.session.userId]);
  if (!rows.length) return res.redirect('/dashboard');
  res.render('edit', { visitor: rows[0] });
});

router.post('/visitors/:id/edit', async (req, res) => {
  const b = req.body;
  await db.query(
    'UPDATE visitors SET full_name = ?, id_number = ?, phone = ?, person_visited = ?, purpose = ? WHERE id = ? AND user_id = ?',
    [b.full_name, b.id_number, b.phone, b.person_visited, b.purpose, req.params.id, req.session.userId]);
  res.redirect('/dashboard');
});

// UPDATE: check out
router.post('/visitors/:id/checkout', async (req, res) => {
  await db.query('UPDATE visitors SET time_out = NOW() WHERE id = ? AND user_id = ? AND time_out IS NULL',
    [req.params.id, req.session.userId]);
  res.redirect('/dashboard');
});

// DELETE
router.post('/visitors/:id/delete', async (req, res) => {
  await db.query('DELETE FROM visitors WHERE id = ? AND user_id = ?',
    [req.params.id, req.session.userId]);
  res.redirect('/dashboard');
});

// FEEDBACK
router.post('/feedback', async (req, res) => {
  await db.query('INSERT INTO feedback (user_id, message) VALUES (?, ?)',
    [req.session.userId, req.body.message]);
  res.redirect('/dashboard?sent=1');
});

module.exports = router;