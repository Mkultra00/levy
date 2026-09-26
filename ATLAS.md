# MongoDB Atlas Setup

LEVY uses MongoDB Atlas as its source of truth. The app never talks to Atlas directly — it reads through the `levy-bridge` service.

## Connection

- Cluster: Cluster0 (cluster0.1dzzd2.mongodb.net)
- Database: `Levy`
- Auth: application-user credentials in `MONGODB_URI` (kept out of the repo)

## Collections

- `questions` — forecast questions with probability, grade, evidence, belief timeline
- `replay_events` — timeline events for the Canada replay scenario
- `calibration` — calibration history used by the learning scorecard
- `resolved_forecasts` — closed forecasts with outcomes (drives the reweight learning)
- `meta` — single doc (`_id: "brier"`) holding the aggregate Brier score

## Environment variables

Needed by the bridge (see `levy-bridge/.env.example`):

- `MONGODB_URI` — Atlas connection string
- `MONGODB_DB` — `Levy`
- `LEVY_API_KEY` — bearer token the bridge requires

Needed by the LEVY app:

- `LEVY_API_URL` — bridge base URL
- `LEVY_API_KEY` — same key as above

All values live in the Lovable secret store — never commit real values.
