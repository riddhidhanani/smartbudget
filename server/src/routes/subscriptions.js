const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Add exactly 1 month, clamping to last day of target month on overflow
function addOneMonth(date) {
  const d = new Date(date);
  const origDay = d.getDate();
  d.setMonth(d.getMonth() + 1);
  // If JS rolled over (e.g. Jan 31 → Mar 3), step back to last day of intended month
  if (d.getDate() !== origDay) {
    d.setDate(0);
  }
  return d;
}

// Billing date for month M: same day as startDate, clamped to last day of M
function billingDateInMonth(startDate, year, month) {
  const billingDay = new Date(startDate).getDate();
  const lastDay = new Date(year, month, 0).getDate(); // month is 1-based here
  return new Date(year, month - 1, Math.min(billingDay, lastDay));
}

// GET /api/subscriptions/alerts — subscriptions billing within 3 days
router.get('/alerts', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  threeDaysLater.setHours(23, 59, 59, 999);

  try {
    const subs = await prisma.subscription.findMany({
      where: {
        userId: req.userId,
        cancelledAt: null,
        nextBillingDate: { gte: today, lte: threeDaysLater },
      },
      orderBy: { nextBillingDate: 'asc' },
    });
    return res.json(subs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/subscriptions/monthly-cost?month=3&year=2026
router.get('/monthly-cost', async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) return res.status(400).json({ error: 'month and year required' });

  const m = Number(month);
  const y = Number(year);

  try {
    const subs = await prisma.subscription.findMany({ where: { userId: req.userId } });

    let total = 0;
    let count = 0;

    for (const s of subs) {
      const billing = billingDateInMonth(s.startDate, y, m);
      billing.setHours(0, 0, 0, 0);

      const started = new Date(s.startDate);
      started.setHours(0, 0, 0, 0);

      // Not started yet this billing cycle
      if (started > billing) continue;
      // Cancelled before or on billing date
      if (s.cancelledAt && new Date(s.cancelledAt) <= billing) continue;

      total += s.amount;
      count += 1;
    }

    return res.json({ total: +total.toFixed(2), count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/subscriptions — all subs with auto-advance for active ones
router.get('/', async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.userId },
      orderBy: { nextBillingDate: 'asc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updated = await Promise.all(
      subscriptions.map(async (sub) => {
        if (sub.cancelledAt) return sub; // don't advance cancelled subs

        let billing = new Date(sub.nextBillingDate);
        billing.setHours(0, 0, 0, 0);

        if (billing <= today) {
          while (billing <= today) {
            billing = addOneMonth(billing);
          }
          const saved = await prisma.subscription.update({
            where: { id: sub.id },
            data: { nextBillingDate: billing },
          });
          return saved;
        }
        return sub;
      })
    );

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/subscriptions
router.post('/', async (req, res) => {
  const { name, amount, startDate, category } = req.body;

  if (!name || !amount || !startDate || !category) {
    return res.status(400).json({ error: 'name, amount, startDate, and category are required' });
  }

  try {
    const start = new Date(startDate);
    // nextBillingDate = startDate + exactly 1 month
    const next = addOneMonth(start);

    const subscription = await prisma.subscription.create({
      data: {
        userId: req.userId,
        name,
        amount: parseFloat(amount),
        nextBillingDate: next,
        category,
        startDate: start,
      },
    });
    return res.status(201).json(subscription);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/subscriptions/:id/cancel — soft cancel
router.put('/:id/cancel', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    if (existing.cancelledAt) {
      return res.status(400).json({ error: 'Already cancelled' });
    }

    const cancelled = await prisma.subscription.update({
      where: { id },
      data: { cancelledAt: new Date() },
    });
    return res.json(cancelled);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/subscriptions/:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, amount, category, startDate } = req.body;

  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (amount) updateData.amount = parseFloat(amount);
    if (category) updateData.category = category;
    if (startDate) {
      const start = new Date(startDate);
      updateData.startDate = start;
      updateData.nextBillingDate = addOneMonth(start);
    }

    const updated = await prisma.subscription.update({ where: { id }, data: updateData });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/subscriptions/:id — hard delete
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
