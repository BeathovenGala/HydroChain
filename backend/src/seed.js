import { rmSync } from "node:fs";
import path from "node:path";
import { openDb } from "./db.js";
import { createApp } from "./app.js";

// Builds a realistic demo history through the real API so credits, requests and the ledger stay consistent.
const dataDir = path.resolve(import.meta.dirname, "..", "data");
rmSync(dataDir, { recursive: true, force: true });

const db = openDb();
const server = createApp(db).listen(0);
await new Promise((r) => server.once("listening", r));
const base = `http://localhost:${server.address().port}`;

function session() {
  let token = "";
  return async (method, route, body) => {
    const res = await fetch(base + route, {
      method,
      headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`${method} ${route} -> ${res.status} ${json.error}`);
    if (json.data?.token) token = json.data.token;
    return json.data;
  };
}

async function login(username, password, did) {
  const api = session();
  await api("POST", `/users/${username}/login`, { password, did });
  return api;
}

const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const production = (n, kg, purity = 99.5, eff = 72, device = "DEVICE-001") =>
  JSON.stringify({ date: daysAgo(n), hydrogenProduced: kg, purity, electricityConsumed: kg * 52, electrolyzerEfficiency: eff, deviceId: device });
const transfer = (n, kg) =>
  JSON.stringify({ date: daysAgo(n), hydrogenTransferred: kg, transferStartTime: "09:00", transferEndTime: "12:00", transportMethod: "Pipeline", trackingId: `TRACK-${100 + n}`, "location (from)": "23.456,72.345", "location (to)": "23.567,72.456", deviceId: "DEVICE-003" });
const consumption = (n, kg) =>
  JSON.stringify({ date: daysAgo(n), hydrogenConsumed: kg, timePeriod: "08:00 - 16:00", energySource: "Solar", location: "23.456, 72.345", deviceId: "DEVICE-002" });

const guest = session();
await guest("POST", "/users", { username: "solarh2", password: "plant123", role: "Plant", companyName: "SolarH2 Kutch", did: "did:hydro:plant2", governmentLicenseId: "GOV-PL-002", auditorUsername: "auditor" });
await guest("POST", "/users", { username: "fertico", password: "industry123", role: "Industry", companyName: "FertiCo Ammonia", did: "did:hydro:industry2", governmentLicenseId: "GOV-IN-002", auditorUsername: "auditor" });

const greenplant = await login("greenplant", "plant123", "did:hydro:plant1");
const solarh2 = await login("solarh2", "plant123", "did:hydro:plant2");
const steelco = await login("steelco", "industry123", "did:hydro:industry1");
const fertico = await login("fertico", "industry123", "did:hydro:industry2");
const auditor = await login("auditor", "auditor123");

const issue = (plant, amount, metadata) => plant("POST", "/request/issues", { amount, metadata });
const review = (kind, req, action = "accept") => auditor("POST", `/request/${kind}/${req.id}/${action}`);

const approvedIssues = [
  [greenplant, 120, production(20, 120)],
  [greenplant, 80, production(14, 80)],
  [greenplant, 50, production(7, 50)],
  [solarh2, 200, production(18, 200, 99.8, 78, "DEVICE-101")],
  [solarh2, 60, production(9, 60, 99.1, 70, "DEVICE-101")],
];
const credits = [];
for (const [plant, amount, meta] of approvedIssues) {
  credits.push((await review("issues", await issue(plant, amount, meta))).creditId);
}
await review("issues", await issue(greenplant, 300, production(4000, 300, 70, 5, "DEVICE-002")), "reject");

const [gp120, gp80, , sh200, sh60] = credits;
await review("buy", await steelco("POST", "/request/buy", { creditId: gp120, metadata: transfer(12, 120) }));
await review("buy", await steelco("POST", "/request/buy", { creditId: sh200, metadata: transfer(10, 200) }));
await review("buy", await fertico("POST", "/request/buy", { creditId: sh60, metadata: transfer(6, 60) }));
await review("retire", await steelco("POST", "/request/retire", { creditId: gp120, metadata: consumption(5, 120) }));

// Left pending so the auditor dashboard has work to show, including one flagged anomaly.
await issue(greenplant, 40, production(1, 40));
await issue(solarh2, 500, production(2, 500, 68, 12, "DEVICE-102"));
await fertico("POST", "/request/buy", { creditId: gp80, metadata: transfer(1, 80) });
await steelco("POST", "/request/retire", { creditId: sh200, metadata: consumption(1, 200) });

const { valid, entries } = (await auditor("GET", "/ledger"));
server.close();
db.close();
console.log(`Seeded demo data: ${credits.length} credits, ${entries.length} ledger entries (chain valid: ${valid}), 4 pending requests.`);
