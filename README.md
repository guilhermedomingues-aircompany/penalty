# PicPenalty — Web Game Frontend

Mini-jogo de pênalti em WebView para o app PicPay. O jogador realiza 3 cobranças de pênalti com swipe na tela e revela prêmios em dinheiro a cada gol.

---

## Stack

| Camada      | Tecnologia                | Versão |
| ----------- | ------------------------- | ------ |
| Renderer    | PixiJS                    | ^8     |
| Animação    | GSAP                      | ^3.12  |
| UI / HUD    | React                     | ^19    |
| Linguagem   | TypeScript (strict)       | ^6     |
| Bundler     | Vite                      | ^6     |
| Mock de API | MSW (Mock Service Worker) | ^2     |
| Confetes    | canvas-confetti           | ^1.9   |

---

## Pré-requisitos

- Node.js 20+
- npm 10+

---

## Instalação

```bash
npm install
```

Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

---

## Scripts

| Comando           | Descrição                                          |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Inicia o servidor de desenvolvimento na porta 5175 |
| `npm run build`   | Gera o bundle de produção em `dist/`               |
| `npm run preview` | Serve o build de produção localmente               |

---

## Variáveis de Ambiente

| Variável            | Padrão | Descrição                            |
| ------------------- | ------ | ------------------------------------ |
| `VITE_API_BASE_URL` | `/api` | Base URL da API de backend           |
| `VITE_PORT`         | `5175` | Porta do servidor de desenvolvimento |

---

## Estrutura do Projeto

```
src/
├── App.tsx                    # Orquestrador de telas: preload → jogo → placar
├── main.tsx                   # Entry point: inicializa MSW e monta React
├── index.css                  # Reset e estilos globais
├── types.ts                   # Tipos TypeScript compartilhados
├── vite-env.d.ts              # Declarações de ambiente Vite
│
├── api/
│   └── client.ts              # HTTP client tipado (createSession, reportShot, etc.)
│
├── components/
│   ├── GameScene/             # Cena principal do jogo
│   │   ├── GameScene.tsx      # PixiJS canvas + HUD React + lógica de swipe
│   │   └── GameScene.css      # Estilos do HUD overlay
│   ├── LoadingScreen/         # Tela de carregamento com bola animada
│   │   ├── LoadingScreen.tsx
│   │   └── LoadingScreen.css
│   └── ScoreScreen/           # Tela de resultado pós-jogo
│       ├── ScoreScreen.tsx    # Placeholder — aguarda implementação
│       └── ScoreScreen.css
│
├── game/
│   ├── assets.ts              # ASSET_MAP: mapeamento alias → caminho do sprite
│   ├── confetti.ts            # Animação de confetes ao gol
│   └── constants.ts           # Dimensões lógicas e layout da cena (842×1264)
│
├── hooks/
│   ├── useGameStore.ts        # Estado global de telas e sessão
│   ├── useHaptics.ts          # Vibração nativa via Vibration API
│   ├── useSessionResume.ts    # Retomada de sessão interrompida via localStorage
│   └── useSwipe.ts            # Detecção de swipe para direcionar o chute
│
└── mocks/
    ├── browser.ts             # Inicialização do MSW no browser
    ├── handlers.ts            # Handlers REST mockados (POST /session/create, etc.)
    └── generators.ts          # Geração de sessões e cenários de teste

prototypes/
└── main.js                    # Protótipo PixiJS puro (sem React), usado para PoC inicial

mock-api/
└── API-CONTRACTS.md           # Contratos de API (request/response de cada endpoint)

public/
└── sprites → ../PicPaySprites # Symlink para os sprites do jogo (não comitado)
```

---

## Fluxo de Telas

```
LoadingScreen  →  GameScene  →  ScoreScreen
    (preload)       (jogo)       (resultado)
```

1. **LoadingScreen** — precarrega todos os sprites via `Assets.load()` (PixiJS) e cria a sessão na API em paralelo. Exibe uma bola quicando enquanto carrega.
2. **GameScene** — renderiza a cena de pênalti no canvas PixiJS. O HUD (placar, multiplicador, botões) fica em overlay React. O jogador realiza 3 chutes via swipe.
3. **ScoreScreen** — exibida após o último chute. Recebe `session`, `shots[]` e `totalScore` como props. Implementação do layout a cargo do time de design/frontend.

---

## Mecânica do Jogo

- **Swipe** para chutar: direção (esquerda/centro/direita) e altura (alto/baixo) são calculados pelo ângulo e velocidade do gesto.
- **Goleiro** reage à zona pré-definida pela sessão (seed do backend). A animação usa GSAP sobre sprites PixiJS.
- **Barreira**: 0 a 5 jogadores renderizados na frente do gol, definido por `session.barrierCount`.
- **Multiplicadores**: bolas temáticas de copas do mundo (1958, 1962, 1970, 1994, 2002) aplicam fator multiplicador ao valor revelado.
- **Perfis de revelação** (`profile`):
  - `golaco` — 90% no 1º gol
  - `progressive` — 25% → 50% → 100%
  - `golden_ball` — 100% no penúltimo ou último gol

---

## Mock de API (MSW)

Em ambiente de desenvolvimento (`npm run dev`), todas as chamadas à API são interceptadas pelo MSW sem necessidade de backend.

### Controles via console do browser

```js
// Forçar um cenário específico
window.__MSW_SCENARIO = "three_goals"; // ou: 'no_goals', 'golaco', 'golden_ball'

// Simular latência (ms)
window.__MSW_LATENCY = 800;

// Forçar erro em todas as chamadas
window.__MSW_FORCE_ERROR = "server_error";
```

Para detalhes completos dos contratos (request/response, erros, enums), consulte [docs/API-CONTRACTS.md](docs/API-CONTRACTS.md).

---

## Sprites

Os sprites ficam em `public/sprites/`, que é um symlink para `../PicPaySprites` (pasta fora do repositório).

```
public/sprites/
├── backgraud/       # Gramado (background)
├── bolas-de-futebol/ # Bolas por edição de copa
├── goleiro/         # Posições do goleiro (9 zonas)
├── jogadores-da-barreira/ # Barreira (1–5 jogadores)
└── chico/           # Mascote Chico (reações)
```

> O diretório `public/sprites` está no `.gitignore`. Para rodar localmente, clone ou copie a pasta `PicPaySprites` no nível acima do repositório e recrie o symlink:
>
> ```bash
> ln -s ../PicPaySprites public/sprites
> ```

---

## Build de Produção

O bundle é dividido em chunks separados para melhor cache:

| Chunk      | Conteúdo        |
| ---------- | --------------- |
| `pixi`     | pixi.js         |
| `gsap`     | gsap            |
| `confetti` | canvas-confetti |

```bash
npm run build
# output em dist/
```

---

## Integração com App Nativo (PicPay)

O jogo roda em uma WebView. A comunicação com o app nativo é feita via bridge JavaScript:

```ts
// Fechar a WebView ao fim do jogo
window.PicPay?.close();
```

O token de autenticação é passado via query param no deeplink que abre a WebView.
