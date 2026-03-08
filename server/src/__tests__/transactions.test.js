const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const prisma = require('../lib/prisma');

jest.mock('../lib/prisma', () => ({
  transaction: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

process.env.JWT_SECRET = 'test_secret';

function authCookie(userId = 1) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return `token=${token}`;
}

const mockTransaction = {
  id: 1,
  userId: 1,
  type: 'EXPENSE',
  amount: 50.0,
  category: 'Food',
  date: new Date('2026-02-10'),
  note: 'Groceries',
  isSubscriptionCharge: false,
  createdAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/transactions', () => {
  it('returns transactions for authenticated user', async () => {
    prisma.transaction.findMany.mockResolvedValue([mockTransaction]);

    const res = await request(app)
      .get('/api/transactions')
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });

  it('filters by month and year', async () => {
    prisma.transaction.findMany.mockResolvedValue([mockTransaction]);

    const res = await request(app)
      .get('/api/transactions?month=2&year=2026')
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    const callArgs = prisma.transaction.findMany.mock.calls[0][0];
    expect(callArgs.where.date).toBeDefined();
  });
});

describe('POST /api/transactions', () => {
  it('creates a transaction', async () => {
    prisma.transaction.create.mockResolvedValue(mockTransaction);

    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', authCookie())
      .send({
        type: 'EXPENSE',
        amount: 50,
        category: 'Food',
        date: '2026-02-10',
        note: 'Groceries',
      });

    expect(res.status).toBe(201);
    expect(res.body.category).toBe('Food');
  });

  it('returns 400 if required fields missing', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', authCookie())
      .send({ type: 'EXPENSE' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid type', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', authCookie())
      .send({ type: 'INVALID', amount: 50, category: 'Food', date: '2026-02-10' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/transactions').send({
      type: 'EXPENSE',
      amount: 50,
      category: 'Food',
      date: '2026-02-10',
    });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/transactions/:id', () => {
  it('deletes an owned transaction', async () => {
    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    prisma.transaction.delete.mockResolvedValue(mockTransaction);

    const res = await request(app)
      .delete('/api/transactions/1')
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Deleted');
  });

  it('returns 404 for transaction belonging to another user', async () => {
    prisma.transaction.findUnique.mockResolvedValue({ ...mockTransaction, userId: 999 });

    const res = await request(app)
      .delete('/api/transactions/1')
      .set('Cookie', authCookie(1));

    expect(res.status).toBe(404);
  });

  it('returns 404 if transaction not found', async () => {
    prisma.transaction.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/transactions/999')
      .set('Cookie', authCookie());

    expect(res.status).toBe(404);
  });
});
