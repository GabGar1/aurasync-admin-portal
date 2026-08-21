import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangePicker, { DateRange } from '@/components/DateRangePicker';

function dayButton(day: number) {
  const buttons = document.querySelectorAll<HTMLButtonElement>('button[name="day"]');
  const match = Array.from(buttons).find((b) => b.textContent === String(day));
  if (!match) throw new Error(`day button ${day} not found`);
  return match;
}

describe('DateRangePicker', () => {
  it('commits a single day on first click and extends to a range on second click', () => {
    const onRangeChange = vi.fn();
    render(<DateRangePicker range={{ from: null, to: null }} onRangeChange={onRangeChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Selecionar período/i }));

    fireEvent.click(dayButton(15));

    expect(onRangeChange).toHaveBeenCalledTimes(1);
    const firstCall = onRangeChange.mock.calls[0]![0] as DateRange;
    expect(firstCall.from).toBeInstanceOf(Date);
    expect(firstCall.to).toBeInstanceOf(Date);
    expect(firstCall.from!.getDate()).toBe(15);
    expect(firstCall.to!.getDate()).toBe(15);

    fireEvent.click(dayButton(18));

    expect(onRangeChange).toHaveBeenCalledTimes(2);
    const secondCall = onRangeChange.mock.calls[1]![0] as DateRange;
    expect(secondCall.from!.getDate()).toBe(15);
    expect(secondCall.to!.getDate()).toBe(18);
  });

  it('clears the range with the Limpar button', () => {
    const onRangeChange = vi.fn();
    render(<DateRangePicker range={{ from: null, to: null }} onRangeChange={onRangeChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Selecionar período/i }));
    fireEvent.click(screen.getByRole('button', { name: /Limpar/i }));

    expect(onRangeChange).toHaveBeenCalledWith({ from: null, to: null });
  });
});
