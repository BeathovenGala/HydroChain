import { openDb } from "./db.js";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 4000);

const app = createApp(openDb());
app.listen(PORT, () => console.log(`HydroChain API listening on http://localhost:${PORT}`));
