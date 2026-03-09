import { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Label,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend,
  AreaChart, Area,
} from 'recharts';
import { format, subMonths } from 'date-fns';
import {
  getTransactions, getSubscriptions, getSubscriptionAlerts, generateSummary,
} from '../lib/api';
import RenewalBanner from '../components/RenewalBanner';

const CHART_COLORS = ['#6C63FF', '#00D4AA', '#FF6B35', '#FF6B6B', '#A29BFE', '#00B894', '#FDCB6E', '#74B9FF'];

const CATEGORY_META = {
  Food: { icon: '🍔', color: '#FF6B6B' },
  Transport: { icon: '🚗', color: '#4ECDC4' },
  Entertainment: { icon: '🎬', color: '#45B7D1' },
  Housing: { icon: '🏠', color: '#6C63FF' },
  Healthcare: { icon: '💊', color: '#A29BFE' },
  Education: { icon: '📚', color: '#00B894' },
  Shopping: { icon: '🛍️', color: '#FF6B35' },
  Utilities: { icon: '⚡', color: '#FDCB6E' },
  Salary: { icon: '💰', color: '#00D4AA' },
  Freelance: { icon: '💻', color: '#6C63FF' },
  Investment: { icon: '📈', color: '#00B894' },
  Other: { icon: '📦', color: '#B2BEC3' },
};

const STATUS_CONFIG = {
  great: { bg: 'linear-gradient(135deg, #E8FFF8, #D0FFF0)', border: '#A0F0D0', badge: { bg: '#00D4AA', color: '#fff' }, label: '🟢 Great Month' },
  okay:  { bg: 'linear-gradient(135deg, #EEF0FF, #E4E8FF)', border: '#C4CBFF', badge: { bg: '#6C63FF', color: '#fff' }, label: '🔵 Decent Month' },
  tight: { bg: 'linear-gradient(135deg, #FFF4EE, #FFE8DA)', border: '#FFD0B5', badge: { bg: '#FF6B35', color: '#fff' }, label: '🟠 Tight Month' },
};

function SummaryCard({ label, value, sub, gradient, icon }) {
  return (
    <div className="fintech-card" style={{ overflow: 'hidden' }}>
      <div style={{ background: gradient, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: '22px' }}>{icon}</span>
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A2E', letterSpacing: '-0.5px' }}>{value}</div>
        {sub && <div style={{ fontSize: '12px', color: '#8B8FA8', marginTop: '4px' }}>{sub}</div>}
      </div>
    </div>
  );
}

