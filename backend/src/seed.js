import { rmSync } from "node:fs";
import path from "node:path";
import { openDb } from "./db.js";
import { createApp } from "./app.js";

// Builds a realistic demo history through the real API so credits, requests and the ledger stay consistent.
const dataDir = path.resolve(import.meta.dirname, "..", "data");
rmSync(process.env.DB_FILE ?? dataDir, { recursive: true, force: true });

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

const EXTRA_USERS = [
  { username: "solarh2", password: "plant123", role: "Plant", companyName: "SolarH2 Kutch", did: "did:hydro:plant2", governmentLicenseId: "GOV-PL-002" },
  { username: "windh2", password: "plant123", role: "Plant", companyName: "WindH2 Saurashtra", did: "did:hydro:plant3", governmentLicenseId: "GOV-PL-003" },
  { username: "fertico", password: "industry123", role: "Industry", companyName: "FertiCo Ammonia", did: "did:hydro:industry2", governmentLicenseId: "GOV-IN-002" },
  { username: "refinex", password: "industry123", role: "Industry", companyName: "RefineX Petrochem", did: "did:hydro:industry3", governmentLicenseId: "GOV-IN-003" },
];
const LOGINS = {
  greenplant: ["plant123", "did:hydro:plant1"],
  solarh2: ["plant123", "did:hydro:plant2"],
  windh2: ["plant123", "did:hydro:plant3"],
  steelco: ["industry123", "did:hydro:industry1"],
  fertico: ["industry123", "did:hydro:industry2"],
  refinex: ["industry123", "did:hydro:industry3"],
  auditor: ["auditor123"],
};
const DEVICES = { greenplant: "DEVICE-001", solarh2: "DEVICE-101", windh2: "DEVICE-201" };

const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const production = (plant, n, kg, { purity = 99.4, eff = 72 } = {}) =>
  JSON.stringify({ date: daysAgo(n), hydrogenProduced: kg, purity, electricityConsumed: kg * 52, electrolyzerEfficiency: eff, deviceId: DEVICES[plant] });
const transfer = (n, kg, { start = "09:00", end = "12:00" } = {}) =>
  JSON.stringify({ date: daysAgo(n), hydrogenTransferred: kg, transferStartTime: start, transferEndTime: end, transportMethod: kg > 120 ? "Pipeline" : "Tube trailer", trackingId: `TRACK-${1000 + n * 7 + kg}`, "location (from)": "23.456,72.345", "location (to)": "22.307,73.181", deviceId: "DEVICE-301" });
const consumption = (n, kg, timePeriod = "08:00 - 16:00") =>
  JSON.stringify({ date: daysAgo(n), hydrogenConsumed: kg, timePeriod, energySource: "Solar", location: "22.307, 73.181", deviceId: "DEVICE-401" });

const guest = session();
for (const u of EXTRA_USERS) await guest("POST", "/users", { ...u, auditorUsername: "auditor" });

const as = {};
for (const [name, [password, did]] of Object.entries(LOGINS)) {
  as[name] = session();
  await as[name]("POST", `/users/${name}/login`, { password, did });
}
const review = (kind, req, action = "accept") => as.auditor("POST", `/request/${kind}/${req.id}/${action}`);

// [label, plant, kg, daysAgo]
const APPROVED_ISSUES = [
  ["gp120", "greenplant", 120, 28], ["sh200", "solarh2", 200, 27], ["wh140", "windh2", 140, 26],
  ["gp80", "greenplant", 80, 24], ["sh60", "solarh2", 60, 21], ["gp150", "greenplant", 150, 19],
  ["wh90", "windh2", 90, 17], ["gp60", "greenplant", 60, 15], ["sh175", "solarh2", 175, 13],
  ["wh130", "windh2", 130, 11], ["gp95", "greenplant", 95, 10], ["sh110", "solarh2", 110, 8],
  ["gp50", "greenplant", 50, 6], ["wh70", "windh2", 70, 4],
];
const credit = {};
for (const [label, plant, kg, n] of APPROVED_ISSUES) {
  const req = await as[plant]("POST", "/request/issues", { amount: kg, metadata: production(plant, n, kg) });
  credit[label] = (await review("issues", req)).creditId;
}

