import { useState, useEffect, useCallback } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  getSubscriptions, createSubscription, updateSubscription, deleteSubscription,
} from '../lib/api';

const SUB_CATEGORIES = ['Entertainment', 'Software', 'Music', 'News', 'Gaming', 'Health', 'Education', 'Other'];

const SERVICE_ICONS = {
  Netflix: '🎬', Spotify: '🎵', Amazon: '📦', Hulu: '📺', Disney: '✨',
  Apple: '🍎', YouTube: '▶️', Microsoft: '💻', Adobe: '🎨', Dropbox: '☁️',
  'Chat Gpt': '🤖', ChatGPT: '🤖', OpenAI: '🤖',
};

const BILLING_CYCLES = ['MONTHLY', 'YEARLY'];

const EMPTY_FORM = { name: '', amount: '', billingCycle: 'MONTHLY', nextRenewalDate: '', category: 'Entertainment' };

function getServiceIcon(name) {
  const key = Object.keys(SERVICE_ICONS).find(k => name?.toLowerCase().includes(k.toLowerCase()));
  return key ? SERVICE_ICONS[key] : '🔄';
}

function getDaysConfig(days) {
  if (days === 0) return { label: 'Today', bg: '#FF6B6B22', color: '#FF6B6B', border: '#FF6B6B' };
  if (days <= 3)  return { label: `${days}d`, bg: '#FF6B3522', color: '#FF6B35', border: '#FF6B35' };
  return { label: `${days}d`, bg: '#00D4AA22', color: '#00D4AA', border: '#00D4AA' };
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSub, setEditSub]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSubscriptions();
      setSubscriptions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalMonthly = subscriptions.filter(s => s.isActive).reduce((sum, s) => {
    if (s.billingCycle === 'MONTHLY') return sum + s.amount;
    if (s.billingCycle === 'YEARLY')  return sum + s.amount / 12;
    return sum + s.amount;
  }, 0);

  const openAdd = () => {
    setEditSub(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = sub => {
    setEditSub(sub);
    setForm({
      name: sub.name,
      amount: sub.amount.toString(),
      billingCycle: sub.billingCycle,
      nextRenewalDate: sub.nextRenewalDate?.slice(0, 10) || '',
      category: sub.category,
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditSub(null); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim())  return setError('Service name is required.');
    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) return setError('Enter a valid amount.');
    if (!form.nextRenewalDate) return setError('Next renewal date is required.');
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        amount: parseFloat(form.amount),
        billingCycle: form.billingCycle,
        nextRenewalDate: form.nextRenewalDate,
        category: form.category,
      };
      if (editSub) {
        await updateSubscription(editSub.id, payload);
      } else {
        await createSubscription(payload);
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
    if (!window.confirm('Delete this subscription?')) return;
    await deleteSubscription(id);
    load();
  };

  const formatDate = dateStr => {
    if (!dateStr) return '—';
    const d = new Date(dateStr.slice(0, 10) + 'T00:00:00');
    return format(d, 'MMM d, yyyy');
  };

  const getDays = dateStr => {
    if (!dateStr) return null;
    const d = new Date(dateStr.slice(0, 10) + 'T00:00:00');
    return Math.max(0, differenceInCalendarDays(d, new Date()));
  };

  const sorted = [...subscriptions].sort((a, b) => {
    const da = getDays(a.nextRenewalDate) ?? 9999;
    const db = getDays(b.nextRenewalDate) ?? 9999;
    return da - db;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Subscriptions</h1>
          <p style={{ fontSize: '14px', color: '#8B8FA8', marginTop: '4px' }}>Track your recurring payments</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add Subscription</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="fintech-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#8B8FA8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Monthly Cost</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#6C63FF' }}>${totalMonthly.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#8B8FA8', marginTop: '4px' }}>Estimated</div>
        </div>
        <div className="fintech-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#8B8FA8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Annual Cost</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#FF6B35' }}>${(totalMonthly * 12).toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#8B8FA8', marginTop: '4px' }}>Estimated</div>
        </div>
        <div className="fintech-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#8B8FA8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Active Services</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#00D4AA' }}>{subscriptions.filter(s => s.isActive).length}</div>
          <div style={{ fontSize: '12px', color: '#8B8FA8', marginTop: '4px' }}>Subscriptions</div>
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#8B8FA8' }}>Loading...</div>
      ) : subscriptions.length === 0 ? (
        <div className="fintech-card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A2E', marginBottom: '8px' }}>No subscriptions yet</div>
          <div style={{ fontSize: '14px', color: '#8B8FA8', marginBottom: '24px' }}>Start tracking your recurring payments.</div>
          <button className="btn-primary" onClick={openAdd}>+ Add Subscription</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {sorted.map(sub => {
            const days     = getDays(sub.nextRenewalDate);
            const daysConf = days !== null ? getDaysConfig(days) : null;
            const icon     = getServiceIcon(sub.name);
            const cycleLabel = sub.billingCycle === 'YEARLY' ? 'yr' : 'mo';

            return (
              <div key={sub.id} className="fintech-card" style={{ overflow: 'hidden' }}>
                {/* Card top */}
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #6C63FF0F 0%, #9C94FF0F 100%)',
                  borderBottom: '1px solid #F0F2FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #6C63FF22, #9C94FF22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px', flexShrink: 0,
                    }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E' }}>{sub.name}</div>
                      <div style={{ fontSize: '12px', color: '#8B8FA8', marginTop: '2px' }}>{sub.category} · {sub.billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}</div>
                    </div>
                  </div>
                  {daysConf && (
                    <div style={{
                      padding: '4px 10px', borderRadius: '20px',
                      background: daysConf.bg, color: daysConf.color,
                      fontSize: '12px', fontWeight: 700, border: `1px solid ${daysConf.border}33`,
                      flexShrink: 0,
                    }}>{daysConf.label}</div>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: '#6C63FF' }}>${sub.amount.toFixed(2)}</span>
                    <span style={{ fontSize: '13px', color: '#8B8FA8' }}>/{cycleLabel}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '12px', color: '#8B8FA8' }}>Next billing:</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A2E' }}>{formatDate(sub.nextRenewalDate)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openEdit(sub)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid #E8EAFF',
                        background: 'transparent', color: '#6C63FF', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F0F2FF'; e.currentTarget.style.borderColor = '#6C63FF'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E8EAFF'; }}
                    >Edit</button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid #FFE0E0',
                        background: 'transparent', color: '#FF6B6B', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FFF0F0'; e.currentTarget.style.borderColor = '#FF6B6B'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#FFE0E0'; }}
                    >Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
                {editSub ? 'Edit Subscription' : 'Add Subscription'}
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A2E', marginBottom: '6px' }}>Service Name</label>
                <input
                  className="input-field"
                  placeholder="e.g. Netflix, Spotify"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A2E', marginBottom: '6px' }}>Billing Cycle</label>
                  <select
                    className="input-field"
                    value={form.billingCycle}
                    onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value }))}
                  >
                    {BILLING_CYCLES.map(c => <option key={c} value={c}>{c === 'MONTHLY' ? 'Monthly' : 'Yearly'}</option>)}
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
                    {SUB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A2E', marginBottom: '6px' }}>Next Renewal Date</label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.nextRenewalDate}
                    onChange={e => setForm(f => ({ ...f, nextRenewalDate: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editSub ? 'Save Changes' : 'Add Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
