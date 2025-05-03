require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Members CRUD
app.get('/members', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM members');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/members/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM members WHERE member_id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/members', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, is_active } = req.body;
    const [result] = await db.query(
      'INSERT INTO members (first_name, last_name, email, phone, address, membership_date, is_active) VALUES (?, ?, ?, ?, ?, CURDATE(), ?)',
      [first_name, last_name, email, phone, address, is_active]
    );
    const [newMember] = await db.query('SELECT * FROM members WHERE member_id = ?', [result.insertId]);
    res.status(201).json(newMember[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Books CRUD
app.get('/books', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM books');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/books', async (req, res) => {
  try {
    const { title, isbn, publisher_id, publication_year, edition, category, total_copies, available_copies, shelf_location } = req.body;
    const [result] = await db.query(
      'INSERT INTO books (title, isbn, publisher_id, publication_year, edition, category, total_copies, available_copies, shelf_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, isbn, publisher_id, publication_year, edition, category, total_copies, available_copies, shelf_location]
    );
    const [newBook] = await db.query('SELECT * FROM books WHERE book_id = ?', [result.insertId]);
    res.status(201).json(newBook[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Loans CRUD
app.post('/loans', async (req, res) => {
  try {
    const { book_id, member_id, loan_date, due_date } = req.body;
    
    // Check book availability
    const [book] = await db.query('SELECT available_copies FROM books WHERE book_id = ?', [book_id]);
    if (book[0].available_copies < 1) {
      return res.status(400).json({ error: 'No available copies' });
    }
    
    // Create loan
    const [result] = await db.query(
      'INSERT INTO loans (book_id, member_id, loan_date, due_date, status) VALUES (?, ?, ?, ?, "active")',
      [book_id, member_id, loan_date, due_date]
    );
    
    // Update book count
    await db.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE book_id = ?',
      [book_id]
    );
    
    const [newLoan] = await db.query('SELECT * FROM loans WHERE loan_id = ?', [result.insertId]);
    res.status(201).json(newLoan[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Loans GET
app.get('/loans', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM loans');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


