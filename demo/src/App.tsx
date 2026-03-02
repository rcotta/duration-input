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
  { label: 'Apenas segundos', mode: 'ss', initialSeconds: 73, maxSeconds: 3600 },
  { label: 'Apenas minutos', mode: 'mm', initialSeconds: 1260, maxMinutes: 120 },
  { label: 'Apenas horas', mode: 'hh', initialSeconds: 10800, maxHours: 240 },
  { label: 'Minutos e segundos', mode: 'mm:ss', initialSeconds: 125, maxMinutes: 180 },
  { label: 'Horas e minutos', mode: 'hh:mm', initialSeconds: 7380, maxHours: 240 },
  { label: 'Horas, minutos e segundos', mode: 'hh:mm:ss', initialSeconds: 3723, maxHours: 240 },
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
          <span>Segundos totais</span>
          <strong>{seconds}</strong>
        </div>
        <div>
          <span>Formato HH:MM:SS</span>
          <strong>{humanValue}</strong>
        </div>
      </div>

      <div className="limits">
        <small>
          limites: maxHours={String(config.maxHours ?? '-')} | maxMinutes={String(config.maxMinutes ?? '-')} | maxSeconds={String(config.maxSeconds ?? '-')}
        </small>
        <small>
          dica: com limite de 3 digitos (ex.: 120), a mascara do primeiro segmento vira `000`.
        </small>
      </div>
    </section>
  );
}

export function App() {
  return (
    <main className="page">
      <header>
        <nav className="locale-links">
          <a href="/index.html">PT-BR</a>
          <a href="/en.html">EN</a>
        </nav>
        <h1>DurationInput Demo</h1>
        <p>Teste manual dos modos de entrada do componente (PT-BR).</p>
      </header>

      <div className="grid">
        {CASES.map((item) => (
          <DemoRow key={item.mode} config={item} />
        ))}
      </div>
    </main>
  );
}
