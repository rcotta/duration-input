# Demo

Aplicacao de teste manual para o componente `DurationInput`.
Inclui cenarios com limites de 3 digitos para validar mascara dinamica (ex.: `120` => `000`).

## Rodar

```bash
cd demo
npm install
npm run dev
npm test
```

O servidor da demo esta configurado com `host: true`, entao ele escuta na rede local.

Paginas disponiveis:

- PT-BR: `http://localhost:5173/index.html`
- EN: `http://localhost:5173/en.html`

## Testar no celular (mesma rede)

1. Descubra o IP local do computador (`ipconfig`, use o IPv4 da placa ativa, ex.: `192.168.0.15`).
2. Com `npm run dev` ativo, abra no celular: `http://SEU_IP:5173`.
3. Se nao abrir, libere a porta 5173 no firewall do Windows para rede privada.

No desktop voce tambem pode continuar usando `http://localhost:5173`.
