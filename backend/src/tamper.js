import { openDb } from "./db.js";

// Demo helper: edits a ledger row behind the API's back so the auditor's "chain verified" badge flips to tampered.
const TAMPER_DELTA = 1000;
const BLOCK_ID = 2;

const undo = process.argv.includes("--undo");
const db = openDb();
const row = db.prepare("SELECT id, credit_id, amount FROM ledger WHERE id = ?").get(BLOCK_ID);
if (!row) {
  console.error(`No ledger block #${BLOCK_ID}; run npm run seed first.`);
  process.exit(1);
}
const amount = row.amount + (undo ? -TAMPER_DELTA : TAMPER_DELTA);
db.prepare("UPDATE ledger SET amount = ? WHERE id = ?").run(amount, BLOCK_ID);
db.close();
console.log(`${undo ? "Restored" : "Tampered"} block #${BLOCK_ID} (${row.credit_id}): amount ${row.amount} -> ${amount}`);
