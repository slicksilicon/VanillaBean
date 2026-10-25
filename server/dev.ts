import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { features } from "./features.js";

/*
 * Local API server for ./run.sh. Vite proxies /api here (vite.config.ts), so the browser sees one origin exactly as on
 * Vercel. Started with --env-file-if-exists=.env.local, which is where the dev secrets and MONGODB_URI live.
 */

const port = Number(process.env.API_PORT ?? 7410);

serve({ fetch: createApp().fetch, port, hostname: "127.0.0.1" }, info => {
    const enabled = Object.entries(features).filter(([, on]) => on).map(([name]) => name);
    console.log(`API listening on http://localhost:${info.port} (features: ${enabled.join(", ") || "none"})`);
});
