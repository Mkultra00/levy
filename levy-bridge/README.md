# LEVY Bridge (MongoDB Atlas → LEVY app)

Small Node service that sits between MongoDB Atlas and the LEVY app.
LEVY calls `GET /v1/snapshot` with a bearer key; this service reads the
`Levy` database in Atlas and returns it. If Atlas is empty on first boot,
it seeds itself from `seed.json` so LEVY has data immediately.

## Collections it reads (database `Levy`)

| Collection           | Contents                                  |
|----------------------|-------------------------------------------|
| `questions`          | Tariff forecast questions (id = `_id`)    |
| `replay_events`      | Canada replay timeline events             |
| `calibration`        | Calibration curve points                  |
| `resolved_forecasts` | Resolved forecasts + scores               |
| `meta`               | Doc `_id: "brier"` holds `brierScore`     |

## Run locally

```bash
npm install
MONGODB_URI="mongodb+srv://..." LEVY_API_KEY="any-strong-key" npm start
curl -H "Authorization: Bearer any-strong-key" http://localhost:8080/v1/snapshot
```

## Deploy to Render (free)

1. Push this folder to a GitHub repo (or use Render's "Deploy from folder" via the repo).
2. Render → New → Web Service → pick the repo.
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: Free
3. Environment variables:
   - `MONGODB_URI` — your Atlas connection string (`mongodb+srv://...`)
   - `LEVY_API_KEY` — pick a strong random key, e.g. `openssl rand -hex 32`
   - `MONGODB_DB` — `Levy` (default)
4. Deploy. Then give LEVY two values (paste them in chat):
   - `LEVY_API_URL` = `https://<your-render-app>.onrender.com`
   - `LEVY_API_KEY` = the same key you set above
