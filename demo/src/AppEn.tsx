import { useMemo, useState } from 'react';
import { DurationInput, type DurationMode } from '../../src/components/ui/DurationInput';

type DemoCase = {
  label: string;
  mode: DurationMode;
  initialSeconds: number;
  maxHours?: number;
  maxMinutes?: number;
  maxSeconds?: number;
};

const CASES: DemoCase[] = [
  { label: 'Seconds only', mode: 'ss', initialSeconds: 73, maxSeconds: 3600 },
  { label: 'Minutes only', mode: 'mm', initialSeconds: 1260, maxMinutes: 120 },
  { label: 'Hours only', mode: 'hh', initialSeconds: 10800, maxHours: 240 },
  { label: 'Minutes and seconds', mode: 'mm:ss', initialSeconds: 125, maxMinutes: 180 },
  { label: 'Hours and minutes', mode: 'hh:mm', initialSeconds: 7380, maxHours: 240 },
  { label: 'Hours, minutes and seconds', mode: 'hh:mm:ss', initialSeconds: 3723, maxHours: 240 },
];

function DemoRow({ config }: { config: DemoCase }) {
  const [seconds, setSeconds] = useState(config.initialSeconds);

  const humanValue = useMemo(() => {
    const hh = Math.floor(seconds / 3600);
    const mm = Math.floor((seconds % 3600) / 60);
    const ss = seconds % 60;
    return [hh, mm, ss].map((v) => String(v).padStart(2, '0')).join(':');
  }, [seconds]);

  return (
    <section className="card">
      <header className="card-header">
        <h2>{config.label}</h2>
        <code>{config.mode}</code>
      </header>

      <div className="field">
        <label>Input</label>
        <DurationInput
          value={seconds}
          onChange={setSeconds}
          mode={config.mode}
          maxHours={config.maxHours}
          maxMinutes={config.maxMinutes}
          maxSeconds={config.maxSeconds}
        />
      </div>

      <div className="readout">
        <div>
          <span>Total seconds</span>
          <strong>{seconds}</strong>
        </div>
        <div>
          <span>HH:MM:SS format</span>
          <strong>{humanValue}</strong>
        </div>
      </div>

      <div className="limits">
        <small>
          limits: maxHours={String(config.maxHours ?? '-')} | maxMinutes={String(config.maxMinutes ?? '-')} | maxSeconds={String(config.maxSeconds ?? '-')}
        </small>
        <small>tip: with a 3-digit limit (e.g. 120), the leading segment mask becomes `000`.</small>
      </div>
    </section>
  );
}

export function AppEn() {
  return (
    <main className="page">
      <header>
        <nav className="locale-links">
          <a href="/index.html">PT-BR</a>
          <a href="/en.html">EN</a>
        </nav>
        <h1>DurationInput Demo</h1>
        <p>Manual test page for the component input modes (EN).</p>
      </header>

      <div className="grid">
        {CASES.map((item) => (
          <DemoRow key={item.mode} config={item} />
        ))}
      </div>
    </main>
  );
}
