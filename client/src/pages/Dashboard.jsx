import { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';
import {
  getTransactions, getSubscriptions, getSubscriptionAlerts, generateSummary,
} from '../lib/api';
import Navbar from '../components/Navbar';
import RenewalBanner from '../components/RenewalBanner';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

const STATUS_CONFIG = {
  great: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', label: 'Great Month' },
  okay:  { bg: 'bg-blue-50',  border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700',  label: 'Decent Month' },
  tight: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', label: 'Tight Month' },
};

function AISummaryDisplay({ summary }) {
  const cfg = STATUS_CONFIG[summary.status] || STATUS_CONFIG.okay;
  return (
    <div className="space-y-4">
      {/* Headline + status badge */}
      {summary.headline && (
        <div className={`${cfg.bg} ${cfg.border} border rounded-xl p-4 flex items-start justify-between gap-3`}>
          <p className="text-gray-800 font-semibold text-base leading-snug">{summary.headline}</p>
          {summary.status && (
            <span className={`${cfg.badge} text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap`}>
              {cfg.label}
            </span>
          )}
        </div>
      )}

      {/* Overview */}
      {summary.overview && (
        <p className="text-gray-600 text-sm leading-relaxed">{summary.overview}</p>
      )}

      {/* Insight cards */}
      {summary.insights && summary.insights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {summary.insights.map((insight, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="text-2xl mb-2">{insight.icon}</div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{insight.label}</p>
              <p className="text-sm text-gray-700">{insight.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* Top spending category */}
      {summary.topCategory && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex gap-4 items-start">
          <div className="text-3xl">🏆</div>
          <div>
            <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-0.5">Top Spending Category</p>
            <p className="font-bold text-gray-800">{summary.topCategory.name} — ${Number(summary.topCategory.amount).toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">{summary.topCategory.tip}</p>
          </div>
        </div>
      )}

      {/* Saving tip */}
      {summary.savingTip && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-0.5">Money-Saving Tip</p>
            <p className="text-sm text-gray-700">{summary.savingTip}</p>
          </div>
        </div>
      )}

      {/* Fallback for plain text */}
      {!summary.headline && !summary.insights && summary.overview && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-gray-700 text-sm leading-relaxed">
          {summary.overview}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, colorClass }) {
  return (
    <div className={`bg-white rounded-xl shadow p-6 border-l-4 ${colorClass}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, subRes, alertRes] = await Promise.all([
        getTransactions({ month, year }),
        getSubscriptions(),
        getSubscriptionAlerts(),
      ]);
      setTransactions(txRes.data);
      setSubscriptions(subRes.data);
      setAlerts(alertRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived metrics
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const subTotal = subscriptions.filter(s => s.isActive).reduce((s, sub) => {
    return s + (sub.billingCycle === 'YEARLY' ? sub.amount / 12 : sub.amount);
  }, 0);
  const netBalance = totalIncome - totalExpenses - subTotal;

  // Pie chart data
  const expenseByCategory = {};
  transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
  });
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value: +value.toFixed(2) }));

  // Bar chart: last 6 months
  const barData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(startOfMonth(now), 5 - i);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const label = format(d, 'MMM');
    const monthTx = transactions.filter(t => {
      const [ty, tm] = t.date.slice(0, 7).split('-').map(Number);
      return tm === m && ty === y;
    });
    const income = monthTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    return { label, income: +income.toFixed(2), expenses: +expenses.toFixed(2) };
  });

  // Line chart: daily spending trend this month
  const spendingByDay = {};
  transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    const day = format(new Date(t.date.slice(0, 10) + 'T00:00:00'), 'MMM d');
    spendingByDay[day] = (spendingByDay[day] || 0) + t.amount;
  });
  const lineData = Object.entries(spendingByDay)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([day, amount]) => ({ day, amount: +amount.toFixed(2) }));

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await generateSummary({ transactions, subscriptions, month, year });
      setSummary(res.data.summary);
    } catch (err) {
      setSummary({ overview: 'Failed to generate summary. Please try again.' });
    } finally {
      setSummaryLoading(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex gap-3">
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {months.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Renewal Banner */}
        <RenewalBanner alerts={alerts} />

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <SummaryCard
                label="Total Income"
                value={`$${totalIncome.toFixed(2)}`}
                colorClass="border-green-500"
              />
              <SummaryCard
                label="Total Expenses"
                value={`$${totalExpenses.toFixed(2)}`}
                colorClass="border-red-500"
              />
              <SummaryCard
                label="Subscriptions"
                value={`$${subTotal.toFixed(2)}/mo`}
                sub={`${subscriptions.filter(s => s.isActive).length} active`}
                colorClass="border-purple-500"
              />
              <SummaryCard
                label="Net Balance"
                value={`$${netBalance.toFixed(2)}`}
                colorClass={netBalance >= 0 ? 'border-indigo-500' : 'border-orange-500'}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Pie Chart */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-base font-semibold text-gray-700 mb-4">Spending by Category</h2>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No expense data</div>
                )}
              </div>

              {/* Bar Chart */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-base font-semibold text-gray-700 mb-4">Income vs Expenses (6 months)</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Line Chart */}
              <div className="bg-white rounded-xl shadow p-6 lg:col-span-2">
                <h2 className="text-base font-semibold text-gray-700 mb-4">Daily Spending Trend</h2>
                {lineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                      <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={false} name="Spending" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No spending data for this period</div>
                )}
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <h2 className="text-base font-semibold text-gray-700">AI Financial Insights</h2>
                </div>
                <button
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {summaryLoading ? (
                    <><span className="animate-spin inline-block">⏳</span> Analyzing...</>
                  ) : (
                    <><span>✨</span> Generate Insights</>
                  )}
                </button>
              </div>

              {summary ? (
                <AISummaryDisplay summary={summary} />
              ) : (
                <div className="text-center py-10">
                  <p className="text-4xl mb-3">📊</p>
                  <p className="text-gray-500 text-sm font-medium">Your personalized AI analysis is one click away</p>
                  <p className="text-gray-400 text-xs mt-1">Get spending insights, trends, and saving tips tailored to your data</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
