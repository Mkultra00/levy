import { createFileRoute } from "@tanstack/react-router";
import { LevyDesk } from "@/components/levy/levy-desk";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LEVY — Tariff Intelligence Desk" },
      { name: "description", content: "Evidence-linked tariff forecasts, policy signals, and calibration in one decision workspace." },
      { property: "og:title", content: "LEVY — Tariff Intelligence Desk" },
      { property: "og:description", content: "Evidence-linked tariff forecasts, policy signals, and calibration in one decision workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <LevyDesk />;
}
