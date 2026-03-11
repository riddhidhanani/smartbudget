import { useState, useEffect, useCallback } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  getSubscriptions, createSubscription, updateSubscription, cancelSubscription,
  getSubscriptionMonthlyCost,
} from '../lib/api';

const SUB_CATEGORIES = ['Entertainment', 'Software', 'Music', 'News', 'Gaming', 'Health', 'Education', 'Other'];

const SERVICE_ICONS = {
  Netflix: '🎬', Spotify: '🎵', Amazon: '📦', Hulu: '📺', Disney: '✨',
  Apple: '🍎', YouTube: '▶️', Microsoft: '💻', Adobe: '🎨', Dropbox: '☁️',
  ChatGPT: '🤖', OpenAI: '🤖', GitHub: '🐙',
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EMPTY_FORM = { name: '', amount: '', startDate: '', category: 'Entertainment' };

function getServiceIcon(name) {
  const key = Object.keys(SERVICE_ICONS).find(k => name?.toLowerCase().includes(k.toLowerCase()));
  return key ? SERVICE_ICONS[key] : '🔄';
}

function getDaysConfig(days) {
  if (days === 0) return { label: 'Today', bg: '#FF6B6B22', color: '#FF6B6B', border: '#FF6B6B' };
  if (days <= 3)  return { label: `${days}d`, bg: '#FF6B3522', color: '#FF6B35', border: '#FF6B35' };
  return { label: `${days}d`, bg: '#00D4AA22', color: '#00D4AA', border: '#00D4AA' };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return format(new Date(dateStr.slice(0, 10) + 'T00:00:00'), 'MMM d, yyyy');
}

function getDays(dateStr) {
  if (!dateStr) return null;
  return Math.max(0, differenceInCalendarDays(new Date(dateStr.slice(0, 10) + 'T00:00:00'), new Date()));
}

function lastDayOfMonth(year, month) {
  // Returns last moment of month M (month is 1-based)
  return new Date(year, month, 0, 23, 59, 59, 999);
}

// Is subscription active during month M?
function isActiveInMonth(sub, year, month) {
  const lastDay = lastDayOfMonth(year, month);
  const started = new Date(sub.startDate);
  if (started > lastDay) return false;
  if (sub.cancelledAt && new Date(sub.cancelledAt) <= lastDay) return false;
  return true;
}

// Was subscription cancelled during month M?
function wasCancelledInMonth(sub, year, month) {
  if (!sub.cancelledAt) return false;
  const c = new Date(sub.cancelledAt);
  return c.getFullYear() === year && c.getMonth() + 1 === month;
}

function SubCard({ sub, showDaysBadge, onEdit, onCancel }) {
  const isActive = !sub.cancelledAt;
  const icon = getServiceIcon(sub.name);
  const days = getDays(sub.nextBillingDate);
  const daysConf = (showDaysBadge && days !== null) ? getDaysConfig(days) : null;

  return (
    <div className="fintech-card" style={{ overflow: 'hidden', opacity: isActive ? 1 : 0.65 }}>
      {/* Card top */}
      <div style={{
        padding: '20px',
        background: isActive
          ? 'linear-gradient(135deg, #6C63FF0F 0%, #9C94FF0F 100%)'
          : 'linear-gradient(135deg, #F8F9FF, #F0F2FF)',
        borderBottom: '1px solid #F0F2FF',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: isActive ? 'linear-gradient(135deg, #6C63FF22, #9C94FF22)' : '#E8EAFF55',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', flexShrink: 0,
          }}>{icon}</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A2E' }}>{sub.name}</div>
            <div style={{ fontSize: '12px', color: '#8B8FA8', marginTop: '2px' }}>{sub.category} · Monthly</div>
          </div>
        </div>
        {isActive && daysConf && (
          <div style={{
            padding: '4px 10px', borderRadius: '20px',
            background: daysConf.bg, color: daysConf.color,
            fontSize: '12px', fontWeight: 700, border: `1px solid ${daysConf.border}33`,
            flexShrink: 0,
          }}>{daysConf.label}</div>
        )}
        {!isActive && (
          <div style={{
            padding: '4px 10px', borderRadius: '20px',
            background: '#8B8FA822', color: '#8B8FA8',
            fontSize: '12px', fontWeight: 700, border: '1px solid #8B8FA833',
            flexShrink: 0,
          }}>Cancelled</div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px' }}>
          <span style={{ fontSize: '26px', fontWeight: 800, color: isActive ? '#6C63FF' : '#8B8FA8' }}>
            ${sub.amount.toFixed(2)}
          </span>
          <span style={{ fontSize: '13px', color: '#8B8FA8' }}>/mo</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: isActive ? '16px' : '0' }}>
          <div style={{ display: 'flex', gap: '6px', fontSize: '12px' }}>
            <span style={{ color: '#8B8FA8' }}>Started:</span>
            <span style={{ fontWeight: 600, color: '#1A1A2E' }}>{formatDate(sub.startDate)}</span>
          </div>
          {isActive ? (
            <div style={{ display: 'flex', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: '#8B8FA8' }}>Next billing:</span>
              <span style={{ fontWeight: 600, color: '#1A1A2E' }}>{formatDate(sub.nextBillingDate)}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: '#8B8FA8' }}>Cancelled on:</span>
              <span style={{ fontWeight: 600, color: '#FF6B6B' }}>{formatDate(sub.cancelledAt)}</span>
            </div>
          )}
        </div>

        {isActive && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onEdit(sub)}
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
              onClick={() => onCancel(sub)}
              style={{
                flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid #FFE0E0',
                background: 'transparent', color: '#FF6B6B', fontSize: '12px',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FFF0F0'; e.currentTarget.style.borderColor = '#FF6B6B'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#FFE0E0'; }}
            >Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Subscriptions() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const [subscriptions, setSubscriptions] = useState([]);
  const [monthlyCost, setMonthlyCost]     = useState(0);
  const [loading, setLoading]             = useState(true);

  const [showModal, setShowModal]         = useState(false);
  const [editSub, setEditSub]             = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');
  const [cancelModal, setCancelModal]     = useState({ show: false, sub: null });
  const [cancelling, setCancelling]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subsRes, costRes] = await Promise.all([
        getSubscriptions(),
        getSubscriptionMonthlyCost(month, year),
      ]);
      setSubscriptions(subsRes.data);
      setMonthlyCost(costRes.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  // Filter subscriptions for selected month
  const activeInMonth = subscriptions
    .filter(s => isActiveInMonth(s, year, month))
    .sort((a, b) => getDays(a.nextBillingDate) - getDays(b.nextBillingDate));

  const cancelledInMonth = subscriptions
    .filter(s => wasCancelledInMonth(s, year, month))
    .sort((a, b) => new Date(b.cancelledAt) - new Date(a.cancelledAt));

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const openAdd = () => { setEditSub(null); setForm(EMPTY_FORM); setError(''); setShowModal(true); };
  const openEdit = sub => {
    setEditSub(sub);
    setForm({ name: sub.name, amount: sub.amount.toString(), startDate: sub.startDate?.slice(0, 10) || '', category: sub.category });
    setError('');
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditSub(null); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Service name is required.');
    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) return setError('Enter a valid amount.');
    if (!form.startDate) return setError('Start date is required.');
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name.trim(), amount: parseFloat(form.amount), startDate: form.startDate, category: form.category };
      if (editSub) { await updateSubscription(editSub.id, payload); } else { await createSubscription(payload); }
      closeModal();
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openCancelModal = sub => setCancelModal({ show: true, sub });
  const closeCancelModal = () => setCancelModal({ show: false, sub: null });

  const handleCancel = async () => {
    if (!cancelModal.sub) return;
    setCancelling(true);
    try {
      await cancelSubscription(cancelModal.sub.id);
      closeCancelModal();
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const selStyle = {
    border: '1.5px solid #E8EAFF', borderRadius: '10px', padding: '8px 32px 8px 12px',
    fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#1A1A2E',
    background: '#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%238B8FA8\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E") no-repeat right 10px center',
    outline: 'none', cursor: 'pointer', appearance: 'none',
  };

  const sectionTitle = (text, count) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{text}</h2>
      <span style={{ background: '#E8EAFF', color: '#6C63FF', fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px' }}>{count}</span>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Subscriptions</h1>
          <p style={{ fontSize: '14px', color: '#8B8FA8', marginTop: '4px' }}>Track your recurring payments</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={selStyle}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={selStyle}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-primary" onClick={openAdd}>+ Add Subscription</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="fintech-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#8B8FA8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Monthly Cost</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#6C63FF' }}>{loading ? '—' : `$${monthlyCost.toFixed(2)}`}</div>
          <div style={{ fontSize: '12px', color: '#8B8FA8', marginTop: '4px' }}>{monthLabel}</div>
        </div>
        <div className="fintech-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#8B8FA8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Annual Cost</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#FF6B35' }}>{loading ? '—' : `$${(monthlyCost * 12).toFixed(2)}`}</div>
          <div style={{ fontSize: '12px', color: '#8B8FA8', marginTop: '4px' }}>Projected</div>
        </div>
        <div className="fintech-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#8B8FA8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Active Services</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#00D4AA' }}>{loading ? '—' : activeInMonth.length}</div>
          <div style={{ fontSize: '12px', color: '#8B8FA8', marginTop: '4px' }}>{monthLabel}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#8B8FA8' }}>Loading...</div>
      ) : activeInMonth.length === 0 && cancelledInMonth.length === 0 ? (
        <div className="fintech-card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A2E', marginBottom: '8px' }}>
            {subscriptions.length === 0 ? 'No subscriptions yet' : `No subscriptions in ${monthLabel}`}
          </div>
          <div style={{ fontSize: '14px', color: '#8B8FA8', marginBottom: '24px' }}>
            {subscriptions.length === 0 ? 'Start tracking your recurring payments.' : 'Try a different month or add a new subscription.'}
          </div>
          {subscriptions.length === 0 && <button className="btn-primary" onClick={openAdd}>+ Add Subscription</button>}
        </div>
      ) : (
        <>
          {/* Active in selected month */}
          {activeInMonth.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              {sectionTitle(`Active in ${monthLabel}`, activeInMonth.length)}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {activeInMonth.map(sub => (
                  <SubCard
                    key={sub.id}
                    sub={sub}
                    showDaysBadge={isCurrentMonth && !sub.cancelledAt}
                    onEdit={openEdit}
                    onCancel={openCancelModal}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cancelled in selected month */}
          {cancelledInMonth.length > 0 && (
            <div>
              {sectionTitle(`Cancelled in ${monthLabel}`, cancelledInMonth.length)}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {cancelledInMonth.map(sub => (
                  <SubCard
                    key={sub.id}
                    sub={sub}
                    showDaysBadge={false}
                    onEdit={openEdit}
                    onCancel={openCancelModal}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
                {editSub ? 'Edit Subscription' : 'Add Subscription'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#8B8FA8', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', background: '#FFF0F0', border: '1px solid #FFD0D0', color: '#FF6B6B', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A2E', marginBottom: '6px' }}>Service Name</label>
                <input className="input-field" placeholder="e.g. Netflix, Spotify" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A2E', marginBottom: '6px' }}>Monthly Amount</label>
                  <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A2E', marginBottom: '6px' }}>Category</label>
                  <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {SUB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A2E', marginBottom: '6px' }}>
                  Start Date
                  <span style={{ fontSize: '11px', fontWeight: 400, color: '#8B8FA8', marginLeft: '6px' }}>
                    — next billing = start + 1 month
                  </span>
                </label>
                <input className="input-field" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
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

      {/* Cancel Confirmation Modal */}
      {cancelModal.show && cancelModal.sub && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeCancelModal()}>
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0, background: 'linear-gradient(135deg, #FF6B6B22, #FF444411)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                {getServiceIcon(cancelModal.sub.name)}
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Cancel {cancelModal.sub.name}?</h2>
                <p style={{ fontSize: '12px', color: '#8B8FA8', marginTop: '2px' }}>This action cannot be undone</p>
              </div>
            </div>

            {(() => {
              const hasStarted = new Date(cancelModal.sub.startDate) <= new Date();
              return (
                <>
                  <div style={{ background: '#FFF8F8', border: '1px solid #FFE0E0', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                    {hasStarted ? (
                      <>
                        <p style={{ fontSize: '14px', color: '#1A1A2E', lineHeight: 1.6, margin: 0 }}>
                          Your subscription will remain active until <strong>{formatDate(cancelModal.sub.nextBillingDate)}</strong>.
                          After that date, you won't be charged <strong>${Number(cancelModal.sub.amount).toFixed(2)}/mo</strong> anymore.
                        </p>
                        <p style={{ fontSize: '13px', color: '#00D4AA', fontWeight: 600, marginTop: '10px', marginBottom: 0 }}>
                          Saves you ${(cancelModal.sub.amount * 12).toFixed(2)}/year going forward
                        </p>
                      </>
                    ) : (
                      <>
                        <p style={{ fontSize: '14px', color: '#1A1A2E', lineHeight: 1.6, margin: 0 }}>
                          This subscription hasn't started yet — no charges have been made. Cancelling will remove it and you won't be charged at all.
                        </p>
                        <p style={{ fontSize: '13px', color: '#00D4AA', fontWeight: 600, marginTop: '10px', marginBottom: 0 }}>
                          No charges will be applied
                        </p>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={closeCancelModal}
                      style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #E8EAFF', background: 'transparent', color: '#8B8FA8', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F0F2FF'; e.currentTarget.style.color = '#6C63FF'; e.currentTarget.style.borderColor = '#6C63FF'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B8FA8'; e.currentTarget.style.borderColor = '#E8EAFF'; }}
                    >Keep Subscription</button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: cancelling ? '#ffaaaa' : 'linear-gradient(135deg, #FF6B6B 0%, #FF4444 100%)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: cancelling ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 14px rgba(255, 107, 107, 0.35)' }}
                    >{cancelling ? 'Cancelling...' : hasStarted ? 'Yes, Cancel It' : 'Yes, Remove It'}</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
