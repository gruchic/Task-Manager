const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/', async (req, res) => {
  const { title, description } = req.body;
  console.log('POST /api/tasks received:', { title, description });
  if (!title) {
    console.log('Missing title');
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO tasks (title, description) VALUES (?, ?)',
      [title, description]
    );
    console.log('Task inserted:', { id: result.insertId, title, description });
    res.json({ id: result.insertId, title, description });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const [tasks] = await db.query('SELECT * FROM tasks');
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
