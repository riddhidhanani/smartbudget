import { useState } from 'react';
import { format } from 'date-fns';

const CATEGORIES = [
  'Entertainment', 'Software', 'Music', 'News', 'Gaming',
  'Fitness', 'Education', 'Cloud Storage', 'Other',
];

export default function SubscriptionForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    amount: initial?.amount?.toString() || '',
    billingCycle: initial?.billingCycle || 'MONTHLY',
    nextRenewalDate: initial?.nextRenewalDate
      ? format(new Date(initial.nextRenewalDate), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    category: initial?.category || 'Entertainment',
    isActive: initial?.isActive !== undefined ? initial.isActive : true,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      errs.amount = 'Amount must be a positive number';
    }
    if (!form.nextRenewalDate) errs.nextRenewalDate = 'Renewal date is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({ ...form, amount: parseFloat(form.amount) });
  };

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Subscription form">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
        <input
          type="text"
          value={form.name}
          onChange={handleChange('name')}
          placeholder="e.g. Netflix"
          className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.name ? 'border-red-400' : 'border-gray-300'
          }`}
          aria-label="Service name"
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1" role="alert">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={form.amount}
          onChange={handleChange('amount')}
          placeholder="0.00"
          className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.amount ? 'border-red-400' : 'border-gray-300'
          }`}
          aria-label="Amount"
        />
        {errors.amount && (
          <p className="text-red-500 text-xs mt-1" role="alert">{errors.amount}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
        <select
          value={form.billingCycle}
          onChange={handleChange('billingCycle')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Billing cycle"
        >
          <option value="MONTHLY">Monthly</option>
          <option value="YEARLY">Yearly</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Next Renewal Date</label>
        <input
          type="date"
          value={form.nextRenewalDate}
          onChange={handleChange('nextRenewalDate')}
          className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.nextRenewalDate ? 'border-red-400' : 'border-gray-300'
          }`}
          aria-label="Next renewal date"
        />
        {errors.nextRenewalDate && (
          <p className="text-red-500 text-xs mt-1" role="alert">{errors.nextRenewalDate}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={form.category}
          onChange={handleChange('category')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Category"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={form.isActive}
          onChange={handleChange('isActive')}
          className="w-4 h-4 text-indigo-600 rounded"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : initial ? 'Update' : 'Add Subscription'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
