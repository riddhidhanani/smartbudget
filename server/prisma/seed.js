require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Calculate nextBillingDate: billingDay = startDate.getDate(), find next occurrence >= today
function calcNextBillingDate(startDate, referenceDate) {
  const ref = referenceDate || new Date();
  ref.setHours(0, 0, 0, 0);
  const billingDay = new Date(startDate).getDate();
  let next = new Date(ref.getFullYear(), ref.getMonth(), billingDay);
  if (next < ref) next.setMonth(next.getMonth() + 1);
  return next;
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
  const feb = (day) => new Date(2026, 1, day);

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

  // Netflix: started Jan 12 2026, bills on the 12th
  const netflixStart = new Date(2026, 0, 12); // Jan 12
  // Spotify: started Feb 5 2026, bills on the 5th
  const spotifyStart = new Date(2026, 1, 5);  // Feb 5
  // Adobe CC: started Mar 1 2026, cancelled Apr 15 2026
  const adobeStart = new Date(2026, 2, 1);    // Mar 1
  // GitHub Pro: started Feb 1 2026, bills on the 1st
  const githubStart = new Date(2026, 1, 1);   // Feb 1

  await prisma.subscription.createMany({
    data: [
      {
        userId: user.id,
        name: 'Netflix',
        amount: 15.00,
        nextBillingDate: calcNextBillingDate(netflixStart, new Date(today)),
        category: 'Entertainment',
        startDate: netflixStart,
      },
      {
        userId: user.id,
        name: 'Spotify',
        amount: 9.99,
        nextBillingDate: calcNextBillingDate(spotifyStart, new Date(today)),
        category: 'Music',
        startDate: spotifyStart,
      },
      {
        userId: user.id,
        name: 'Adobe CC',
        amount: 54.99,
        nextBillingDate: calcNextBillingDate(adobeStart, new Date(today)),
        category: 'Software',
        startDate: adobeStart,
        cancelledAt: new Date(2026, 3, 15), // Apr 15 2026
      },
      {
        userId: user.id,
        name: 'GitHub Pro',
        amount: 4.00,
        nextBillingDate: calcNextBillingDate(githubStart, new Date(today)),
        category: 'Software',
        startDate: githubStart,
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
