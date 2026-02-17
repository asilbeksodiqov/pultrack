const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── In-memory store (Render free tier has no persistent disk)
// For real persistence upgrade to Render paid or use a free DB like MongoDB Atlas / Turso
let store = {
  entries: [],
  budget: 0,
};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── GET all data
app.get('/api/data', (req, res) => {
  res.json(store);
});

// ── POST new entry
app.post('/api/entries', (req, res) => {
  const { id, desc, amount, cat, date } = req.body;
  if (!desc || !amount || !cat || !date) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const entry = { id: id || Date.now(), desc, amount, cat, date };
  store.entries.unshift(entry);
  res.json(entry);
});

// ── DELETE entry
app.delete('/api/entries/:id', (req, res) => {
  const id = parseInt(req.params.id);
  store.entries = store.entries.filter(e => e.id !== id);
  res.json({ ok: true });
});

// ── DELETE all entries
app.delete('/api/entries', (req, res) => {
  store.entries = [];
  res.json({ ok: true });
});

// ── PUT budget
app.put('/api/budget', (req, res) => {
  const { budget, pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN required' });
  // PIN validation happens client-side (time-based), server just stores
  store.budget = parseFloat(budget) || 0;
  res.json({ budget: store.budget });
});

// fallback → serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`hisobIA server running on port ${PORT}`);
});
