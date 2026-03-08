const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require auth
router.use(authenticate);

// GET /api/transactions
router.get('/', async (req, res) => {
  const { month, year, category } = req.query;

  const where = { userId: req.userId };

  if (month && year) {
    const m = String(month).padStart(2, '0');
    const y = Number(year);
    const nextYear = month == 12 ? y + 1 : y;
    const nextMonth = month == 12 ? '01' : String(Number(month) + 1).padStart(2, '0');
    const start = new Date(`${y}-${m}-01T00:00:00.000Z`);
    const end = new Date(`${nextYear}-${nextMonth}-01T00:00:00.000Z`);
    where.date = { gte: start, lt: end };
  }

  if (category) {
    where.category = category;
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    return res.json(transactions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/transactions
router.post('/', async (req, res) => {
  const { type, amount, category, date, note, isSubscriptionCharge } = req.body;

  if (!type || !amount || !category || !date) {
    return res.status(400).json({ error: 'type, amount, category, and date are required' });
  }

  if (!['INCOME', 'EXPENSE'].includes(type)) {
    return res.status(400).json({ error: 'type must be INCOME or EXPENSE' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'amount must be positive' });
  }

  try {
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.userId,
        type,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        note: note || null,
        isSubscriptionCharge: isSubscriptionCharge || false,
      },
    });
    return res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { type, amount, category, date, note } = req.body;

  try {
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(category && { category }),
        ...(date && { date: new Date(date) }),
        ...(note !== undefined && { note }),
      },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await prisma.transaction.delete({ where: { id } });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
