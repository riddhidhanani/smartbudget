import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  getTransactions, createTransaction, updateTransaction, deleteTransaction,
} from '../lib/api';

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Housing', 'Healthcare', 'Education', 'Shopping', 'Utilities', 'Salary', 'Other'];

const CATEGORY_META = {
  Food:          { icon: '🍔', color: '#FF6B35' },
  Transport:     { icon: '🚗', color: '#6C63FF' },
  Entertainment: { icon: '🎬', color: '#9C94FF' },
  Housing:       { icon: '🏠', color: '#6C63FF' },
  Healthcare:    { icon: '💊', color: '#00D4AA' },
  Education:     { icon: '📚', color: '#00B894' },
  Shopping:      { icon: '🛍️', color: '#FF6B6B' },
  Utilities:     { icon: '⚡', color: '#FDCB6E' },
  Salary:        { icon: '💰', color: '#00D4AA' },
  Other:         { icon: '📦', color: '#B0B4CC' },
};

const now = new Date();

const EMPTY_FORM = {
  note: '', amount: '', type: 'EXPENSE',
  category: 'Food', date: format(now, 'yyyy-MM-dd'),
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear]   = useState(now.getFullYear());
  const [filterType, setFilterType]   = useState('all');
  const [showModal, setShowModal]     = useState(false);
  const [editTx, setEditTx]           = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTransactions({ year: filterYear, month: filterMonth });
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterMonth]);

  useEffect(() => { load(); }, [load]);

  const filtered = filterType === 'all'
    ? transactions
    : transactions.filter(t => t.type === filterType.toUpperCase());

  const totalIncome   = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const net           = totalIncome - totalExpenses;

  const openAdd = () => {
    setEditTx(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = tx => {
    setEditTx(tx);
    setForm({
      note: tx.note || '',
      amount: tx.amount.toString(),
      type: tx.type,
      category: tx.category,
      date: tx.date.slice(0, 10),
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditTx(null); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.note.trim()) return setError('Description is required.');
    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) return setError('Enter a valid amount.');
    setSaving(true);
    setError('');
    try {
      const payload = {
        note: form.note.trim(),
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.category,
        date: form.date,
      };
      if (editTx) {
        await updateTransaction(editTx.id, payload);
      } else {
        await createTransaction(payload);
      }
      closeModal();
      load();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this transaction?')) return;
    await deleteTransaction(id);
    load();
  };

  const formatDate = dateStr => {
    const d = new Date(dateStr.slice(0, 10) + 'T00:00:00');
    return format(d, 'MMM d, yyyy');
  };

  const years  = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const selStyle = {
    border: '1.5px solid #E8EAFF', borderRadius: '10px',
    padding: '8px 12px', fontSize: '13px', color: '#1A1A2E',
    background: '#FFFFFF', cursor: 'pointer', outline: 'none',
    fontFamily: 'Inter, sans-serif',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Transactions</h1>
          <p style={{ fontSize: '14px', color: '#8B8FA8', marginTop: '4px' }}>
            {months[filterMonth - 1]} {filterYear}
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          + Add Transaction
        </button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Income', value: totalIncome, color: '#00D4AA' },
          { label: 'Expenses', value: totalExpenses, color: '#FF6B6B' },
          { label: 'Net Balance', value: net, color: net >= 0 ? '#00D4AA' : '#FF6B6B' },
        ].map(({ label, value, color }) => (
          <div key={label} className="fintech-card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#8B8FA8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color }}>${Math.abs(value).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="fintech-card" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#8B8FA8' }}>Filter:</span>
        <select style={selStyle} value={filterMonth} onChange={e => setFilterMonth(+e.target.value)}>
          {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select style={selStyle} value={filterYear} onChange={e => setFilterYear(+e.target.value)}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select style={selStyle} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#8B8FA8' }}>
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="fintech-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#8B8FA8' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>💳</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A2E', marginBottom: '6px' }}>No transactions</div>
            <div style={{ fontSize: '14px', color: '#8B8FA8' }}>Add your first transaction to get started.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #F0F2FF' }}>
                {['Description', 'Category', 'Date', 'Amount', ''].map(h => (
                  <th key={h} style={{
                    padding: '14px 20px', textAlign: h === 'Amount' ? 'right' : 'left',
                    fontSize: '11px', fontWeight: 600, color: '#B0B4CC',
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, i) => {
                const meta = CATEGORY_META[tx.category] || { icon: '📦', color: '#B0B4CC' };
                const isIncome = tx.type === 'INCOME';
                return (
                  <tr
                    key={tx.id}
                    style={{
                      background: i % 2 === 0 ? '#FFFFFF' : '#FAFBFF',
                      borderBottom: '1px solid #F0F2FF',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F0F2FF'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#FFFFFF' : '#FAFBFF'}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A2E' }}>{tx.note || tx.category}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', borderRadius: '20px',
                        background: `${meta.color}1A`, color: meta.color,
                        fontSize: '12px', fontWeight: 600,
                      }}>
                        {meta.icon} {tx.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: '#8B8FA8' }}>
                      {formatDate(tx.date)}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: isIncome ? '#00D4AA' : '#FF6B6B' }}>
                        {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEdit(tx)}
                          style={{
                            padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #E8EAFF',
                            background: 'transparent', color: '#6C63FF', fontSize: '12px',
                            fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F0F2FF'; e.currentTarget.style.borderColor = '#6C63FF'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E8EAFF'; }}
                        >Edit</button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          style={{
                            padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #FFE0E0',
                            background: 'transparent', color: '#FF6B6B', fontSize: '12px',
                            fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FFF0F0'; e.currentTarget.style.borderColor = '#FF6B6B'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#FFE0E0'; }}
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
                {editTx ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', fontSize: '22px', color: '#8B8FA8', cursor: 'pointer', lineHeight: 1 }}
              >×</button>
            </div>

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
                background: '#FFF0F0', border: '1px solid #FFD0D0', color: '#FF6B6B', fontSize: '13px',
              }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A2E', marginBottom: '6px' }}>Description</label>
                <input
                  className="input-field"
                  placeholder="e.g. Coffee at Starbucks"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A2E', marginBottom: '6px' }}>Amount</label>
                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A2E', marginBottom: '6px' }}>Type</label>
                  <select
                    className="input-field"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A2E', marginBottom: '6px' }}>Category</label>
                  <select
                    className="input-field"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A2E', marginBottom: '6px' }}>Date</label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editTx ? 'Save Changes' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
