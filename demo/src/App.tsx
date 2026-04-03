import { useMemo, useState } from 'react';
import { DurationInput, type DurationMode } from '../../src/components/ui/DurationInput';

type Locale = 'pt-BR' | 'en';
type LabelKey = DurationMode | 'maxTime99' | 'maxTime01';

type DemoCase = {
  id: string;
  labelKey: LabelKey;
  mode: DurationMode;
  initialSeconds: number;
  maxHours?: number;
  maxMinutes?: number;
  maxSeconds?: number;
  maxTime?: string;
};

const CASES: DemoCase[] = [
  { id: 'ss', labelKey: 'ss', mode: 'ss', initialSeconds: 0, maxSeconds: 999 },
  { id: 'mm', labelKey: 'mm', mode: 'mm', initialSeconds: 0, maxMinutes: 120 },
  { id: 'hh', labelKey: 'hh', mode: 'hh', initialSeconds: 0, maxHours: 240 },
  { id: 'mmss', labelKey: 'mm:ss', mode: 'mm:ss', initialSeconds: 0, maxHours: 99 },
  { id: 'hhmm', labelKey: 'hh:mm', mode: 'hh:mm', initialSeconds: 0, maxHours: 240 },
  { id: 'hhmmss', labelKey: 'hh:mm:ss', mode: 'hh:mm:ss', initialSeconds: 0, maxHours: 240 },
  { id: 'max-time-99', labelKey: 'maxTime99', mode: 'hh:mm:ss', initialSeconds: 0, maxTime: '99:59:59' },
  { id: 'max-time-01', labelKey: 'maxTime01', mode: 'hh:mm:ss', initialSeconds: 0, maxTime: '01:00:00' },
];

const TEXT = {
  'pt-BR': {
    labels: {
      ss: 'Apenas segundos',
      mm: 'Apenas minutos',
      hh: 'Apenas horas',
      'mm:ss': 'Minutos e segundos',
      'hh:mm': 'Horas e minutos',
      'hh:mm:ss': 'Horas, minutos e segundos',
      maxTime99: 'Horas, minutos e segundos (maxTime 99:59:59)',
      maxTime01: 'Horas, minutos e segundos (maxTime 01:00:00)',
    } satisfies Record<LabelKey, string>,
    input: 'Input',
    totalSeconds: 'Segundos totais',
    title: 'DurationInput Demo',
    subtitle: 'Teste manual dos modos de entrada do componente (PT-BR).',
  },
  en: {
    labels: {
      ss: 'Seconds only',
      mm: 'Minutes only',
      hh: 'Hours only',
      'mm:ss': 'Minutes and seconds',
      'hh:mm': 'Hours and minutes',
      'hh:mm:ss': 'Hours, minutes and seconds',
      maxTime99: 'Hours, minutes and seconds (maxTime 99:59:59)',
      maxTime01: 'Hours, minutes and seconds (maxTime 01:00:00)',
    } satisfies Record<LabelKey, string>,
    input: 'Input',
    totalSeconds: 'Total seconds',
    title: 'DurationInput Demo',
    subtitle: 'Manual test page for the component input modes (EN).',
  },
} as const;

function DemoRow({ config, locale }: { config: DemoCase; locale: Locale }) {
  const [seconds, setSeconds] = useState(config.initialSeconds);
  const copy = TEXT[locale];

  const humanValue = useMemo(() => {
    const hh = Math.floor(seconds / 3600);
    const mm = Math.floor((seconds % 3600) / 60);
    const ss = seconds % 60;
    return [hh, mm, ss].map((v) => String(v).padStart(2, '0')).join(':');
  }, [seconds]);

  return (
    <section className="card">
      <header className="card-header">
        <h2>{copy.labels[config.labelKey]}</h2>
        <code>{config.mode}</code>
      </header>

      <div className="field">
        <label>{copy.input}</label>
        <DurationInput
          value={seconds}
          onChange={setSeconds}
          mode={config.mode}
          maxHours={config.maxHours}
          maxMinutes={config.maxMinutes}
          maxSeconds={config.maxSeconds}
          maxTime={config.maxTime}
        />
      </div>

      <div className="readout">
        <div>
          <span>{copy.totalSeconds}</span>
          <strong>{seconds}</strong>
        </div>
      </div>

      <div className="limits">
        <div>
          <small>mode: {config.mode}</small>
        </div>
        <small>
          maxHours={String(config.maxHours ?? '-')} | maxMinutes={String(config.maxMinutes ?? '-')} | maxSeconds={String(config.maxSeconds ?? '-')}
        </small>
        <small>maxTime={config.maxTime ?? '-'}</small>
      </div>
    </section>
  );
}

export function App({ locale }: { locale: Locale }) {
  const copy = TEXT[locale];

  return (
    <main className="page">
      <header>
        <nav className="locale-links">
          <a href="/index.html">PT-BR</a>
          <a href="/en.html">EN</a>
        </nav>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </header>

      <div className="grid">
        {CASES.map((item) => (
          <DemoRow key={item.id} config={item} locale={locale} />
        ))}
      </div>
    </main>
  );
}
