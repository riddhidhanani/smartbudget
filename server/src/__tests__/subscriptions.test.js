const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const prisma = require('../lib/prisma');

jest.mock('../lib/prisma', () => ({
  subscription: {
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

const today = new Date();
today.setHours(0, 0, 0, 0);

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const inTwoDays = new Date(today);
inTwoDays.setDate(inTwoDays.getDate() + 2);

const mockSub = {
  id: 1,
  userId: 1,
  name: 'Netflix',
  amount: 15.99,
  billingCycle: 'MONTHLY',
  nextRenewalDate: tomorrow,
  category: 'Entertainment',
  isActive: true,
  createdAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/subscriptions', () => {
  it('returns subscriptions for authenticated user', async () => {
    prisma.subscription.findMany.mockResolvedValue([mockSub]);

    const res = await request(app)
      .get('/api/subscriptions')
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Netflix');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/subscriptions');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/subscriptions/alerts', () => {
  it('returns subscriptions renewing within 3 days', async () => {
    const alertSubs = [
      { ...mockSub, nextRenewalDate: tomorrow },
      { ...mockSub, id: 2, name: 'Adobe CC', nextRenewalDate: inTwoDays },
    ];
    prisma.subscription.findMany.mockResolvedValue(alertSubs);

    const res = await request(app)
      .get('/api/subscriptions/alerts')
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('returns empty array when no renewals within 3 days', async () => {
    prisma.subscription.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/subscriptions/alerts')
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/subscriptions/alerts');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/subscriptions', () => {
  it('creates a subscription', async () => {
    prisma.subscription.create.mockResolvedValue(mockSub);

    const res = await request(app)
      .post('/api/subscriptions')
      .set('Cookie', authCookie())
      .send({
        name: 'Netflix',
        amount: 15.99,
        billingCycle: 'MONTHLY',
        nextRenewalDate: tomorrow.toISOString(),
        category: 'Entertainment',
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Netflix');
  });

  it('returns 400 if required fields missing', async () => {
    const res = await request(app)
      .post('/api/subscriptions')
      .set('Cookie', authCookie())
      .send({ name: 'Netflix' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid billingCycle', async () => {
    const res = await request(app)
      .post('/api/subscriptions')
      .set('Cookie', authCookie())
      .send({
        name: 'Netflix',
        amount: 15.99,
        billingCycle: 'WEEKLY',
        nextRenewalDate: tomorrow.toISOString(),
        category: 'Entertainment',
      });

    expect(res.status).toBe(400);
  });
});
