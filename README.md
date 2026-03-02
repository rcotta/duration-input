# duration-input-react

[![npm](https://img.shields.io/npm/v/duration-input-react)](https://www.npmjs.com/package/duration-input-react)
[![npm downloads](https://img.shields.io/npm/dw/duration-input-react)](https://www.npmjs.com/package/duration-input-react)
[![License](https://img.shields.io/npm/l/duration-input-react)](./LICENSE)
[![Repo](https://img.shields.io/badge/github-rcotta%2Fduration--input-181717?logo=github)](https://github.com/rcotta/duration-input)
[![Issues](https://img.shields.io/github/issues/rcotta/duration-input)](https://github.com/rcotta/duration-input/issues)

Controlled React + TypeScript input for duration intervals.

This component was created to handle time period inputs (durations), not clock time inputs (time of day).

## Repository

https://github.com/rcotta/duration-input

## Features

- Single `<input />` with dynamic `:` mask
- Modes: `ss`, `mm`, `hh`, `mm:ss`, `hh:mm`, `hh:mm:ss`
- Controlled value as total seconds (`number`)
- Accepts standard input props like `className`, `id`, `name`, `aria-*`
- Numeric, segment-aware editing
- Dynamic leading-segment width from configured max (`max*`)
- Better mobile behavior via `beforeinput` + `onChange` fallback
- Built-in clamping/validation per mode

## Installation

```bash
npm install duration-input-react
```

## Exports

```ts
import { DurationInput } from 'duration-input-react';
import type { DurationInputProps, DurationMode } from 'duration-input-react';
```

## API

```ts
type DurationInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> & {
  value: number; // total seconds
  onChange: (seconds: number) => void;
  mode: 'ss' | 'mm' | 'hh' | 'mm:ss' | 'hh:mm' | 'hh:mm:ss';

  maxHours?: number;
  maxMinutes?: number;
  maxSeconds?: number;
};
```

## Styling

Use `className` or inline styles like any standard input:

```tsx
<DurationInput
  value={seconds}
  onChange={setSeconds}
  mode="hh:mm:ss"
  className="duration-field"
/>
```

```css
.duration-field {
  width: 220px;
  max-width: 100%;
  padding: 10px 12px;
}
```

## Validation rules

- `hh`: clamps with `maxHours` when provided; otherwise unbounded
- `mm`/`mm:ss`: clamps with `maxMinutes` when provided
- `hh:mm`/`hh:mm:ss`: minutes clamp to `0..59`
- `ss`: clamps with `maxSeconds` when provided
- Modes with segmented seconds (`mm:ss`, `hh:mm:ss`) clamp seconds to `0..59`

## Editing behavior

- `Ctrl+A` + `Backspace/Delete` clears and moves caret to start
- `Backspace` at end shifts digits right (helpful on mobile)
- `onChange` only fires when total seconds actually changes

## Usage

```tsx
import { useState } from 'react';
import { DurationInput } from 'duration-input-react';

export function Example() {
  const [seconds, setSeconds] = useState(0);

  return (
    <DurationInput
      value={seconds}
      onChange={setSeconds}
      mode="hh:mm:ss"
      maxHours={99}
      aria-label="Duration"
      name="duration"
    />
  );
}
```

## Demo

The project contains a local demo app with PT-BR and EN pages.

```bash
cd demo
npm install
npm run dev
```

Pages:
- PT-BR: `http://localhost:5173/index.html`
- EN: `http://localhost:5173/en.html`

Live demo (CodeSandbox):
- https://codesandbox.io/p/sandbox/mclnfc

## Development

```bash
cd demo
npm test
npm run build
```

## License

MIT
