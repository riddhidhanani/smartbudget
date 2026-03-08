const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/subscriptions/alerts  (must come before /:id routes)
router.get('/alerts', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  threeDaysLater.setHours(23, 59, 59, 999);

  try {
    const alerts = await prisma.subscription.findMany({
      where: {
        userId: req.userId,
        isActive: true,
        nextRenewalDate: {
          gte: today,
          lte: threeDaysLater,
        },
      },
      orderBy: { nextRenewalDate: 'asc' },
    });
    return res.json(alerts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/subscriptions
router.get('/', async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.userId },
      orderBy: { nextRenewalDate: 'asc' },
    });
    return res.json(subscriptions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/subscriptions
router.post('/', async (req, res) => {
  const { name, amount, billingCycle, nextRenewalDate, category, isActive } = req.body;

  if (!name || !amount || !billingCycle || !nextRenewalDate || !category) {
    return res.status(400).json({ error: 'name, amount, billingCycle, nextRenewalDate, and category are required' });
  }

  if (!['MONTHLY', 'YEARLY'].includes(billingCycle)) {
    return res.status(400).json({ error: 'billingCycle must be MONTHLY or YEARLY' });
  }

  try {
    const subscription = await prisma.subscription.create({
      data: {
        userId: req.userId,
        name,
        amount: parseFloat(amount),
        billingCycle,
        nextRenewalDate: new Date(nextRenewalDate),
        category,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    return res.status(201).json(subscription);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/subscriptions/:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, amount, billingCycle, nextRenewalDate, category, isActive } = req.body;

  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(billingCycle && { billingCycle }),
        ...(nextRenewalDate && { nextRenewalDate: new Date(nextRenewalDate) }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/subscriptions/:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await prisma.subscription.delete({ where: { id } });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
