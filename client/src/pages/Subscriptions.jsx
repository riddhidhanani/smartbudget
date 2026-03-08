import { useState, useEffect, useCallback } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  getSubscriptions, createSubscription, updateSubscription, deleteSubscription,
} from '../lib/api';
import Navbar from '../components/Navbar';
import SubscriptionForm from '../components/SubscriptionForm';

function DaysBadge({ nextRenewalDate }) {
  const days = differenceInCalendarDays(new Date(nextRenewalDate), new Date());

  if (days <= 1) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        🔴 {days === 0 ? 'Today' : 'Tomorrow'}
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        🟡 {days} days
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      ✅ {days} days
    </span>
  );
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSubscriptions();
      setSubscriptions(res.data);
    } catch {
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  const handleCreate = async (data) => {
    setFormLoading(true);
    try {
      await createSubscription(data);
      setShowForm(false);
      fetchSubscriptions();
    } catch {
      setError('Failed to create subscription');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setFormLoading(true);
    try {
      await updateSubscription(editTarget.id, data);
      setEditTarget(null);
      fetchSubscriptions();
    } catch {
      setError('Failed to update subscription');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subscription?')) return;
    try {
      await deleteSubscription(id);
      fetchSubscriptions();
    } catch {
      setError('Failed to delete subscription');
    }
  };

  const monthlyTotal = subscriptions
    .filter(s => s.isActive)
    .reduce((sum, s) => sum + (s.billingCycle === 'YEARLY' ? s.amount / 12 : s.amount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Subscriptions</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Monthly total: <strong>${monthlyTotal.toFixed(2)}</strong>
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditTarget(null); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Add Subscription
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Modal */}
        {(showForm || editTarget) && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {editTarget ? 'Edit Subscription' : 'New Subscription'}
              </h2>
              <SubscriptionForm
                initial={editTarget}
                onSubmit={editTarget ? handleUpdate : handleCreate}
                onCancel={() => { setShowForm(false); setEditTarget(null); }}
                loading={formLoading}
              />
            </div>
          </div>
        )}

        {/* Cards Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No subscriptions yet</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map(sub => (
              <div
                key={sub.id}
                className={`bg-white rounded-xl shadow p-5 border-t-4 ${sub.isActive ? 'border-indigo-500' : 'border-gray-300 opacity-60'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{sub.name}</h3>
                    <p className="text-xs text-gray-400">{sub.category}</p>
                  </div>
                  <DaysBadge nextRenewalDate={sub.nextRenewalDate} />
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-xl font-bold text-gray-800">${Number(sub.amount).toFixed(2)}</span>
                  <span className="text-sm text-gray-500">/{sub.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</span>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Renews {format(new Date(sub.nextRenewalDate), 'MMM d, yyyy')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditTarget(sub); setShowForm(false); }}
                    className="flex-1 text-center text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg py-1.5 hover:bg-indigo-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="flex-1 text-center text-xs font-medium text-red-500 hover:text-red-700 border border-red-200 rounded-lg py-1.5 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
