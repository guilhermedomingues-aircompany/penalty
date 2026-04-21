# PicPenalty — Contratos de API

> Documento de referência para integração frontend ↔ backend.
> Usado pelo MSW mock e pelo backend real.
> Requisitos rastreados em `SPEC-REQUISITOS.md`.

---

## Base URL

```
Produção:  https://api.picpay.com/picpenalty/v1
Mock (MSW): intercepta fetch no browser, mesmos paths
```

---

## Autenticação

Todos os endpoints requerem header:

```
Authorization: Bearer <token_do_webview>
```

O token é passado via deeplink query param ao abrir a WebView.

---

## 1. POST /session/create

Cria uma sessão de jogo após compra confirmada. Retorna o seed completo (todos os resultados pré-definidos).

**Requisitos:** REQ-REG-01, REQ-REG-02, REQ-REG-04, REQ-ARQ-01

### Request

```json
{
  "ticketId": "tkt_abc123",
  "ticketValue": 5.0
}
```

### Response 200

```json
{
  "sessionId": "ses_xyz789",
  "totalValue": 10.0,
  "profile": "progressive",
  "barrierCount": 4,
  "distance": "12m",
  "shots": [
    {
      "index": 0,
      "result": "goal",
      "keeperZone": "right-high",
      "multiplier": { "year": 1970, "factor": 3 },
      "revealedValue": 2.5
    },
    {
      "index": 1,
      "result": "save",
      "keeperZone": "center-mid",
      "multiplier": null,
      "revealedValue": 0
    },
    {
      "index": 2,
      "result": "goal",
      "multiplier": { "year": 2002, "factor": 5 },
      "keeperZone": "left-low",
      "revealedValue": 7.5
    }
  ]
}
```

### Campos

| Campo                       | Tipo                                             | Descrição                                        |
| --------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| `sessionId`                 | string                                           | ID único da sessão                               |
| `totalValue`                | number                                           | Prêmio total (R$). 0 se não ganhou               |
| `profile`                   | `"golaco"` \| `"progressive"` \| `"golden_ball"` | Perfil de revelação (REQ-REV-01..03)             |
| `barrierCount`              | 0–5                                              | Jogadores na barreira (REQ-DIF-01..08)           |
| `distance`                  | `"12m"` \| `"7m"`                                | Distância do pênalti                             |
| `shots[].index`             | 0–2                                              | Índice do chute                                  |
| `shots[].result`            | `"goal"` \| `"save"`                             | Resultado do chute                               |
| `shots[].keeperZone`        | string                                           | Para onde o goleiro pula (ver enum abaixo)       |
| `shots[].multiplier`        | object \| null                                   | Multiplicador (só se ganho > 0) (REQ-MUL-01..02) |
| `shots[].multiplier.year`   | 1958\|1962\|1970\|1994\|2002                     | Bola temática                                    |
| `shots[].multiplier.factor` | 1–5                                              | Fator multiplicador                              |
| `shots[].revealedValue`     | number                                           | Valor revelado neste chute (REQ-REV-01..04)      |

### Enum: keeperZone

```
left-high    center-high    right-high
left-mid     center-mid     right-mid
left-low     center-low     right-low
```

### Enum: profile

| Valor         | Lógica de revelação                         |
| ------------- | ------------------------------------------- |
| `golaco`      | 90% do valor no 1º gol, restante nos demais |
| `progressive` | 25% → 50% → 100% crescente                  |
| `golden_ball` | 100% revelado só no penúltimo ou último gol |

### Errors

| Status | Body                            | Quando                              |
| ------ | ------------------------------- | ----------------------------------- |
| 401    | `{ "error": "unauthorized" }`   | Token inválido                      |
| 409    | `{ "error": "session_active" }` | Já existe sessão ativa (REQ-ARQ-05) |
| 422    | `{ "error": "invalid_ticket" }` | Ticket inválido ou já usado         |

---

## 2. POST /session/shot

Registra que o jogador executou um chute. O backend confirma.

**Requisitos:** REQ-TEL-05, REQ-ARQ-04

### Request

```json
{
  "sessionId": "ses_xyz789",
  "shotIndex": 0,
  "playerZone": "left-high"
}
```

### Response 200

```json
{
  "confirmed": true,
  "shotIndex": 0
}
```

### Errors

| Status | Body                                    | Quando              |
| ------ | --------------------------------------- | ------------------- |
| 404    | `{ "error": "session_not_found" }`      | Sessão inválida     |
| 409    | `{ "error": "shot_already_performed" }` | Chute já registrado |
| 422    | `{ "error": "invalid_shot_index" }`     | Índice fora de 0–2  |

---

## 3. POST /session/complete

Finaliza a sessão após os 3 chutes.

**Requisitos:** REQ-REG-03

### Request

```json
{
  "sessionId": "ses_xyz789"
}
```

### Response 200

```json
{
  "sessionId": "ses_xyz789",
  "totalValue": 10.0,
  "status": "completed"
}
```

---

## 4. POST /telemetry

Registra eventos de telemetria.

**Requisitos:** REQ-TEL-01..07

### Request

```json
{
  "sessionId": "ses_xyz789",
  "event": "shot_performed",
  "timestamp": "2026-04-18T14:30:00Z",
  "payload": {
    "shotIndex": 0,
    "playerZone": "left-high"
  }
}
```

### Response 200

```json
{ "ok": true }
```

### Eventos válidos

| Evento             | Quando                          | Payload                     |
| ------------------ | ------------------------------- | --------------------------- |
| `view_start`       | App abre o WebView              | `{}`                        |
| `purchase_submit`  | Usuário clica comprar           | `{ ticketValue }`           |
| `purchase_result`  | Compra confirmada/rejeitada     | `{ success, ticketId }`     |
| `session_seeded`   | Seed recebido do backend        | `{ sessionId }`             |
| `shot_performed`   | Cada chute executado            | `{ shotIndex, playerZone }` |
| `multiplier_shown` | Pop-up de multiplicador exibido | `{ year, factor }`          |
| `session_resume`   | Sessão retomada após saída      | `{ sessionId }`             |

---

## 5. GET /session/:sessionId

Recupera sessão ativa (para retomada).

**Requisitos:** REQ-ARQ-06, REQ-ARQ-07

### Response 200

Mesmo formato de `/session/create`, com campo extra:

```json
{
  "...": "mesmos campos",
  "shotsCompleted": 1,
  "status": "in_progress"
}
```

### Response 404

```json
{ "error": "session_not_found" }
```

---

## Regras de negócio no backend (para referência)

1. **Resultado é imutável** após `session/create` (REQ-ARQ-01)
2. **Se o usuário sair**: após 7 dias, backend executa chutes restantes automaticamente (REQ-ARQ-07)
3. **1 sessão ativa por usuário** (REQ-ARQ-05)
4. **Backend prevalece** em caso de divergência (REQ-ARQ-04)
5. **Multiplicadores** só se `totalValue > 0` (REQ-MUL-02)
6. **Barreira** baseada em `ticketValue` (REQ-DIF-01..08)
7. **Probabilidades de multiplicador por chute** (REQ-MUL-04):
   - 1º: 40%(1958) 10%(1962) 25%(1970) 10%(1994) 15%(2002)
   - 2º: 15%(1958) 25%(1962) 15%(1970) 20%(1994) 25%(2002)
   - 3º: 5%(1958) 30%(1962) 15%(1970) 15%(1994) 35%(2002)
