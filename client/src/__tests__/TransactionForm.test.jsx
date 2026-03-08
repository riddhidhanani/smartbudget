import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionForm from '../components/TransactionForm';

describe('TransactionForm', () => {
  it('renders all form fields', () => {
    render(<TransactionForm onSubmit={vi.fn()} />);

    // Type select exists (rendered as first combobox on the page)
    const combos = screen.getAllByRole('combobox');
    expect(combos.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
  });

  it('renders with initial values', () => {
    const initial = {
      type: 'INCOME',
      amount: 1500,
      category: 'Salary',
      date: '2026-02-01T00:00:00.000Z',
      note: 'Monthly salary',
    };
    render(<TransactionForm initial={initial} onSubmit={vi.fn()} />);

    // The amount field should show the initial value
    expect(screen.getByDisplayValue('1500')).toBeInTheDocument();
    // Edit mode shows Update button
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  it('calls onSubmit with correct data when valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TransactionForm onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), '50');

    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50,
          type: 'EXPENSE',
        })
      );
    });
  });

  it('shows validation error for empty amount', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TransactionForm onSubmit={onSubmit} />);

    const amountInput = screen.getByLabelText(/amount/i);
    await user.clear(amountInput);

    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for zero amount', async () => {
    const onSubmit = vi.fn();
    render(<TransactionForm onSubmit={onSubmit} />);

    // Use fireEvent.change for reliable number input control
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows cancel button when onCancel is provided', () => {
    render(<TransactionForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onCancel when cancel is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<TransactionForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<TransactionForm onSubmit={vi.fn()} loading={true} />);
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});
