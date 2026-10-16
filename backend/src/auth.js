import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSession(db, username) {
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, username) VALUES (?, ?)").run(token, username);
  return token;
}

// Bearer tokens (kept per browser tab by the frontend) let several roles stay logged in side by side.
export function bearerToken(req) {
  const match = /^Bearer\s+([0-9a-f]{64})$/i.exec(req.get("authorization") ?? "");
  return match?.[1];
}

export function requireAuth(db) {
  const findUser = db.prepare(`
    SELECT u.username, u.role FROM sessions s JOIN users u ON u.username = s.username WHERE s.token = ?`);
  return (req, res, next) => {
    const token = bearerToken(req);
    const user = token ? findUser.get(token) : undefined;
    if (!user) return res.status(401).json({ success: false, error: "Not authenticated" });
    req.user = user;
    next();
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: `Only ${roles.join("/")} users can do this` });
    }
    next();
  };
}
