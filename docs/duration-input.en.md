# DurationInput

`DurationInput` is a controlled React + TypeScript input component for **duration intervals** (not time of day).

## Features

- Single `<input />` with dynamic `:` mask
- Supports modes: `ss`, `mm`, `hh`, `mm:ss`, `hh:mm`, `hh:mm:ss`
- Accepts and emits values as total seconds
- Numeric-only editing
- Zero-padded segments
- Prevents deleting separators (`:`)
- Segment-aware auto-advance for masked modes
- Built-in clamping and validation per mode

## API

```ts
type DurationInputProps = {
  value: number; // total seconds
  onChange: (seconds: number) => void;
  mode: 'ss' | 'mm' | 'hh' | 'mm:ss' | 'hh:mm' | 'hh:mm:ss';

  maxHours?: number;
  maxMinutes?: number;
  maxSeconds?: number;

  disabled?: boolean;
};
```

## Validation behavior

- `hh`: clamps with `maxHours` when provided; otherwise unbounded.
- `mm`/`mm:ss`: clamps with `maxMinutes` when provided.
- `hh:mm`/`hh:mm:ss`: minutes clamp to `0..59`.
- `ss`: clamps with `maxSeconds` when provided.
- Modes including segmented seconds (`mm:ss`, `hh:mm:ss`) clamp seconds to `0..59`.

## Usage

```tsx
import { useState } from 'react';
import { DurationInput } from '../src/components/ui/DurationInput';

export function Example() {
  const [seconds, setSeconds] = useState(0);

  return (
    <DurationInput
      value={seconds}
      onChange={setSeconds}
      mode="hh:mm:ss"
      maxHours={99}
    />
  );
}
```

## Notes for public-library usage

- `onChange` always returns a number in seconds.
- Empty input normalizes to zero.
- No external mask dependency is required.
