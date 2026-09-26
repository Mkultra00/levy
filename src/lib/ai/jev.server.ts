/**
 * Jev (TypeSafe System One) typed-decision client.
 * Server-only. Primary route: OpenRouter (OPENROUTER_API_KEY, model
 * typesafe/jev-1.13). Fallback route: Lovable AI Gateway /v1/systemone
 * (LOVABLE_API_KEY, model typesafe/jev-latest) — same model, native protocol.
 * Jev returns typed answers (choice / score / noul) with calibrated
 * probabilities — no generated text.
 */

export interface JevQuestion {
  type: "choice" | "score" | "noul";
  instructions: string | Record<string, unknown>;
  criteria?: unknown;
}

export interface JevAnswer {
  choice?: string;
  score?: number;
  noul?: number;
  probabilities?: Record<string, number>;
  confidence?: number;
  legend?: Record<string, unknown>;
}

interface JevRoute {
  url: string;
  model: string;
  key: string | undefined;
  extraHeaders?: Record<string, string>;
}

function routes(): JevRoute[] {
  return [
    {
      url: "https://openrouter.ai/api/alpha/decisions",
      model: "typesafe/jev-1.13",
      key: process.env["OPENROUTER_API_KEY"],
    },
    {
      url: "https://ai.gateway.lovable.dev/v1/systemone",
      model: "typesafe/jev-latest",
      key: process.env["LOVABLE_API_KEY"],
      extraHeaders: { "X-Lovable-AIG-SDK": "fetch" },
    },
  ];
}

/**
 * Runs a batch of typed judgments against one state payload.
 * Returns null when every route fails — callers must degrade gracefully
 * (Jev grades are an enhancement, never a blocker).
 */
export async function jevDecisions(
  state: unknown,
  questions: Record<string, JevQuestion>,
): Promise<Record<string, JevAnswer> | null> {
  for (const route of routes()) {
    if (!route.key) continue;
    try {
      const res = await fetch(route.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${route.key}`,
          "Content-Type": "application/json",
          ...route.extraHeaders,
        },
        body: JSON.stringify({ model: route.model, state, questions }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        console.error(`Jev call failed via ${route.url} [${res.status}]: ${await res.text()}`);
        continue;
      }
      const data = (await res.json()) as { answers?: Record<string, JevAnswer> };
      if (data.answers) return data.answers;
    } catch (error) {
      console.error(`Jev unreachable via ${route.url}:`, error);
    }
  }
  return null;
}
