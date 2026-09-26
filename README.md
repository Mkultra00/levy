# LEVY — The Tariff Intelligence Desk

Tariff wars move in hours. Analysts still work in spreadsheets. **LEVY forecasts tariff escalations like a trading desk — with receipts.**

Every probability is backed by a belief timeline you can rewind: click any data point and see the exact headline that moved it. Chat with LEVY, hand it scenarios, and hold it accountable through its own Brier-scored learning report.

> *LEVY doesn't predict the trade war. It shows its work while doing it.*

## Features

- **Command view** — live question board with probabilities, status (Watching / Escalating / Resolved), and confidence
- **Belief timeline** — every probability change is anchored to an exact evidence citation (Reuters, Finance Canada, Federal Register…)
- **Canada replay** — a real tariff dispute re-run event-by-event: a forecast you can rewind
- **Ask LEVY** — conversational agent with live web search and hypothetical scenario handling, always labeled as such
- **Jev evidence grading** — each evidence item gets a typed impact score (Strong down → Strong up)
- **Learning scorecard** — resolved forecasts graded with Brier scores; learned evidence reweighting based on past outcomes

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, TanStack Start, Tailwind CSS v4, Framer Motion |
| App backend | TanStack Start server functions + API routes (runs on edge runtime) |
| AI | Lovable AI Gateway (chat + web search), Jev (`typesafe/jev-1.13`) via OpenRouter |
| Data source | MongoDB Atlas (database `Levy`) behind a bridge service |
| Bridge | Separate Node/Express service (`levy-bridge/`) — see its own README |

## Data flow

```
MongoDB Atlas ──▶ levy-bridge (Node/Express, Bearer auth)
                       │  GET /v1/snapshot
                       ▼
        LEVY app (src/lib/levy-source.server.ts)
        falls back to typed demo data if the bridge is down
```

## Environment variables (app)

- `LEVY_API_URL` — base URL of the bridge (e.g. `http://localhost:3000`)
- `LEVY_API_KEY` — shared bearer token for the bridge
- `OPENROUTER_API_KEY` *(optional)* — routes Jev grading through your own OpenRouter account

## Run locally

```bash
npm install
npm run dev
# with a bridge running:
LEVY_API_URL=http://localhost:3000 LEVY_API_KEY=<key> npm run dev
```

Without a bridge the app runs entirely on deterministic demo data — the UI shows a **Demo mode** badge instead of **Atlas live**.

## Notes

- Probabilities for newly added questions may be illustrative estimates, not statistically validated — the UI labels them as such.
- Atlas is the source of truth; the app never writes to it directly.
