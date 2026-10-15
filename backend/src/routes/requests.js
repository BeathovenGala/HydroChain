import { Router } from "express";
import { randomBytes } from "node:crypto";
import { requireAuth, requireRole } from "../auth.js";
import { detectAnomalies } from "../anomaly.js";
import { appendLedger } from "../ledger.js";
import { transaction } from "../db.js";

const ROUTE_TYPES = { issues: "ISSUE", buy: "BUY", retire: "RETIRE" };
const MAX_ISSUE_AMOUNT = 1_000_000;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseMetadata(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "metadata must be valid JSON");
  }
}

function toResponse(row) {
  return {
    id: row.id,
    type: row.type,
    requester: row.requester,
    creditId: row.credit_id,
    seller: row.seller,
    amount: row.amount,
    metadata: row.metadata,
    anomaly: Boolean(row.anomaly),
    anomalyReasons: row.anomaly_reasons ? JSON.parse(row.anomaly_reasons) : [],
    status: row.status,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
  };
}

const newCreditId = () => `HC-${randomBytes(4).toString("hex").toUpperCase()}`;

export function requestsRouter(db) {
  const router = Router();
  router.use("/request", requireAuth(db));

  const insertRequest = (type, requester, { creditId = null, seller = null, amount, metadata }) => {
    const reasons = detectAnomalies(type, metadata);
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO requests (type, requester, credit_id, seller, amount, metadata, anomaly, anomaly_reasons)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(type, requester, creditId, seller, amount, metadata ? JSON.stringify(metadata) : null, reasons.length > 0 ? 1 : 0, JSON.stringify(reasons));
    return toResponse(db.prepare("SELECT * FROM requests WHERE id = ?").get(lastInsertRowid));
  };

  const findCredit = db.prepare("SELECT * FROM credits WHERE id = ?");
  const hasPending = db.prepare("SELECT 1 FROM requests WHERE credit_id = ? AND status = 'PENDING'");

  const loadTradableCredit = (creditId) => {
    const credit = findCredit.get(creditId ?? "");
    if (!credit) throw new HttpError(404, "Credit not found");
    if (credit.retired) throw new HttpError(409, "Credit is already retired");
    if (hasPending.get(credit.id)) throw new HttpError(409, "Credit already has a pending request");
    return credit;
  };

  router.post("/request/issues", requireRole("Plant"), (req, res) => {
    const amount = Number(req.body?.amount);
    if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_ISSUE_AMOUNT) throw new HttpError(400, "amount must be a positive whole number");
    const metadata = parseMetadata(req.body?.metadata);
    res.status(201).json({ success: true, data: insertRequest("ISSUE", req.user.username, { amount, metadata }) });
  });

  router.post("/request/buy", requireRole("Industry"), (req, res) => {
    const credit = loadTradableCredit(req.body?.creditId);
    if (credit.holder === req.user.username) throw new HttpError(400, "You already hold this credit");
    const metadata = parseMetadata(req.body?.metadata);
    res.status(201).json({ success: true, data: insertRequest("BUY", req.user.username, { creditId: credit.id, seller: credit.holder, amount: credit.amount, metadata }) });
  });

  router.post("/request/retire", requireRole("Industry"), (req, res) => {
    const credit = loadTradableCredit(req.body?.creditId);
    if (credit.holder !== req.user.username) throw new HttpError(403, "You can only retire credits you hold");
    const metadata = parseMetadata(req.body?.metadata);
    res.status(201).json({ success: true, data: insertRequest("RETIRE", req.user.username, { creditId: credit.id, amount: credit.amount, metadata }) });
  });

  router.get("/request/:kind", (req, res) => {
    const type = ROUTE_TYPES[req.params.kind];
    if (!type) throw new HttpError(404, "Unknown request type");
    const rows = req.user.role === "Auditor"
      ? db.prepare("SELECT * FROM requests WHERE type = ? ORDER BY id DESC").all(type)
      : db.prepare("SELECT * FROM requests WHERE type = ? AND requester = ? ORDER BY id DESC").all(type, req.user.username);
    res.json({ success: true, data: rows.map(toResponse) });
  });

  router.post("/request/:kind/:id/:action", requireRole("Auditor"), (req, res) => {
    const type = ROUTE_TYPES[req.params.kind];
    const { action } = req.params;
    if (!type || !["accept", "reject"].includes(action)) throw new HttpError(404, "Unknown route");

    const result = transaction(db, () => {
      const request = db.prepare("SELECT * FROM requests WHERE id = ? AND type = ?").get(Number(req.params.id), type);
      if (!request) throw new HttpError(404, "Request not found");
      if (request.status !== "PENDING") throw new HttpError(409, `Request was already ${request.status.toLowerCase()}`);

      let txHash = null;
      let creditId = request.credit_id;
      if (action === "accept") {
        if (type === "ISSUE") {
          creditId = newCreditId();
          db.prepare("INSERT INTO credits (id, issuer, holder, amount) VALUES (?, ?, ?, ?)").run(creditId, request.requester, request.requester, request.amount);
          txHash = appendLedger(db, { type, creditId, toUser: request.requester, amount: request.amount });
        } else {
          const credit = findCredit.get(creditId);
          if (credit.retired) throw new HttpError(409, "Credit is already retired");
          if (type === "BUY") {
            if (credit.holder !== request.seller) throw new HttpError(409, "Seller no longer holds this credit");
            db.prepare("UPDATE credits SET holder = ? WHERE id = ?").run(request.requester, creditId);
            txHash = appendLedger(db, { type: "TRANSFER", creditId, fromUser: request.seller, toUser: request.requester, amount: credit.amount });
          } else {
            if (credit.holder !== request.requester) throw new HttpError(409, "Requester no longer holds this credit");
            db.prepare("UPDATE credits SET retired = 1 WHERE id = ?").run(creditId);
            txHash = appendLedger(db, { type, creditId, fromUser: request.requester, amount: credit.amount });
          }
        }
      }

      db.prepare(`
        UPDATE requests SET status = ?, credit_id = ?, reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?`)
        .run(action === "accept" ? "APPROVED" : "REJECTED", creditId, req.user.username, request.id);
      return { ...toResponse(db.prepare("SELECT * FROM requests WHERE id = ?").get(request.id)), txHash };
    });
    res.json({ success: true, data: result });
  });

  return router;
}

export { HttpError };
