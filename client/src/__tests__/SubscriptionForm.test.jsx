import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubscriptionForm from '../components/SubscriptionForm';

describe('SubscriptionForm', () => {
  it('renders all form fields', () => {
    render(<SubscriptionForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/service name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/billing cycle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/next renewal date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add subscription/i })).toBeInTheDocument();
  });

  it('renders with initial values', () => {
    const initial = {
      name: 'Netflix',
      amount: 15.99,
      billingCycle: 'MONTHLY',
      nextRenewalDate: '2026-03-09T00:00:00.000Z',
      category: 'Entertainment',
      isActive: true,
    };
    render(<SubscriptionForm initial={initial} onSubmit={vi.fn()} />);

    expect(screen.getByDisplayValue('Netflix')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15.99')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  it('calls onSubmit with correct data when valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<SubscriptionForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/service name/i), 'Spotify');
    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), '9.99');

    await user.click(screen.getByRole('button', { name: /add subscription/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Spotify',
          amount: 9.99,
          billingCycle: 'MONTHLY',
        })
      );
    });
  });

  it('shows validation error when name is empty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<SubscriptionForm onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), '9.99');

    await user.click(screen.getByRole('button', { name: /add subscription/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error when amount is invalid', async () => {
    const onSubmit = vi.fn();
    render(<SubscriptionForm onSubmit={onSubmit} />);

    // Use fireEvent.change for reliable number input control
    fireEvent.change(screen.getByLabelText(/service name/i), { target: { value: 'Netflix' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /add subscription/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<SubscriptionForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<SubscriptionForm onSubmit={vi.fn()} loading={true} />);
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});
