import { features } from "../features.js";
import { router as authRouter } from "./routes_auth.js";
import { router as notesRouter } from "./routes_notes.js";
import { router as versionRouter } from "./routes_version.js";
import type { createRouter } from "../router.js";

/*
 * Every router, and the feature that switches it on. A bundled function cannot scan the filesystem the way
 * EscapeVelocity's routeParser.py does, so new routes_<name>.ts files are listed here by hand - ./check.sh fails if one
 * is missing.
 */
export const ROUTERS: { name: string; router: ReturnType<typeof createRouter>; enabled: boolean }[] = [
    { name: "version", router: versionRouter, enabled: true },
    { name: "auth", router: authRouter, enabled: features.authGoogle },
    { name: "notes", router: notesRouter, enabled: features.database },
];
