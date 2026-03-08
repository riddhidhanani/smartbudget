import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RenewalBanner from '../components/RenewalBanner';

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const subBase = {
  id: 1,
  name: 'Netflix',
  amount: 15.99,
  billingCycle: 'MONTHLY',
  category: 'Entertainment',
};

describe('RenewalBanner', () => {
  it('renders nothing when alerts array is empty', () => {
    const { container } = render(<RenewalBanner alerts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when alerts is undefined', () => {
    const { container } = render(<RenewalBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows banner for subscription renewing today', () => {
    const alerts = [{ ...subBase, nextRenewalDate: addDays(0) }];
    render(<RenewalBanner alerts={alerts} />);

    expect(screen.getByTestId('renewal-banner')).toBeInTheDocument();
    expect(screen.getByText(/Netflix/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows banner for subscription renewing tomorrow', () => {
    const alerts = [{ ...subBase, nextRenewalDate: addDays(1) }];
    render(<RenewalBanner alerts={alerts} />);

    expect(screen.getByTestId('renewal-banner')).toBeInTheDocument();
    expect(screen.getByText(/tomorrow/i)).toBeInTheDocument();
  });

  it('shows banner for subscription renewing in 2 days', () => {
    const alerts = [{ ...subBase, nextRenewalDate: addDays(2) }];
    render(<RenewalBanner alerts={alerts} />);

    expect(screen.getByTestId('renewal-banner')).toBeInTheDocument();
    expect(screen.getByText(/2 days/i)).toBeInTheDocument();
  });

  it('shows multiple renewal alerts', () => {
    const alerts = [
      { ...subBase, id: 1, name: 'Netflix', nextRenewalDate: addDays(0) },
      { ...subBase, id: 2, name: 'Adobe CC', nextRenewalDate: addDays(1) },
    ];
    render(<RenewalBanner alerts={alerts} />);

    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(screen.getByText(/Netflix/)).toBeInTheDocument();
    expect(screen.getByText(/Adobe CC/)).toBeInTheDocument();
  });

  it('uses red color for urgent (0-1 day) renewals', () => {
    const alerts = [{ ...subBase, nextRenewalDate: addDays(0) }];
    render(<RenewalBanner alerts={alerts} />);

    const alert = screen.getByRole('alert');
    expect(alert.className).toMatch(/red/);
  });

  it('uses orange color for non-urgent (2-3 day) renewals', () => {
    const alerts = [{ ...subBase, nextRenewalDate: addDays(2) }];
    render(<RenewalBanner alerts={alerts} />);

    const alert = screen.getByRole('alert');
    expect(alert.className).toMatch(/orange/);
  });
});
