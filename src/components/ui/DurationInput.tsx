import { useEffect, useMemo, useRef, useState } from 'react';

export type DurationMode = 'ss' | 'mm' | 'hh' | 'mm:ss' | 'hh:mm' | 'hh:mm:ss';

export type DurationInputProps = {
  value: number;
  onChange: (seconds: number) => void;
  mode: DurationMode;
  maxHours?: number;
  maxMinutes?: number;
  maxSeconds?: number;
  disabled?: boolean;
};

type SegmentKey = 'hh' | 'mm' | 'ss';
type SegmentValues = Record<SegmentKey, number>;

type SegmentRange = {
  key: SegmentKey;
  start: number;
  end: number;
};

const EMPTY_VALUES: SegmentValues = { hh: 0, mm: 0, ss: 0 };

function getModeSegments(mode: DurationMode): SegmentKey[] {
  switch (mode) {
    case 'hh:mm:ss':
      return ['hh', 'mm', 'ss'];
    case 'hh:mm':
      return ['hh', 'mm'];
    case 'mm:ss':
      return ['mm', 'ss'];
    case 'hh':
      return ['hh'];
    case 'mm':
      return ['mm'];
    case 'ss':
      return ['ss'];
  }
}

function clamp(n: number, min: number, max?: number): number {
  if (!Number.isFinite(n) || Number.isNaN(n)) return min;
  if (n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

function applyModeValidation(mode: DurationMode, values: SegmentValues, limits: Pick<DurationInputProps, 'maxHours' | 'maxMinutes' | 'maxSeconds'>): SegmentValues {
  const normalized = { ...values };

  if (mode.includes('hh')) {
    normalized.hh = clamp(normalized.hh, 0, limits.maxHours);
  }

  if (mode === 'mm' || mode === 'mm:ss') {
    normalized.mm = clamp(normalized.mm, 0, limits.maxMinutes);
  } else if (mode.includes('mm')) {
    normalized.mm = clamp(normalized.mm, 0, 59);
  }

  if (mode === 'ss') {
    normalized.ss = clamp(normalized.ss, 0, limits.maxSeconds);
  } else if (mode.includes('ss')) {
    normalized.ss = clamp(normalized.ss, 0, 59);
  }

  return normalized;
}

function secondsToSegments(mode: DurationMode, totalSeconds: number, limits: Pick<DurationInputProps, 'maxHours' | 'maxMinutes' | 'maxSeconds'>): SegmentValues {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const values: SegmentValues = {
    hh: Math.floor(safeSeconds / 3600),
    mm: Math.floor((safeSeconds % 3600) / 60),
    ss: safeSeconds % 60,
  };

  if (mode === 'hh') {
    values.hh = Math.floor(safeSeconds / 3600);
    values.mm = 0;
    values.ss = 0;
  }

  if (mode === 'mm') {
    values.hh = 0;
    values.mm = Math.floor(safeSeconds / 60);
    values.ss = 0;
  }

  if (mode === 'ss') {
    values.hh = 0;
    values.mm = 0;
    values.ss = safeSeconds;
  }

  if (mode === 'mm:ss') {
    values.hh = 0;
    values.mm = Math.floor(safeSeconds / 60);
    values.ss = safeSeconds % 60;
  }

  return applyModeValidation(mode, values, limits);
}

function segmentsToSeconds(mode: DurationMode, values: SegmentValues): number {
  const hh = mode.includes('hh') ? values.hh : 0;
  const mm = mode.includes('mm') ? values.mm : 0;
  const ss = mode.includes('ss') ? values.ss : 0;
  const total = hh * 3600 + mm * 60 + ss;
  return Number.isFinite(total) && !Number.isNaN(total) ? total : 0;
}

function formatDisplay(mode: DurationMode, values: SegmentValues): string {
  return getModeSegments(mode)
    .map((key) => String(values[key]).padStart(2, '0'))
    .join(':');
}

function parseRawInput(raw: string, mode: DurationMode): SegmentValues {
  const segments = getModeSegments(mode);
  const parsed: SegmentValues = { ...EMPTY_VALUES };
  const cleaned = raw.trim();
  if (!cleaned) return parsed;

  if (cleaned.includes(':')) {
    const parts = cleaned.split(':').slice(0, segments.length);
    segments.forEach((segment, index) => {
      const digits = (parts[index] ?? '').replace(/\D/g, '');
      parsed[segment] = digits ? Number.parseInt(digits, 10) : 0;
    });
    return parsed;
  }

  const digits = cleaned.replace(/\D/g, '');
  if (!digits) return parsed;

  if (segments.length === 1) {
    parsed[segments[0]] = Number.parseInt(digits, 10);
    return parsed;
  }

  let end = digits.length;
  for (let idx = segments.length - 1; idx >= 0; idx -= 1) {
    const key = segments[idx];
    if (idx === 0) {
      const chunk = digits.slice(0, end);
      parsed[key] = chunk ? Number.parseInt(chunk, 10) : 0;
      break;
    }

    const start = Math.max(0, end - 2);
    const chunk = digits.slice(start, end);
    parsed[key] = chunk ? Number.parseInt(chunk, 10) : 0;
    end = start;
  }

  return parsed;
}

function getRanges(display: string, mode: DurationMode): SegmentRange[] {
  const keys = getModeSegments(mode);
  const parts = display.split(':');
  let offset = 0;

  return keys.map((key, index) => {
    const part = parts[index] ?? '';
    const start = offset;
    const end = start + part.length;
    offset = end + 1;
    return { key, start, end };
  });
}

function findRangeAtPosition(ranges: SegmentRange[], pos: number): SegmentRange | null {
  for (const range of ranges) {
    if (pos >= range.start && pos <= range.end) return range;
  }
  return null;
}

export function DurationInput({ value, onChange, mode, maxHours, maxMinutes, maxSeconds, disabled = false }: DurationInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);

  const limits = useMemo(() => ({ maxHours, maxMinutes, maxSeconds }), [maxHours, maxMinutes, maxSeconds]);
  const externalDisplay = useMemo(() => {
    const values = secondsToSegments(mode, value, limits);
    return formatDisplay(mode, values);
  }, [mode, value, limits]);

  const [isEditing, setIsEditing] = useState(false);
  const [draftDisplay, setDraftDisplay] = useState(externalDisplay);

  const activeDisplay = isEditing ? draftDisplay : externalDisplay;

  useEffect(() => {
    if (pendingCaretRef.current === null || !inputRef.current) return;
    const caret = pendingCaretRef.current;
    inputRef.current.setSelectionRange(caret, caret);
    pendingCaretRef.current = null;
  }, [draftDisplay]);

  const pushRaw = (raw: string) => {
    const parsed = parseRawInput(raw, mode);
    const validated = applyModeValidation(mode, parsed, limits);
    const normalizedDisplay = formatDisplay(mode, validated);
    const nextSeconds = segmentsToSeconds(mode, validated);

    setDraftDisplay(normalizedDisplay);
    onChange(nextSeconds);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={activeDisplay}
      disabled={disabled}
      onFocus={() => {
        setIsEditing(true);
        setDraftDisplay(externalDisplay);
      }}
      onBlur={() => {
        const parsed = parseRawInput(draftDisplay, mode);
        const validated = applyModeValidation(mode, parsed, limits);
        const normalizedDisplay = formatDisplay(mode, validated);
        setDraftDisplay(normalizedDisplay);
        onChange(segmentsToSeconds(mode, validated));
        setIsEditing(false);
      }}
      onKeyDown={(event) => {
        const input = inputRef.current;
        if (!input) return;

        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Tab' || event.key === 'Home' || event.key === 'End') {
          return;
        }

        if ((event.key === 'Backspace' || event.key === 'Delete') && input.selectionStart !== null) {
          const cursor = input.selectionStart;
          const leftIsColon = event.key === 'Backspace' && cursor > 0 && activeDisplay[cursor - 1] === ':';
          const currentIsColon = activeDisplay[cursor] === ':';
          if (leftIsColon || currentIsColon) {
            event.preventDefault();
            const nextCursor = event.key === 'Backspace' ? Math.max(0, cursor - 1) : Math.min(activeDisplay.length, cursor + 1);
            input.setSelectionRange(nextCursor, nextCursor);
          }
          return;
        }

        if (!/^\d$/.test(event.key)) {
          if (event.key.length === 1) event.preventDefault();
          return;
        }

        event.preventDefault();

        const cursor = input.selectionStart ?? 0;
        const ranges = getRanges(activeDisplay, mode);
        const targetRange = findRangeAtPosition(ranges, cursor);
        if (!targetRange) return;

        let writeIndex = cursor;
        if (activeDisplay[writeIndex] === ':') writeIndex += 1;
        if (writeIndex >= activeDisplay.length) return;

        const nextChars = activeDisplay.split('');
        nextChars[writeIndex] = event.key;
        const nextDisplay = nextChars.join('');

        const localPos = writeIndex - targetRange.start;
        const segmentLength = targetRange.end - targetRange.start;

        let nextCaret = writeIndex + 1;
        const reachedSegmentEnd = localPos >= segmentLength - 1;
        if (reachedSegmentEnd) {
          const afterSegment = targetRange.end + 1;
          nextCaret = nextDisplay[afterSegment] === ':' ? afterSegment + 1 : afterSegment;
        }

        if (nextCaret < nextDisplay.length && nextDisplay[nextCaret] === ':') {
          nextCaret += 1;
        }

        pendingCaretRef.current = Math.min(nextCaret, nextDisplay.length);
        pushRaw(nextDisplay);
      }}
      onChange={(event) => {
        pushRaw(event.target.value);
      }}
    />
  );
}
