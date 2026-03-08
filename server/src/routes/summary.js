const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// POST /api/summary
router.post('/', async (req, res) => {
  const { transactions = [], subscriptions = [], month, year } = req.body;

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  // Group expenses by category
  const expensesByCategory = {};
  transactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

  const categoryBreakdown = Object.entries(expensesByCategory)
    .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
    .join(', ');

  const monthlySubTotal = subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => {
      if (s.billingCycle === 'YEARLY') return sum + s.amount / 12;
      return sum + s.amount;
    }, 0);

  const monthLabel = month && year ? `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}` : 'this month';

  const topCategory = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0];

  const prompt = `You are a personal finance assistant. Analyze this financial data for ${monthLabel} and respond ONLY with a valid JSON object — no markdown, no explanation, no extra text.

Data:
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net Balance: $${(totalIncome - totalExpenses).toFixed(2)}
- Expenses by category: ${categoryBreakdown || 'None'}
- Monthly subscriptions: $${monthlySubTotal.toFixed(2)}

Return this exact JSON structure:
{
  "status": "great" | "okay" | "tight",
  "headline": "one punchy sentence summarizing the month (max 12 words)",
  "overview": "2-3 sentences, plain English, non-expert audience",
  "insights": [
    { "icon": "emoji", "label": "short label", "detail": "one sentence insight" },
    { "icon": "emoji", "label": "short label", "detail": "one sentence insight" },
    { "icon": "emoji", "label": "short label", "detail": "one sentence insight" }
  ],
  "topCategory": { "name": "${topCategory ? topCategory[0] : 'N/A'}", "amount": ${topCategory ? topCategory[1].toFixed(2) : 0}, "tip": "one specific actionable tip for this category" },
  "savingTip": "one specific money-saving action they can take right now"
}`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    let summary;
    try {
      summary = JSON.parse(cleaned);
    } catch {
      summary = { overview: cleaned };
    }
    return res.json({ summary });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
});

module.exports = router;
