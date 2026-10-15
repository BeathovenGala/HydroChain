import { rmSync } from "node:fs";
import path from "node:path";
import { openDb } from "./db.js";

const dataDir = path.resolve(import.meta.dirname, "..", "data");
rmSync(dataDir, { recursive: true, force: true });
openDb().close();
console.log("Database reset: demo users re-seeded, all credits and requests cleared.");
