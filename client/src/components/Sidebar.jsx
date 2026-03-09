import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/transactions', icon: '💳', label: 'Transactions' },
  { to: '/subscriptions', icon: '🔄', label: 'Subscriptions' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: '240px',
      background: '#FFFFFF',
      boxShadow: '4px 0 24px rgba(108, 99, 255, 0.08)',
      display: 'flex', flexDirection: 'column', zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #F0F2FF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6C63FF 0%, #9C94FF 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(108, 99, 255, 0.35)', flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '18px' }}>$</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#1A1A2E', lineHeight: 1.2 }}>SmartBudget</div>
            <div style={{ fontSize: '11px', color: '#8B8FA8', marginTop: '2px' }}>Finance Tracker</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '20px 12px', overflowY: 'auto' }}>
        <p style={{
          fontSize: '10px', fontWeight: 600, color: '#B0B4CC',
          letterSpacing: '1.2px', textTransform: 'uppercase',
          margin: '0 0 10px 14px',
        }}>
          MENU
        </p>
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <span style={{ fontSize: '17px' }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div style={{ padding: '16px', borderTop: '1px solid #F0F2FF' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', background: '#F8F9FF', borderRadius: '12px', marginBottom: '10px',
        }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #6C63FF, #00D4AA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '14px', fontWeight: 700,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div style={{
              fontSize: '13px', fontWeight: 600, color: '#1A1A2E',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.name}
            </div>
            <div style={{
              fontSize: '11px', color: '#8B8FA8',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '9px 14px', borderRadius: '10px',
            border: '1.5px solid #E8EAFF', background: 'transparent',
            color: '#8B8FA8', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.2s ease', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px', fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#6C63FF';
            e.currentTarget.style.color = '#6C63FF';
            e.currentTarget.style.background = '#F0F2FF';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#E8EAFF';
            e.currentTarget.style.color = '#8B8FA8';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ↩ Sign Out
        </button>
      </div>
    </aside>
  );
}
