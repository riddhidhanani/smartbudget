import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Login() {
  const [mode, setMode] = useState('login');
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
        if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
        if (form.newPassword.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
        await axios.post('/api/auth/reset-password', { email: form.email, newPassword: form.newPassword }, { withCredentials: true });
        setSuccess('Password reset successfully! You can now sign in.');
        setForm((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => { setForm((prev) => ({ ...prev, [field]: e.target.value })); setError(''); setSuccess(''); };
  const switchMode = (next) => { setMode(next); setError(''); setSuccess(''); };

  const inp = {
    width: '100%', border: '1.5px solid #E8EAFF', borderRadius: '12px',
    padding: '12px 14px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
    color: '#1A1A2E', background: '#FAFBFF', outline: 'none', transition: 'all 0.2s ease',
  };
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#8B8FA8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const focus = (e) => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.12)'; e.target.style.background = '#fff'; };
  const blur = (e) => { e.target.style.borderColor = '#E8EAFF'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBFF'; };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Left — gradient branding */}
      <div style={{
        flex: '0 0 44%', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '48px',
        background: 'linear-gradient(145deg, #4B44CC 0%, #6C63FF 55%, #9C94FF 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', top: '42%', left: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '320px' }}>
          <div style={{
            width: '68px', height: '68px', borderRadius: '20px', margin: '0 auto 28px',
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '30px' }}>$</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '34px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2 }}>SmartBudget</h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '15px', lineHeight: 1.7, marginBottom: '36px' }}>
            Track your finances intelligently. Get AI-powered insights tailored to your spending patterns.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
            {['📊  Visual spending analytics', '🤖  AI financial insights', '🔔  Subscription renewal alerts', '💳  Complete transaction history'].map((f) => (
              <div key={f} style={{
                background: 'rgba(255,255,255,0.14)', borderRadius: '10px',
                padding: '9px 16px', color: '#fff', fontSize: '13px', fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)',
                width: '100%', textAlign: 'left',
              }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F2FF', padding: '32px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '36px', boxShadow: '0 8px 40px rgba(108,99,255,0.12)' }}>

            {mode !== 'reset' ? (
              <>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A2E', marginBottom: '4px' }}>
                  {mode === 'login' ? 'Welcome back 👋' : 'Create account'}
                </h2>
                <p style={{ fontSize: '13px', color: '#8B8FA8', marginBottom: '22px' }}>
                  {mode === 'login' ? 'Sign in to your SmartBudget account' : 'Start tracking your finances today'}
                </p>
                <div style={{ display: 'flex', background: '#F0F2FF', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
                  {[['login', 'Sign In'], ['register', 'Register']].map(([m, label]) => (
                    <button key={m} type="button" onClick={() => switchMode(m)} style={{
                      flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s ease',
                      background: mode === m ? '#fff' : 'transparent',
                      color: mode === m ? '#6C63FF' : '#8B8FA8',
                      boxShadow: mode === m ? '0 2px 8px rgba(108,99,255,0.12)' : 'none',
                    }}>{label}</button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button type="button" onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: '#6C63FF', fontSize: '13px', fontWeight: 500, cursor: 'pointer', padding: 0, marginBottom: '14px', fontFamily: 'Inter, sans-serif' }}>
                  ← Back to Sign In
                </button>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A2E', marginBottom: '4px' }}>Reset Password</h2>
                <p style={{ fontSize: '13px', color: '#8B8FA8', marginBottom: '22px' }}>Enter your email and choose a new password.</p>
              </>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {mode === 'register' && (
                <div>
                  <label style={lbl}>Full Name</label>
                  <input type="text" value={form.name} onChange={handleChange('name')} required placeholder="Your name" style={inp} onFocus={focus} onBlur={blur} />
                </div>
              )}
              <div>
                <label style={lbl}>Email Address</label>
                <input type="email" value={form.email} onChange={handleChange('email')} required placeholder="you@example.com" style={inp} onFocus={focus} onBlur={blur} />
              </div>
              {mode !== 'reset' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>Password</label>
                    {mode === 'login' && (
                      <button type="button" onClick={() => switchMode('reset')} style={{ background: 'none', border: 'none', color: '#6C63FF', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input type="password" value={form.password} onChange={handleChange('password')} required placeholder="••••••••" style={inp} onFocus={focus} onBlur={blur} />
                </div>
              )}
              {mode === 'reset' && (
                <>
                  <div>
                    <label style={lbl}>New Password</label>
                    <input type="password" value={form.newPassword} onChange={handleChange('newPassword')} required placeholder="••••••••" style={inp} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={lbl}>Confirm New Password</label>
                    <input type="password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} required placeholder="••••••••" style={inp} onFocus={focus} onBlur={blur} />
                  </div>
                </>
              )}

              {error && <div style={{ background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: '10px', padding: '10px 14px', color: '#CC3333', fontSize: '13px' }}>{error}</div>}
              {success && <div style={{ background: '#F0FFF8', border: '1px solid #B0F0D4', borderRadius: '10px', padding: '10px 14px', color: '#1A7A4A', fontSize: '13px' }}>{success}</div>}

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px', marginTop: '4px' }}>
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : mode === 'register' ? 'Create Account →' : 'Reset Password →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
