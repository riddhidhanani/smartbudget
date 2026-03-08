import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'
  const [form, setForm] = useState({ email: '', password: '', name: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        navigate('/dashboard');
      } else if (mode === 'register') {
        await register(form.email, form.password, form.name);
        navigate('/dashboard');
      } else if (mode === 'reset') {
        if (form.newPassword !== form.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (form.newPassword.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await axios.post('/api/auth/reset-password', {
          email: form.email,
          newPassword: form.newPassword,
        }, { withCredentials: true });
        setSuccess('Password reset successfully! You can now sign in.');
        setForm((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">SmartBudget</h1>
          <p className="text-gray-500 mt-2">Track your finances intelligently</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* Tab switcher — only show for login/register */}
          {mode !== 'reset' && (
            <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === 'login' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === 'register' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Reset password header */}
          {mode === 'reset' && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-indigo-600 text-sm hover:underline flex items-center gap-1 mb-3"
              >
                ← Back to Sign In
              </button>
              <h2 className="text-lg font-semibold text-gray-800">Reset Password</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your email and choose a new password.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name — register only */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange('name')}
                  required
                  placeholder="Your name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Password — login & register */}
            {mode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={form.password}
                  onChange={handleChange('password')}
                  required
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* New password fields — reset only */}
            {mode === 'reset' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={form.newPassword}
                    onChange={handleChange('newPassword')}
                    required
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    required
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>
            )}
            {success && (
              <p className="text-green-600 text-sm bg-green-50 rounded-lg p-3">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                ? 'Create Account'
                : 'Reset Password'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Demo: <span className="font-mono">demo@smartbudget.com</span> /{' '}
            <span className="font-mono">demo1234</span>
          </p>
        </div>
      </div>
    </div>
  );
}
