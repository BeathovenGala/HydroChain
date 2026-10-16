import express from "express";
import { requireAuth } from "./auth.js";
import { readLedger } from "./ledger.js";
import { usersRouter } from "./routes/users.js";
import { requestsRouter } from "./routes/requests.js";

// Indices into the frontend's sample IoT readings: 0 = anomalous reading, 1 = normal reading.
const IOT_SCENARIOS = {
  normal: { plant: 1, industryRetire: 1, industryTransfer: 1 },
  anomaly: { plant: 0, industryRetire: 0, industryTransfer: 0 },
};

export function createApp(db, { corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173" } = {}) {
  const app = express();
  let iotScenario = process.env.IOT_SCENARIO in IOT_SCENARIOS ? process.env.IOT_SCENARIO : "normal";

  app.use(express.json({ limit: "100kb" }));
  app.use((req, res, next) => {
    res.set({
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    });
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  app.get("/health", (req, res) => res.json({ success: true, data: { status: "ok" } }));

  // Replaces the npoint.io JSON the frontend used to pick which sample IoT reading to show.
  app.get("/iot/index", (req, res) => res.json({ ...IOT_SCENARIOS[iotScenario], scenario: iotScenario }));
  app.put("/iot/index", (req, res) => {
    const { scenario } = req.body ?? {};
    if (!(scenario in IOT_SCENARIOS)) return res.status(400).json({ success: false, error: "scenario must be 'normal' or 'anomaly'" });
    iotScenario = scenario;
    res.json({ ...IOT_SCENARIOS[iotScenario], scenario: iotScenario });
  });

  app.get("/ledger", requireAuth(db), (req, res) => res.json({ success: true, data: readLedger(db) }));

  app.use(usersRouter(db));
  app.use(requestsRouter(db));

  app.use((req, res) => res.status(404).json({ success: false, error: "Not found" }));
  app.use((err, req, res, next) => {
    const status = err.status ?? err.statusCode ?? 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ success: false, error: status >= 500 ? "Internal server error" : err.message });
  });

  return app;
}
