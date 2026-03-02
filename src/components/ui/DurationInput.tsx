import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, InputHTMLAttributes, KeyboardEvent } from 'react';
import {
  NAVIGATION_KEYS,
  findRangeAtPosition,
  formatDisplay,
  getModeSegments,
  getRanges,
  getSegmentWidths,
  isEditingShortcut,
  normalizeRaw,
  replaceSelection,
  secondsToSegments,
} from './duration-input.utils';
import type { DurationLimits, DurationMode, NormalizedDuration } from './duration-input.utils';

export type { DurationMode } from './duration-input.utils';

export type DurationInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number;
  onChange: (seconds: number) => void;
  mode: DurationMode;
  maxHours?: number;
  maxMinutes?: number;
  maxSeconds?: number;
  className?: string;
};

export function DurationInput({
  value,
  onChange,
  mode,
  maxHours,
  maxMinutes,
  maxSeconds,
  disabled = false,
  inputMode = 'numeric',
  className,
  ...inputProps
}: DurationInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);

  const limits: DurationLimits = useMemo(() => ({ maxHours, maxMinutes, maxSeconds }), [maxHours, maxMinutes, maxSeconds]);
  const widths = useMemo(() => getSegmentWidths(mode, limits), [mode, limits]);
  const externalDisplay = useMemo(() => {
    const values = secondsToSegments(mode, value, limits);
    return formatDisplay(mode, values, widths);
  }, [mode, value, limits, widths]);

  const [isEditing, setIsEditing] = useState(false);
  const [draftDisplay, setDraftDisplay] = useState(externalDisplay);

  const activeDisplay = isEditing ? draftDisplay : externalDisplay;

  useEffect(() => {
    if (pendingCaretRef.current === null || !inputRef.current) return;
    const caret = pendingCaretRef.current;
    inputRef.current.setSelectionRange(caret, caret);
    pendingCaretRef.current = null;
  }, [draftDisplay]);

  const commitNormalized = (normalized: NormalizedDuration, nextCaret?: number) => {
    if (nextCaret !== undefined) {
      pendingCaretRef.current = Math.min(nextCaret, normalized.display.length);
    }

    if (normalized.display !== draftDisplay) {
      setDraftDisplay(normalized.display);
    }

    if (normalized.seconds !== value) {
      onChange(normalized.seconds);
    }
  };

  const applyRaw = (raw: string, nextCaret?: number) => {
    const normalized = normalizeRaw(mode, raw, limits, widths);
    commitNormalized(normalized, nextCaret);
  };

  const moveCaret = (nextCaret: number) => {
    const input = inputRef.current;
    if (!input) return;
    const boundedCaret = Math.min(nextCaret, activeDisplay.length);
    input.setSelectionRange(boundedCaret, boundedCaret);
  };

  const applyDisplayEdit = (nextDisplay: string, nextCaret: number) => {
    const boundedCaret = Math.min(nextCaret, nextDisplay.length);
    if (nextDisplay === activeDisplay) {
      moveCaret(boundedCaret);
      return;
    }

    applyRaw(nextDisplay, boundedCaret);
  };

  const applyDeleteShiftAtEnd = () => {
    const digits = activeDisplay.replace(/\D/g, '');
    const shiftedDigits = digits.slice(0, -1);
    const normalized = normalizeRaw(mode, shiftedDigits, limits, widths);
    commitNormalized(normalized, normalized.display.length);
  };

  const handleDeleteKey = (key: 'Backspace' | 'Delete', cursor: number, selectionEnd: number) => {
    const hasSelection = selectionEnd !== cursor;
    const selectedAll = hasSelection && cursor === 0 && selectionEnd === activeDisplay.length;

    if (selectedAll) {
      applyRaw('', 0);
      return true;
    }

    if (!hasSelection && key === 'Backspace' && cursor === activeDisplay.length) {
      applyDeleteShiftAtEnd();
      return true;
    }

    const leftIsColon = key === 'Backspace' && cursor > 0 && activeDisplay[cursor - 1] === ':';
    const currentIsColon = activeDisplay[cursor] === ':';
    if (leftIsColon || currentIsColon) {
      const nextCursor = key === 'Backspace' ? Math.max(0, cursor - 1) : Math.min(activeDisplay.length, cursor + 1);
      moveCaret(nextCursor);
      return true;
    }

    return false;
  };

  const handleDigitInsertion = (digit: string, cursor: number, selectionEnd: number) => {
    const ranges = getRanges(activeDisplay, mode);
    const targetRange = findRangeAtPosition(ranges, cursor);
    if (!targetRange) return;

    const segments = getModeSegments(mode);
    const leadingSegment = segments[0];
    const isLeadingSegment = targetRange.key === leadingSegment;
    const hasSelection = selectionEnd !== cursor;

    if (hasSelection) {
      const nextDisplay = replaceSelection(activeDisplay, cursor, selectionEnd, digit);
      applyDisplayEdit(nextDisplay, cursor + 1);
      return;
    }

    if (isLeadingSegment && cursor >= targetRange.end) {
      const insertIndex = targetRange.end;
      const nextDisplay = replaceSelection(activeDisplay, insertIndex, insertIndex, digit);
      applyDisplayEdit(nextDisplay, insertIndex + 1);
      return;
    }

    let writeIndex = cursor;
    if (activeDisplay[writeIndex] === ':') writeIndex += 1;
    if (writeIndex >= activeDisplay.length) return;

    const nextDisplay = replaceSelection(activeDisplay, writeIndex, writeIndex + 1, digit);

    const localPos = writeIndex - targetRange.start;
    const segmentLength = targetRange.end - targetRange.start;

    let nextCaret = writeIndex + 1;
    const reachedSegmentEnd = localPos >= segmentLength - 1;
    if (reachedSegmentEnd && !isLeadingSegment) {
      const afterSegment = targetRange.end + 1;
      nextCaret = nextDisplay[afterSegment] === ':' ? afterSegment + 1 : afterSegment;
    }

    if (nextCaret < nextDisplay.length && nextDisplay[nextCaret] === ':') {
      nextCaret += 1;
    }

    applyDisplayEdit(nextDisplay, nextCaret);
  };

  const handleBeforeInput = (event: FormEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;

    const native = event.nativeEvent as InputEvent;
    if (native.isComposing) return;

    const cursor = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? cursor;

    if (native.inputType === 'insertText') {
      const text = native.data ?? '';
      if (!text) return;
      event.preventDefault();
      if (/^\d$/.test(text)) {
        handleDigitInsertion(text, cursor, selectionEnd);
      }
      return;
    }

    if (native.inputType === 'deleteContentBackward') {
      event.preventDefault();
      handleDeleteKey('Backspace', cursor, selectionEnd);
      return;
    }

    if (native.inputType === 'deleteContentForward') {
      event.preventDefault();
      handleDeleteKey('Delete', cursor, selectionEnd);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;

    if (event.altKey) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      if (isEditingShortcut(event)) return;
      if (event.key.length === 1) {
        event.preventDefault();
      }
      return;
    }

    if (NAVIGATION_KEYS.has(event.key)) {
      return;
    }

    const cursor = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? cursor;

    if (event.key === 'Backspace' || event.key === 'Delete') {
      const handled = handleDeleteKey(event.key, cursor, selectionEnd);
      if (handled) event.preventDefault();
      return;
    }

    if (!/^\d$/.test(event.key)) {
      if (event.key.length === 1) event.preventDefault();
      return;
    }

    event.preventDefault();
    handleDigitInsertion(event.key, cursor, selectionEnd);
  };

  return (
    <input
      {...inputProps}
      ref={inputRef}
      type="text"
      inputMode={inputMode}
      className={className}
      value={activeDisplay}
      disabled={disabled}
      onFocus={() => {
        setIsEditing(true);
        setDraftDisplay(externalDisplay);
      }}
      onBlur={() => {
        const normalized = normalizeRaw(mode, draftDisplay, limits, widths);
        commitNormalized(normalized);
        setIsEditing(false);
      }}
      onBeforeInput={handleBeforeInput}
      onKeyDown={handleKeyDown}
      onChange={(event) => {
        applyRaw(event.target.value);
      }}
    />
  );
}
