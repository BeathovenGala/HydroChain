import { createHash } from "node:crypto";

// Append-only hash chain: each entry commits to the previous one, so tampering with any row breaks verification.
const GENESIS_HASH = "0".repeat(64);

function computeHash(entry) {
  const payload = [entry.prevHash, entry.type, entry.creditId, entry.fromUser ?? "", entry.toUser ?? "", entry.amount, entry.createdAt].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

export function appendLedger(db, { type, creditId, fromUser = null, toUser = null, amount }) {
  const last = db.prepare("SELECT hash FROM ledger ORDER BY id DESC LIMIT 1").get();
  const entry = { type, creditId, fromUser, toUser, amount, prevHash: last?.hash ?? GENESIS_HASH, createdAt: new Date().toISOString() };
  const hash = computeHash(entry);
  db.prepare(`
    INSERT INTO ledger (type, credit_id, from_user, to_user, amount, prev_hash, hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(type, creditId, fromUser, toUser, amount, entry.prevHash, hash, entry.createdAt);
  return hash;
}

export function readLedger(db) {
  const rows = db.prepare("SELECT * FROM ledger ORDER BY id").all();
  let prevHash = GENESIS_HASH;
  let valid = true;
  const entries = rows.map((r) => {
    const entry = { type: r.type, creditId: r.credit_id, fromUser: r.from_user, toUser: r.to_user, amount: r.amount, prevHash: r.prev_hash, createdAt: r.created_at };
    const ok = r.prev_hash === prevHash && computeHash(entry) === r.hash;
    valid &&= ok;
    prevHash = r.hash;
    return { ...entry, id: r.id, hash: r.hash, valid: ok };
  });
  return { valid, entries };
}