await review("issues", await as.greenplant("POST", "/request/issues", { amount: 300, metadata: JSON.stringify({ date: "2001-08-30", hydrogenProduced: 300, purity: 70, electricityConsumed: 78, electrolyzerEfficiency: 5, deviceId: "DEVICE-002" }) }), "reject");
await review("issues", await as.windh2("POST", "/request/issues", { amount: 260, metadata: production("windh2", 9, 260, { purity: 72, eff: 31 }) }), "reject");

// [buyer, credit label, daysAgo]
const APPROVED_BUYS = [
  ["steelco", "gp120", 25], ["steelco", "sh200", 23], ["fertico", "sh60", 18], ["fertico", "gp80", 16],
  ["steelco", "wh140", 14], ["refinex", "sh175", 9], ["steelco", "gp150", 7], ["fertico", "wh90", 5], ["refinex", "wh130", 3],
];
const kgOf = Object.fromEntries(APPROVED_ISSUES.map(([label, , kg]) => [label, kg]));
for (const [buyer, label, n] of APPROVED_BUYS) {
  await review("buy", await as[buyer]("POST", "/request/buy", { creditId: credit[label], metadata: transfer(n, kgOf[label]) }));
}
await review("buy", await as.refinex("POST", "/request/buy", { creditId: credit.gp60, metadata: transfer(12, 60, { start: "25:70" }) }), "reject");

for (const [holder, label, n] of [["steelco", "gp120", 20], ["fertico", "sh60", 12], ["steelco", "sh200", 8], ["refinex", "sh175", 4]]) {
  await review("retire", await as[holder]("POST", "/request/retire", { creditId: credit[label], metadata: consumption(n, kgOf[label]) }));
}

// Left pending so the auditor has a queue to work through, including flagged anomalies.
await as.greenplant("POST", "/request/issues", { amount: 40, metadata: production("greenplant", 1, 40) });
await as.solarh2("POST", "/request/issues", { amount: 500, metadata: production("solarh2", 2, 500, { purity: 68, eff: 12 }) });
await as.windh2("POST", "/request/issues", { amount: 85, metadata: production("windh2", 0, 85) });
await as.fertico("POST", "/request/buy", { creditId: credit.gp95, metadata: transfer(1, 95) });
await as.steelco("POST", "/request/buy", { creditId: credit.wh70, metadata: transfer(0, 70, { start: "91:00" }) });
await as.steelco("POST", "/request/retire", { creditId: credit.wh140, metadata: consumption(1, 140) });
await as.refinex("POST", "/request/retire", { creditId: credit.wh130, metadata: consumption(0, 130, "08:00 - 8:00") });

const { valid, entries } = await as.auditor("GET", "/ledger");

// Spread timestamps across the IoT reading dates so the tables read like real history.
db.exec(`
  UPDATE requests SET created_at = json_extract(metadata, '$.date') || ' ' || printf('%02d:%02d:00', 8 + id % 9, (id * 17) % 60)
  WHERE json_extract(metadata, '$.date') >= '2020-01-01';
  UPDATE requests SET created_at = datetime('now', '-22 days', '+3 hours') WHERE json_extract(metadata, '$.date') < '2020-01-01';
  UPDATE credits SET created_at = (SELECT r.created_at FROM requests r WHERE r.type = 'ISSUE' AND r.credit_id = credits.id);
  DELETE FROM sessions;
`);

const pending = db.prepare("SELECT COUNT(*) AS n FROM requests WHERE status = 'PENDING'").get().n;
server.close();
db.close();
console.log(`Seeded demo data: ${APPROVED_ISSUES.length} credits, ${entries.length} ledger entries (chain valid: ${valid}), ${pending} pending requests.`);