function AISummaryDisplay({ summary }) {
  const cfg = STATUS_CONFIG[summary.status] || STATUS_CONFIG.okay;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {summary.headline && (
        <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <p style={{ fontWeight: 600, fontSize: '15px', color: '#1A1A2E', margin: 0 }}>{summary.headline}</p>
          <span style={{ background: cfg.badge.bg, color: cfg.badge.color, fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{cfg.label}</span>
        </div>
      )}
      {summary.overview && <p style={{ color: '#8B8FA8', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{summary.overview}</p>}
      {summary.insights && summary.insights.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {summary.insights.map((ins, i) => (
            <div key={i} style={{ background: '#F8F9FF', border: '1px solid #E8EAFF', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{ins.icon}</div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#8B8FA8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{ins.label}</p>
              <p style={{ fontSize: '13px', color: '#1A1A2E', lineHeight: 1.5 }}>{ins.detail}</p>
            </div>
          ))}
        </div>
      )}
      {summary.topCategory && (
        <div style={{ background: 'linear-gradient(135deg, #F5F3FF, #EDE9FF)', border: '1px solid #D4CFFF', borderRadius: '12px', padding: '14px 18px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '28px' }}>🏆</span>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#6C63FF', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Top Spending Category</p>
            <p style={{ fontWeight: 700, color: '#1A1A2E', fontSize: '15px', marginBottom: '4px' }}>{summary.topCategory.name} — ${Number(summary.topCategory.amount).toFixed(2)}</p>
            <p style={{ fontSize: '13px', color: '#8B8FA8' }}>{summary.topCategory.tip}</p>
          </div>
        </div>
      )}
      {summary.savingTip && (
        <div style={{ background: 'linear-gradient(135deg, #E8FFF8, #D0FFF0)', border: '1px solid #A0F0D0', borderRadius: '12px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '22px' }}>💡</span>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#00B894', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Money-Saving Tip</p>
            <p style={{ fontSize: '13px', color: '#1A1A2E' }}>{summary.savingTip}</p>
          </div>
        </div>
      )}
      {!summary.headline && !summary.insights && summary.overview && (
        <div style={{ background: '#F8F9FF', border: '1px solid #E8EAFF', borderRadius: '12px', padding: '14px 18px', color: '#1A1A2E', fontSize: '14px', lineHeight: 1.6 }}>{summary.overview}</div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState([]);      // selected month
  const [allTransactions, setAllTransactions] = useState([]); // last 6 months, for charts
  const [subscriptions, setSubscriptions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, allTxRes, subRes, alertRes] = await Promise.all([
        getTransactions({ month, year }),
        getTransactions({}), // no month/year = all transactions, used for 6-month bar chart
        getSubscriptions(),
        getSubscriptionAlerts(),
      ]);
      setTransactions(txRes.data);
      setAllTransactions(allTxRes.data);
      setSubscriptions(subRes.data);
      setAlerts(alertRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalIncome   = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const subTotal = subscriptions.filter(s => s.isActive).reduce((s, sub) => s + (sub.billingCycle === 'YEARLY' ? sub.amount / 12 : sub.amount), 0);
  const netBalance = totalIncome - totalExpenses - subTotal;

  const expenseByCategory = {};
  transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
  });
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value: +value.toFixed(2) }));

  // 6-month bar chart — anchored to selected month/year
  const selectedMonthStart = new Date(year, month - 1, 1);
  const barData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(selectedMonthStart, 5 - i);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const monthTx = allTransactions.filter(t => {
      const [ty, tm] = t.date.slice(0, 7).split('-').map(Number);
      return tm === m && ty === y;
    });
    return {
      label: format(d, 'MMM'),
      income:   +monthTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0).toFixed(2),
      expenses: +monthTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0).toFixed(2),
    };
  });

  // Daily spending trend for selected month
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyExpenseMap = {};
  transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    const day = t.date.slice(0, 10);
    dailyExpenseMap[day] = (dailyExpenseMap[day] || 0) + t.amount;
  });
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day     = i + 1;
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      label:  format(new Date(dateKey + 'T00:00:00'), 'MMM d'),
      amount: +(dailyExpenseMap[dateKey] || 0).toFixed(2),
    };
  });
  const hasDailyData = dailyData.some(d => d.amount > 0);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await generateSummary({ transactions, subscriptions, month, year });
      setSummary(res.data.summary);
    } catch {
      setSummary({ overview: 'Failed to generate summary. Please try again.' });
    } finally {
      setSummaryLoading(false);
    }
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const selStyle = {
    border: '1.5px solid #E8EAFF', borderRadius: '10px', padding: '8px 32px 8px 12px',
    fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#1A1A2E',
    background: '#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%238B8FA8\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E") no-repeat right 10px center',
    outline: 'none', cursor: 'pointer', appearance: 'none',
  };

  const tooltipStyle = { borderRadius: '10px', border: '1px solid #E8EAFF', fontFamily: 'Inter, sans-serif', fontSize: '13px' };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A2E', marginBottom: '2px' }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: '#8B8FA8' }}>Your financial overview at a glance</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={selStyle}>
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={selStyle}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <RenewalBanner alerts={alerts} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#8B8FA8', fontSize: '14px' }}>Loading your data...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <SummaryCard label="Total Income"   value={`$${totalIncome.toFixed(2)}`}   icon="💰" gradient="linear-gradient(135deg, #00D4AA 0%, #00B894 100%)" />
            <SummaryCard label="Total Expenses" value={`$${totalExpenses.toFixed(2)}`} icon="💸" gradient="linear-gradient(135deg, #FF6B6B 0%, #FF4757 100%)" />
            <SummaryCard label="Subscriptions"  value={`$${subTotal.toFixed(2)}/mo`}   icon="🔄" sub={`${subscriptions.filter(s => s.isActive).length} active`} gradient="linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)" />
            <SummaryCard
              label="Net Balance"
              value={`$${netBalance.toFixed(2)}`}
              sub={netBalance >= 0 ? "You're in the green!" : 'Spending exceeds income'}
              icon={netBalance >= 0 ? '📈' : '📉'}
              gradient={netBalance >= 0 ? 'linear-gradient(135deg, #6C63FF 0%, #9C94FF 100%)' : 'linear-gradient(135deg, #FF8C42 0%, #FFAA35 100%)'}
            />
          </div>

          {/* Donut + Bar charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Donut */}
            <div className="fintech-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E', marginBottom: '16px' }}>Spending by Category</h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      <Label content={({ viewBox }) => {
                        const { cx, cy } = viewBox;
                        return (
                          <text>
                            <tspan x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: '18px', fontWeight: '700', fill: '#1A1A2E' }}>${totalExpenses.toFixed(0)}</tspan>
                            <tspan x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: '11px', fill: '#8B8FA8' }}>Total Spent</tspan>
                          </text>
                        );
                      }} />
                    </Pie>
                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', color: '#8B8FA8', fontSize: '13px' }}>
                  <span style={{ fontSize: '32px' }}>📊</span>No expense data this period
                </div>
              )}
            </div>

            {/* 6-month bar chart */}
            <div className="fintech-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E', marginBottom: '16px' }}>Income vs Expenses (6 months)</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FF" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#8B8FA8', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8B8FA8', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => `$${v.toFixed(2)}`} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Inter' }} />
                  <Bar dataKey="income"   fill="#00D4AA" name="Income"   radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" fill="#FF6B6B" name="Expenses" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Spending Trend */}
          <div className="fintech-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E', marginBottom: '16px' }}>
              Daily Spending Trend — {months[month - 1]} {year}
            </h2>
            {hasDailyData ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6C63FF" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FF" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#8B8FA8', fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    tickFormatter={(v, i) => {
                      // Only show tick if that day has spending
                      const day = dailyData[i];
                      return day && day.amount > 0 ? v : '';
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#8B8FA8', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`$${v.toFixed(2)}`, 'Spent']}
                    contentStyle={tooltipStyle}
                    filterNull={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#6C63FF"
                    strokeWidth={2.5}
                    fill="url(#spendGrad)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#6C63FF', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', color: '#8B8FA8', fontSize: '13px' }}>
                <span style={{ fontSize: '32px' }}>📈</span>No spending data for this period
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="fintech-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E' }}>Recent Transactions</h2>
              <a href="/transactions" style={{ fontSize: '12px', color: '#6C63FF', textDecoration: 'none', fontWeight: 500 }}>View all →</a>
            </div>
            {recentTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#8B8FA8', fontSize: '13px' }}>No transactions this period</div>
            ) : (
              <div>
                {recentTransactions.map((tx, i) => {
                  const meta = CATEGORY_META[tx.category] || { icon: '📦', color: '#B2BEC3' };
                  return (
                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: i < recentTransactions.length - 1 ? '1px solid #F0F2FF' : 'none' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${meta.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px' }}>
                        {meta.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A2E' }}>{tx.note || tx.category}</div>
                        <div style={{ fontSize: '12px', color: '#8B8FA8' }}>{format(new Date(tx.date.slice(0, 10) + 'T00:00:00'), 'MMM d, yyyy')} · {tx.category}</div>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: tx.type === 'INCOME' ? '#00D4AA' : '#FF6B6B', whiteSpace: 'nowrap' }}>
                        {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div className="fintech-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #6C63FF, #9C94FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🤖</div>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E', marginBottom: '1px' }}>AI Financial Insights</h2>
                  <p style={{ fontSize: '11px', color: '#8B8FA8', margin: 0 }}>Powered by Claude AI</p>
                </div>
              </div>
              <button onClick={handleGenerateSummary} disabled={summaryLoading} className="btn-primary" style={{ fontSize: '13px', padding: '9px 18px' }}>
                {summaryLoading ? '⏳ Analyzing...' : '✨ Generate Insights'}
              </button>
            </div>
            {summary ? (
              <AISummaryDisplay summary={summary} />
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ fontSize: '32px', marginBottom: '10px' }}>📊</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A2E', marginBottom: '6px' }}>Your personalized AI analysis is one click away</p>
                <p style={{ fontSize: '12px', color: '#8B8FA8' }}>Get spending insights, trends, and saving tips tailored to your data</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
