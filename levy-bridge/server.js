// LEVY Bridge — standalone Node service backed by MongoDB Atlas.
// Serves GET /v1/snapshot (Bearer auth) for the LEVY app.
// Auto-seeds Atlas from seed.json on first boot if the database is empty.

import express from "express";
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "Levy";
const API_KEY = process.env.LEVY_API_KEY;
const PORT = process.env.PORT || 8080;

if (!MONGODB_URI || !API_KEY) {
  console.error("Missing MONGODB_URI or LEVY_API_KEY env vars — aborting.");
  process.exit(1);
}

const COLLECTIONS = {
  questions: "questions",
  replay: "replay_events",
  calibration: "calibration",
  resolved: "resolved_forecasts",
  meta: "meta",
};

async function seedIfNeeded(db) {
  for (const col of Object.values(COLLECTIONS)) {
    const count = await db.collection(col).countDocuments();
    if (count > 0) return false;
  }
  const seed = JSON.parse(readFileSync(join(__dirname, "seed.json"), "utf8"));
  await db.collection(COLLECTIONS.questions).insertMany(seed.questions.map((q) => ({ ...q, _id: q.id })));
  await db.collection(COLLECTIONS.replay).insertMany(seed.replay.map((r, i) => ({ ...r, _id: `replay-${i}` })));
  await db.collection(COLLECTIONS.calibration).insertMany(seed.calibration.map((c, i) => ({ ...c, _id: `cal-${i}` })));
  await db.collection(COLLECTIONS.resolved).insertMany(seed.resolved.map((r, i) => ({ ...r, _id: `res-${i}` })));
  await db.collection(COLLECTIONS.meta).updateOne(
    { _id: "brier" },
    { $set: { brierScore: seed.brierScore } },
    { upsert: true },
  );
  console.log("Atlas was empty — seeded from seed.json.");
  return true;
}

function clean(doc) {
  if (!doc) return doc;
  const { _id, id, ...rest } = doc;
  return id !== undefined ? { id, ...rest } : rest;
}

async function buildSnapshot(db) {
  const questions = await db.collection(COLLECTIONS.questions).find({}).toArray();
  const replay = await db.collection(COLLECTIONS.replay).find({}).toArray();
  const calibration = await db.collection(COLLECTIONS.calibration).find({}).toArray();
  const resolved = await db.collection(COLLECTIONS.resolved).find({}).toArray();
  const meta = await db.collection(COLLECTIONS.meta).findOne({ _id: "brier" });
  return {
    source: "atlas",
    questions: questions.map((q) => clean({ ...q, id: q._id })),
    replay: replay.map(clean),
    calibration: calibration.map(clean),
    resolved: resolved.map(clean),
    brierScore: meta?.brierScore ?? 0.14,
  };
}

const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
const app = express();

app.get("/health", async (_req, res) => {
  try {
    await client.db("admin").command({ ping: 1 });
    res.json({ ok: true, atlas: true });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.message });
  }
});

app.get("/v1/snapshot", async (req, res) => {
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const db = client.db(DB_NAME);
    const snap = await buildSnapshot(db);
    if (snap.questions.length === 0) {
      await seedIfNeeded(db);
      return res.json(await buildSnapshot(db));
    }
    res.json(snap);
  } catch (e) {
    console.error("Snapshot error:", e.message);
    res.status(502).json({ error: "Atlas unreachable", detail: e.message });
  }
});

async function start() {
  await client.connect();
  const db = client.db(DB_NAME);
  await seedIfNeeded(db);
  app.listen(PORT, () => console.log(`LEVY bridge listening on :${PORT}`));
}

start().catch((e) => {
  console.error("Startup failed:", e.message);
  process.exit(1);
});
