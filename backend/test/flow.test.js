import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { openDb } from "../src/db.js";
import { createApp } from "../src/app.js";

let server;
let base;

before(async () => {
  server = createApp(openDb(":memory:")).listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

function client() {
  let token = "";
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (json.data?.token) token = json.data.token;
    return { status: res.status, body: json };
  };
}

const NORMAL_ISSUE = { date: "2025-08-30", hydrogenProduced: 100, purity: 99, electricityConsumed: 500, electrolyzerEfficiency: 75, deviceId: "DEVICE-001" };
const BAD_ISSUE = { date: "2001-08-30", hydrogenProduced: 1101, purity: 70, electricityConsumed: 78, electrolyzerEfficiency: 5, deviceId: "DEVICE-002" };

test("rejects unauthenticated /me and wrong DID", async () => {
  const api = client();
  assert.equal((await api("GET", "/me")).status, 401);
  assert.equal((await api("POST", "/users/greenplant/login", { password: "plant123", did: "wrong" })).status, 401);
});

test("register validates input and rejects duplicates", async () => {
  const api = client();
  assert.equal((await api("POST", "/users", { username: "x", password: "secret1", role: "Plant", did: "d" })).status, 400);
  assert.equal((await api("POST", "/users", { username: "newplant", password: "secret1", role: "Auditor", did: "d" })).status, 400);
  const ok = await api("POST", "/users", { username: "newplant", password: "secret1", role: "Plant", did: "did:x", auditorUsername: "auditor" });
  assert.equal(ok.status, 201);
  assert.equal((await api("POST", "/users", { username: "newplant", password: "secret1", role: "Plant", did: "did:x" })).status, 409);
});

test("full issue -> buy -> retire lifecycle", async () => {
  const plant = client();
  const industry = client();
  const auditor = client();
  await plant("POST", "/users/greenplant/login", { password: "plant123", did: "did:hydro:plant1" });
  await industry("POST", "/users/steelco/login", { password: "industry123", did: "did:hydro:industry1" });
  await auditor("POST", "/users/auditor/login", { password: "auditor123" });

  assert.equal((await plant("GET", "/me")).body.data.role, "Plant");
  assert.equal((await industry("POST", "/request/issues", { amount: 1 })).status, 403);

  const good = await plant("POST", "/request/issues", { amount: 5, metadata: JSON.stringify(NORMAL_ISSUE) });
  assert.equal(good.status, 201);
  assert.equal(good.body.data.anomaly, false);
  const bad = await plant("POST", "/request/issues", { amount: 3, metadata: JSON.stringify(BAD_ISSUE) });
  assert.equal(bad.body.data.anomaly, true);
  assert.ok(bad.body.data.anomalyReasons.length >= 3);

  assert.equal((await plant("GET", "/users/greenplant")).body.data.creditSummary.pendingAmount, 8);
  assert.equal((await plant("POST", `/request/issues/${good.body.data.id}/accept`)).status, 403);

  const accepted = await auditor("POST", `/request/issues/${good.body.data.id}/accept`);
  assert.equal(accepted.status, 200);
  assert.match(accepted.body.data.txHash, /^[0-9a-f]{64}$/);
  assert.equal((await auditor("POST", `/request/issues/${good.body.data.id}/accept`)).status, 409);
  await auditor("POST", `/request/issues/${bad.body.data.id}/reject`);

  const plantView = (await industry("GET", "/users/greenplant")).body.data;
  assert.equal(plantView.credits.length, 1);
  assert.equal(plantView.creditSummary.activeAmount, 5);
  const creditId = plantView.credits[0].id;

  assert.equal((await industry("POST", "/request/retire", { creditId })).status, 403);
  const buy = await industry("POST", "/request/buy", { creditId, metadata: "{}" });
  assert.equal(buy.status, 201);
  assert.equal((await industry("POST", "/request/buy", { creditId })).status, 409);
  await auditor("POST", `/request/buy/${buy.body.data.id}/accept`);

  const steel = (await industry("GET", "/users/steelco")).body.data;
  assert.equal(steel.creditSummary.activeAmount, 5);
  assert.equal(steel.creditSummary.lifeTimeBoughtCredits, 5);
  assert.equal((await plant("GET", "/users/greenplant")).body.data.creditSummary.lifeTimeTransferredCredits, 5);

  const retire = await industry("POST", "/request/retire", { creditId, metadata: JSON.stringify({ timePeriod: "08:00 - 16:00" }) });
  assert.equal(retire.body.data.anomaly, false);
  await auditor("POST", `/request/retire/${retire.body.data.id}/accept`);
  const after = (await industry("GET", "/users/steelco")).body.data;
  assert.equal(after.creditSummary.lifeTimeRetiredCredits, 5);
  assert.equal(after.creditSummary.activeAmount, 0);
  assert.equal((await industry("POST", "/request/retire", { creditId })).status, 409);

  const lists = await auditor("GET", "/request/issues");
  assert.equal(lists.body.data.length, 2);
  assert.equal((await plant("GET", "/request/buy")).body.data.length, 0);

  const ledger = (await auditor("GET", "/ledger")).body.data;
  assert.equal(ledger.valid, true);
  assert.deepEqual(ledger.entries.map((e) => e.type), ["ISSUE", "TRANSFER", "RETIRE"]);
});

test("iot index switches scenarios", async () => {
  const api = client();
  assert.equal((await api("GET", "/iot/index")).body.plant, 1);
  assert.equal((await api("PUT", "/iot/index", { scenario: "anomaly" })).body.plant, 0);
  assert.equal((await api("PUT", "/iot/index", { scenario: "bogus" })).status, 400);
  await api("PUT", "/iot/index", { scenario: "normal" });
});
