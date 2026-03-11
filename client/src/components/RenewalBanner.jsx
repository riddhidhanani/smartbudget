import { differenceInCalendarDays } from 'date-fns';

export default function RenewalBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div data-testid="renewal-banner" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {alerts.map((sub) => {
        const raw = differenceInCalendarDays(new Date(sub.nextBillingDate), new Date());
        const daysLeft = Math.max(0, raw);
        const isToday = daysLeft === 0;

        const label = isToday ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;

        return (
          <div
            key={sub.id}
            role="alert"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '12px 20px', borderRadius: '50px',
              background: isToday
                ? 'linear-gradient(135deg, #FF6B6B 0%, #FF4444 100%)'
                : 'linear-gradient(135deg, #FF6B35 0%, #FF8C00 100%)',
              color: '#FFFFFF',
              boxShadow: isToday
                ? '0 4px 16px rgba(255, 107, 107, 0.35)'
                : '0 4px 16px rgba(255, 107, 53, 0.35)',
              fontSize: '13px', fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <span style={{ fontSize: '16px' }}>{isToday ? '🔴' : '🔔'}</span>
            <span>
              <strong>{sub.name}</strong> renews {label} — ${Number(sub.amount).toFixed(2)}/
mo
            </span>
          </div>
        );
      })}
    </div>
  );
}
