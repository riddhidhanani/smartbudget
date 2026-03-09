import { useState } from 'react';
import { format } from 'date-fns';

const CATEGORIES = [
  'Food', 'Transport', 'Entertainment', 'Salary','Housing', 'Healthcare',
  'Education', 'Shopping', 'Utilities', 'Freelance',
  'Investment', 'Other',
];

export default function TransactionForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    type: initial?.type || 'EXPENSE',
    amount: initial?.amount?.toString() || '',
    category: initial?.category || 'Food',
    date: initial?.date ? format(new Date(initial.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    note: initial?.note || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      errs.amount = 'Amount must be a positive number';
    }
    if (!form.category) {
      errs.category = 'Category is required';
    }
    if (!form.date) {
      errs.date = 'Date is required';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({
      ...form,
      amount: parseFloat(form.amount),
    });
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Transaction form">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          value={form.type}
          onChange={handleChange('type')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={form.category}
          onChange={handleChange('category')}
          className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.category ? 'border-red-400' : 'border-gray-300'
          }`}
          aria-label="Category"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-xs mt-1" role="alert">{errors.category}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          value={form.date}
          onChange={handleChange('date')}
          className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.date ? 'border-red-400' : 'border-gray-300'
          }`}
          aria-label="Date"
        />
        {errors.date && (
          <p className="text-red-500 text-xs mt-1" role="alert">{errors.date}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
        <input
          type="text"
          value={form.note}
          onChange={handleChange('note')}
          placeholder="Add a note..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Note"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : initial ? 'Update' : 'Add Transaction'}
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
