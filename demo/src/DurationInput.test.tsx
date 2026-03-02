import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DurationInput, type DurationInputProps } from '../../src/components/ui/DurationInput';

function ControlledDurationInput(props: Omit<DurationInputProps, 'value' | 'onChange'> & { initialValue: number }) {
  const { initialValue, ...forwardProps } = props;
  const [value, setValue] = useState(initialValue);
  return <DurationInput {...(forwardProps as Omit<DurationInputProps, 'value' | 'onChange'>)} value={value} onChange={setValue} />;
}

describe('DurationInput', () => {
  it('accepts standard input props for accessibility and forms', () => {
    render(
      <ControlledDurationInput
        initialValue={0}
        mode="mm"
        aria-label="Duration in minutes"
        name="duration"
        id="duration-field"
      />
    );

    const input = screen.getByLabelText('Duration in minutes');
    expect(input).toHaveAttribute('name', 'duration');
    expect(input).toHaveAttribute('id', 'duration-field');
  });

  it('uses a dynamic mask width from max values', () => {
    render(<ControlledDurationInput initialValue={0} mode="mm" maxMinutes={120} aria-label="mm" />);
    const input = screen.getByLabelText('mm') as HTMLInputElement;
    expect(input.value).toBe('000');
  });

  it('keeps cursor moving when digit does not change display and avoids redundant onChange', () => {
    const onChange = vi.fn();

    render(<DurationInput value={13 * 3600} onChange={onChange} mode="hh:mm" maxHours={240} aria-label="hhmm" />);
    const input = screen.getByLabelText('hhmm') as HTMLInputElement;

    input.focus();
    input.setSelectionRange(0, 0);
    fireEvent.keyDown(input, { key: '0' });

    expect(onChange).not.toHaveBeenCalled();
    expect(input.selectionStart).toBe(1);
  });

  it('moves caret to start after select-all delete', async () => {
    render(<ControlledDurationInput initialValue={3723} mode="hh:mm:ss" maxHours={240} aria-label="full" />);
    const input = screen.getByLabelText('full') as HTMLInputElement;

    input.focus();
    input.setSelectionRange(0, input.value.length);
    fireEvent.keyDown(input, { key: 'Delete' });

    await waitFor(() => {
      expect(input.value).toBe('000:00:00');
      expect(input.selectionStart).toBe(0);
    });
  });

  it('shifts digits right on repeated backspace at end', async () => {
    render(<ControlledDurationInput initialValue={10 * 3600 + 23 * 60 + 45} mode="hh:mm:ss" maxHours={999} aria-label="shift" />);
    const input = screen.getByLabelText('shift') as HTMLInputElement;

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    const expected = ['001:02:34', '000:10:23', '000:01:02', '000:00:10', '000:00:01', '000:00:00'];

    for (const value of expected) {
      fireEvent.keyDown(input, { key: 'Backspace' });
      await waitFor(() => {
        expect(input.value).toBe(value);
      });
    }
  });

  it('handles non-keyboard input updates through onChange fallback', async () => {
    render(<ControlledDurationInput initialValue={0} mode="ss" maxSeconds={999} aria-label="mobile" />);
    const input = screen.getByLabelText('mobile') as HTMLInputElement;

    input.focus();
    fireEvent.change(input, { target: { value: '123' } });

    await waitFor(() => {
      expect(input.value).toBe('123');
    });

    fireEvent.change(input, { target: { value: '' } });

    await waitFor(() => {
      expect(input.value).toBe('000');
    });
  });
});
