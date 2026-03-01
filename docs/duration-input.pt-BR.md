# DurationInput

`DurationInput` é um componente React + TypeScript controlado para **intervalos de duração** (não horário do dia).

## Recursos

- Um único `<input />` com máscara dinâmica usando `:`
- Suporte aos modos: `ss`, `mm`, `hh`, `mm:ss`, `hh:mm`, `hh:mm:ss`
- Entrada e saída em segundos totais
- Edição apenas numérica
- Segmentos com preenchimento zero
- Impede remoção dos separadores (`:`)
- Autoavanço entre segmentos nos modos com máscara
- Validação e limites por modo

## API

```ts
type DurationInputProps = {
  value: number; // segundos totais
  onChange: (seconds: number) => void;
  mode: 'ss' | 'mm' | 'hh' | 'mm:ss' | 'hh:mm' | 'hh:mm:ss';

  maxHours?: number;
  maxMinutes?: number;
  maxSeconds?: number;

  disabled?: boolean;
};
```

## Regras de validação

- `hh`: aplica `maxHours` quando informado; sem isso, ilimitado.
- `mm`/`mm:ss`: aplica `maxMinutes` quando informado.
- `hh:mm`/`hh:mm:ss`: minutos limitados em `0..59`.
- `ss`: aplica `maxSeconds` quando informado.
- Modos com segundos segmentados (`mm:ss`, `hh:mm:ss`) limitam segundos em `0..59`.

## Exemplo de uso

```tsx
import { useState } from 'react';
import { DurationInput } from '../src/components/ui/DurationInput';

export function Exemplo() {
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

## Observações para biblioteca pública

- `onChange` sempre retorna número em segundos.
- Input vazio normaliza para zero.
- Não depende de biblioteca externa de máscara.
