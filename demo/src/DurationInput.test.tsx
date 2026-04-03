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

  it('shifts digits left and appends typed digits when caret is at end', async () => {
    render(<ControlledDurationInput initialValue={0} mode="hh:mm:ss" maxHours={99} aria-label="insert-shift" />);
    const input = screen.getByLabelText('insert-shift') as HTMLInputElement;

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    const entries: Array<[string, string]> = [
      ['2', '00:00:02'],
      ['1', '00:00:21'],
      ['3', '00:02:13'],
      ['3', '00:21:33'],
    ];

    for (const [digit, expected] of entries) {
      fireEvent.keyDown(input, { key: digit });
      await waitFor(() => {
        expect(input.value).toBe(expected);
        expect(input.selectionStart).toBe(input.value.length);
      });
    }
  });

  it('keeps positional editing behavior when caret is not at end', async () => {
    render(<ControlledDurationInput initialValue={0} mode="hh:mm:ss" maxHours={99} aria-label="positional" />);
    const input = screen.getByLabelText('positional') as HTMLInputElement;

    input.focus();
    input.setSelectionRange(1, 1);

    const entries: Array<[string, string, number]> = [
      ['2', '02:00:00', 3],
      ['5', '02:50:00', 4],
      ['1', '02:51:00', 6],
      ['3', '02:51:30', 7],
      ['4', '02:51:34', 8],
      ['8', '25:13:48', 8],
    ];

    for (const [digit, expectedDisplay, expectedCaret] of entries) {
      fireEvent.keyDown(input, { key: digit });
      await waitFor(() => {
        expect(input.value).toBe(expectedDisplay);
        expect(input.selectionStart).toBe(expectedCaret);
      });
    }
  });

  it('defers clamping until blur', async () => {
    render(<ControlledDurationInput initialValue={0} mode="mm:ss" aria-label="defer-clamp" />);
    const input = screen.getByLabelText('defer-clamp') as HTMLInputElement;

    input.focus();
    fireEvent.change(input, { target: { value: '00:89' } });

    await waitFor(() => {
      expect(input.value).toBe('00:89');
    });

    fireEvent.blur(input);

    await waitFor(() => {
      expect(input.value).toBe('00:59');
    });
  });

  it('prioritizes maxTime over max* props', async () => {
    render(
      <ControlledDurationInput
        initialValue={4 * 3600}
        mode="hh:mm:ss"
        maxHours={1}
        maxMinutes={1}
        maxSeconds={1}
        maxTime="05:30:00"
        aria-label="max-time-priority"
      />
    );
    const input = screen.getByLabelText('max-time-priority') as HTMLInputElement;

    expect(input.value).toBe('04:00:00');

    input.focus();
    fireEvent.change(input, { target: { value: '99:00:00' } });
    await waitFor(() => {
      expect(input.value).toBe('99:00:00');
    });

    fireEvent.blur(input);
    await waitFor(() => {
      expect(input.value).toBe('05:30:00');
    });
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
