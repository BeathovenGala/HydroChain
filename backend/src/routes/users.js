import { Router } from "express";
import { bearerToken, createSession, hashPassword, requireAuth, verifyPassword } from "../auth.js";

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;
const SELF_SERVICE_ROLES = ["Plant", "Industry"];

const sumOf = (db, sql, ...params) => db.prepare(sql).get(...params).total;

function creditSummary(db, username) {
  return {
    lifeTimeGeneratedCredits: sumOf(db, "SELECT COALESCE(SUM(amount), 0) AS total FROM credits WHERE issuer = ?", username),
    lifeTimeTransferredCredits: sumOf(db, "SELECT COALESCE(SUM(amount), 0) AS total FROM requests WHERE type = 'BUY' AND status = 'APPROVED' AND seller = ?", username),
    lifeTimeBoughtCredits: sumOf(db, "SELECT COALESCE(SUM(amount), 0) AS total FROM requests WHERE type = 'BUY' AND status = 'APPROVED' AND requester = ?", username),
    lifeTimeRetiredCredits: sumOf(db, "SELECT COALESCE(SUM(amount), 0) AS total FROM credits WHERE holder = ? AND retired = 1", username),
    activeAmount: sumOf(db, "SELECT COALESCE(SUM(amount), 0) AS total FROM credits WHERE holder = ? AND retired = 0", username),
    pendingAmount: sumOf(db, "SELECT COALESCE(SUM(amount), 0) AS total FROM requests WHERE status = 'PENDING' AND type IN ('ISSUE', 'BUY') AND requester = ?", username),
  };
}

export function usersRouter(db) {
  const router = Router();
  const auth = requireAuth(db);
  const findUser = db.prepare("SELECT * FROM users WHERE username = ?");

  router.post("/users", (req, res) => {
    const { username, password, role, companyName, did, governmentLicenseId, auditorUsername } = req.body ?? {};
    if (!USERNAME_RE.test(username ?? "")) return res.status(400).json({ success: false, error: "Username must be 3-32 letters, numbers, _ . or -" });
    if (!password || password.length < 6) return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    if (!SELF_SERVICE_ROLES.includes(role)) return res.status(400).json({ success: false, error: "Role must be Plant or Industry" });
    if (!did?.trim()) return res.status(400).json({ success: false, error: "DID is required" });
    if (findUser.get(username)) return res.status(409).json({ success: false, error: "Username already taken" });
    if (auditorUsername) {
      const auditor = findUser.get(auditorUsername);
      if (auditor?.role !== "Auditor") return res.status(400).json({ success: false, error: `No auditor named "${auditorUsername}"` });
    }

    db.prepare(`
      INSERT INTO users (username, password_hash, role, company_name, did, government_license_id, auditor_username)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(username, hashPassword(password), role, companyName ?? null, did.trim(), governmentLicenseId ?? null, auditorUsername || null);
    res.status(201).json({ success: true, data: { username, role } });
  });

  router.post("/users/:username/login", (req, res) => {
    const user = findUser.get(req.params.username);
    const { password, did } = req.body ?? {};
    if (!user || !password || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ success: false, error: "Invalid username or password" });
    }
    if (user.role !== "Auditor" && user.did !== did?.trim()) {
      return res.status(401).json({ success: false, error: "DID does not match this account" });
    }
    res.json({ success: true, data: { username: user.username, role: user.role, token: createSession(db, user.username) } });
  });

  router.post("/logout", (req, res) => {
    const token = bearerToken(req);
    if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    res.json({ success: true });
  });

  router.get("/me", auth, (req, res) => res.json({ success: true, data: req.user }));

  router.get("/users/:username", auth, (req, res) => {
    const user = findUser.get(req.params.username);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    const credits = db.prepare(`
      SELECT id, amount, issuer, created_at AS createdAt FROM credits
      WHERE holder = ? AND retired = 0
        AND id NOT IN (SELECT credit_id FROM requests WHERE status = 'PENDING' AND credit_id IS NOT NULL)
      ORDER BY created_at`).all(user.username);
    res.json({
      success: true,
      data: {
        username: user.username,
        role: user.role,
        companyName: user.company_name,
        auditorUsername: user.auditor_username,
        credits,
        creditSummary: creditSummary(db, user.username),
      },
    });
  });

  return router;
}
