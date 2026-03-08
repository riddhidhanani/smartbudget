require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log('Seeding database...');

  // Clean existing demo user
  await prisma.user.deleteMany({ where: { email: 'demo@smartbudget.com' } });

  const passwordHash = await bcrypt.hash('demo1234', 10);

  const user = await prisma.user.create({
    data: {
      email: 'demo@smartbudget.com',
      passwordHash,
      name: 'Demo User',
    },
  });

  console.log(`Created user: ${user.email}`);

  // 10 transactions for February 2026
  const feb = (day) => new Date(2026, 1, day); // month is 0-indexed

  await prisma.transaction.createMany({
    data: [
      { userId: user.id, type: 'INCOME',  amount: 4500.00, category: 'Salary',        date: feb(1),  note: 'Monthly salary' },
      { userId: user.id, type: 'INCOME',  amount: 800.00,  category: 'Freelance',     date: feb(5),  note: 'Design project' },
      { userId: user.id, type: 'EXPENSE', amount: 1200.00, category: 'Housing',       date: feb(1),  note: 'Rent' },
      { userId: user.id, type: 'EXPENSE', amount: 320.50,  category: 'Food',          date: feb(3),  note: 'Groceries & dining' },
      { userId: user.id, type: 'EXPENSE', amount: 89.99,   category: 'Utilities',     date: feb(6),  note: 'Electricity & internet' },
      { userId: user.id, type: 'EXPENSE', amount: 45.00,   category: 'Transport',     date: feb(8),  note: 'Gas' },
      { userId: user.id, type: 'EXPENSE', amount: 120.00,  category: 'Healthcare',    date: feb(10), note: 'Doctor visit' },
      { userId: user.id, type: 'EXPENSE', amount: 200.00,  category: 'Shopping',      date: feb(14), note: 'Valentine gifts' },
      { userId: user.id, type: 'EXPENSE', amount: 60.00,   category: 'Entertainment', date: feb(18), note: 'Concert tickets' },
      { userId: user.id, type: 'EXPENSE', amount: 35.00,   category: 'Education',     date: feb(22), note: 'Online course' },
    ],
  });

  console.log('Created 10 transactions for February 2026');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.subscription.createMany({
    data: [
      {
        userId: user.id,
        name: 'Netflix',
        amount: 15.99,
        billingCycle: 'MONTHLY',
        nextRenewalDate: addDays(today, 2),
        category: 'Entertainment',
        isActive: true,
      },
      {
        userId: user.id,
        name: 'Spotify',
        amount: 9.99,
        billingCycle: 'MONTHLY',
        nextRenewalDate: addDays(today, 18),
        category: 'Music',
        isActive: true,
      },
      {
        userId: user.id,
        name: 'Adobe CC',
        amount: 54.99,
        billingCycle: 'MONTHLY',
        nextRenewalDate: addDays(today, 1),
        category: 'Software',
        isActive: true,
      },
      {
        userId: user.id,
        name: 'GitHub Pro',
        amount: 4.00,
        billingCycle: 'MONTHLY',
        nextRenewalDate: addDays(today, 22),
        category: 'Software',
        isActive: true,
      },
    ],
  });

  console.log('Created 4 subscriptions');
  console.log('');
  console.log('Seed complete!');
  console.log('Demo login: demo@smartbudget.com / demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
