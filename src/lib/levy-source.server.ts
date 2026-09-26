import {
  calibrationData,
  replayEvents,
  resolvedForecasts,
  tariffQuestions,
  type ReplayEvent,
  type TariffQuestion,
} from "@/lib/levy-data";

/** Shape returned by the external LEVY agent service (backed by MongoDB Atlas). */
export interface LevySnapshot {
  source: "atlas" | "demo";
  questions: TariffQuestion[];
  replay: ReplayEvent[];
  calibration: { forecast: number; actual: number }[];
  resolved: { event: string; probability: number; outcome: string; score: number }[];
  brierScore: number;
}

const demo = (): LevySnapshot => ({
  source: "demo",
  questions: tariffQuestions,
  replay: replayEvents,
  calibration: calibrationData,
  resolved: resolvedForecasts,
  brierScore: 0.14,
});

/**
 * Reads the live snapshot from the separate agent service (GET {LEVY_API_URL}/v1/snapshot).
 * Falls back to deterministic demo data when unset or unreachable, so the demo never breaks.
 */
export async function loadLevySnapshot(): Promise<LevySnapshot> {
  const base = process.env['LEVY_API_URL'];
  const key = process.env['LEVY_API_KEY'];
  if (!base || !key) return demo();
  try {
    const res = await fetch(`${base.replace(/\/+$/, "")}/v1/snapshot`, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`LEVY API failed [${res.status}]: ${await res.text()}`);
      return demo();
    }
    const data = (await res.json()) as Partial<LevySnapshot>;
    if (!Array.isArray(data.questions)) return demo();
    const d = demo();
    return {
      source: "atlas",
      questions: data.questions,
      replay: data.replay ?? d.replay,
      calibration: data.calibration ?? d.calibration,
      resolved: data.resolved ?? d.resolved,
      brierScore: data.brierScore ?? d.brierScore,
    };
  } catch (error) {
    console.error("LEVY API unreachable:", error);
    return demo();
  }
}
