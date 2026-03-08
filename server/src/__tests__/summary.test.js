const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');

// Mock prisma (loaded transitively through all routes in app)
jest.mock('../lib/prisma', () => ({
  user: { findUnique: jest.fn(), create: jest.fn() },
  transaction: {
    findMany: jest.fn(), findUnique: jest.fn(),
    create: jest.fn(), update: jest.fn(), delete: jest.fn(),
  },
  subscription: {
    findMany: jest.fn(), findUnique: jest.fn(),
    create: jest.fn(), update: jest.fn(), delete: jest.fn(),
  },
}));

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Great job this month! You kept your spending under control...' }],
      }),
    },
  }));
});

process.env.JWT_SECRET = 'test_secret';
process.env.ANTHROPIC_API_KEY = 'test_key';

function authCookie(userId = 1) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return `token=${token}`;
}

describe('POST /api/summary', () => {
  const sampleTransactions = [
    { type: 'INCOME', amount: 3000, category: 'Salary' },
    { type: 'EXPENSE', amount: 500, category: 'Food' },
    { type: 'EXPENSE', amount: 200, category: 'Transport' },
    { type: 'EXPENSE', amount: 100, category: 'Entertainment' },
  ];

  const sampleSubscriptions = [
    { name: 'Netflix', amount: 15.99, billingCycle: 'MONTHLY', isActive: true },
    { name: 'Spotify', amount: 9.99, billingCycle: 'MONTHLY', isActive: true },
  ];

  it('generates a summary with valid data', async () => {
    const res = await request(app)
      .post('/api/summary')
      .set('Cookie', authCookie())
      .send({
        transactions: sampleTransactions,
        subscriptions: sampleSubscriptions,
        month: 2,
        year: 2026,
      });

    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(typeof res.body.summary).toBe('string');
  });

  it('works with empty transactions and subscriptions', async () => {
    const res = await request(app)
      .post('/api/summary')
      .set('Cookie', authCookie())
      .send({ transactions: [], subscriptions: [] });

    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/summary').send({
      transactions: sampleTransactions,
      subscriptions: sampleSubscriptions,
    });
    expect(res.status).toBe(401);
  });

  it('handles Claude API errors gracefully', async () => {
    const Anthropic = require('@anthropic-ai/sdk');
    Anthropic.mockImplementationOnce(() => ({
      messages: {
        create: jest.fn().mockRejectedValue(new Error('API Error')),
      },
    }));

    const res = await request(app)
      .post('/api/summary')
      .set('Cookie', authCookie())
      .send({ transactions: sampleTransactions, subscriptions: sampleSubscriptions });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to generate summary');
  });
});
