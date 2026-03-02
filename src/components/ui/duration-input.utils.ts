import type { KeyboardEvent } from 'react';

export type DurationMode = 'ss' | 'mm' | 'hh' | 'mm:ss' | 'hh:mm' | 'hh:mm:ss';
export type SegmentKey = 'hh' | 'mm' | 'ss';
export type SegmentValues = Record<SegmentKey, number>;
export type SegmentRange = {
  key: SegmentKey;
  start: number;
  end: number;
};
export type SegmentWidths = Record<SegmentKey, number>;
export type DurationLimits = {
  maxHours?: number;
  maxMinutes?: number;
  maxSeconds?: number;
};
export type NormalizedDuration = {
  values: SegmentValues;
  display: string;
  seconds: number;
};

const EMPTY_VALUES: SegmentValues = { hh: 0, mm: 0, ss: 0 };

export const NAVIGATION_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End']);

const EDIT_SHORTCUT_KEYS = new Set(['a', 'c', 'v', 'x', 'z', 'y']);

function assertNever(value: never): never {
  throw new Error(`Unsupported duration mode: ${String(value)}`);
}

export function getModeSegments(mode: DurationMode): SegmentKey[] {
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
    default:
      return assertNever(mode);
  }
}

function clamp(n: number, min: number, max?: number): number {
  if (!Number.isFinite(n) || Number.isNaN(n)) return min;
  if (n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

function applyModeValidation(mode: DurationMode, values: SegmentValues, limits: DurationLimits): SegmentValues {
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

export function secondsToSegments(mode: DurationMode, totalSeconds: number, limits: DurationLimits): SegmentValues {
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

function getDigitsForLimit(limit?: number): number {
  if (limit === undefined || !Number.isFinite(limit) || Number.isNaN(limit)) return 2;
  return Math.max(2, String(Math.max(0, Math.floor(limit))).length);
}

export function getSegmentWidths(mode: DurationMode, limits: DurationLimits): SegmentWidths {
  const widths: SegmentWidths = { hh: 2, mm: 2, ss: 2 };

  if (mode === 'hh' || mode === 'hh:mm' || mode === 'hh:mm:ss') {
    widths.hh = getDigitsForLimit(limits.maxHours);
  }

  if (mode === 'mm' || mode === 'mm:ss') {
    widths.mm = getDigitsForLimit(limits.maxMinutes);
  }

  if (mode === 'ss') {
    widths.ss = getDigitsForLimit(limits.maxSeconds);
  }

  return widths;
}

function getDisplayWidth(value: number, minWidth: number): number {
  return Math.max(minWidth, String(Math.max(0, value)).length);
}

export function formatDisplay(mode: DurationMode, values: SegmentValues, widths: SegmentWidths): string {
  return getModeSegments(mode)
    .map((key) => String(values[key]).padStart(getDisplayWidth(values[key], widths[key]), '0'))
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

export function normalizeRaw(mode: DurationMode, raw: string, limits: DurationLimits, widths: SegmentWidths): NormalizedDuration {
  const parsed = parseRawInput(raw, mode);
  const values = applyModeValidation(mode, parsed, limits);
  return {
    values,
    display: formatDisplay(mode, values, widths),
    seconds: segmentsToSeconds(mode, values),
  };
}

export function getRanges(display: string, mode: DurationMode): SegmentRange[] {
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

export function findRangeAtPosition(ranges: SegmentRange[], pos: number): SegmentRange | null {
  for (const range of ranges) {
    if (pos >= range.start && pos <= range.end) return range;
  }
  return null;
}

export function isEditingShortcut(event: KeyboardEvent<HTMLInputElement>): boolean {
  if (!(event.ctrlKey || event.metaKey)) return false;
  return EDIT_SHORTCUT_KEYS.has(event.key.toLowerCase());
}

export function replaceSelection(display: string, start: number, end: number, value: string): string {
  return `${display.slice(0, start)}${value}${display.slice(end)}`;
}
