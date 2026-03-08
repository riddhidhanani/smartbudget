import { differenceInCalendarDays } from 'date-fns';

export default function RenewalBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div data-testid="renewal-banner" className="mb-6 space-y-2">
      {alerts.map((sub) => {
        const daysLeft = differenceInCalendarDays(new Date(sub.nextRenewalDate), new Date());
        const isUrgent = daysLeft <= 1;

        const bgClass = isUrgent
          ? 'bg-red-50 border-red-400 text-red-800'
          : 'bg-orange-50 border-orange-400 text-orange-800';

        const label = daysLeft === 0
          ? 'today'
          : daysLeft === 1
          ? 'tomorrow'
          : `in ${daysLeft} days`;

        return (
          <div
            key={sub.id}
            className={`border-l-4 p-4 rounded-r-lg ${bgClass}`}
            role="alert"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">{isUrgent ? '🔴' : '🟠'} Renewal Alert:</span>
              <span>
                <strong>{sub.name}</strong> renews {label} — ${Number(sub.amount).toFixed(2)}/
                {sub.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
