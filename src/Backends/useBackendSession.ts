import { useQueries } from "@tanstack/react-query";
import { backendUrl } from "./backends";

/*
 * Probe the EscapeVelocity backends a segment depends on: is each one reachable, does it accept this origin, is the
 * user signed in to it, and do its committed hooks still match its API.
 *
 * VanillaBean has no login of its own. An EscapeVelocity backend authenticates the browser with an HttpOnly
 * `auth-token:<port>` cookie scoped to the host, not the port, so signing in to that app's own UI on the same machine
 * is enough - the cookie rides along on these requests through `credentials: "include"`.
 *
 * These are the only hand-written fetches against a backend. They have to be generic over every backend, which the
 * generated per-backend hooks in src/Backends/<Name>/Query/ are not.
 */

export const BACKEND_SESSION_QUERY_KEY = "backend-session";

export type BackendState =
    | "ok"            // reachable, origin allowed, signed in
    | "signed-out"    // /api/auth/me answered 401
    | "cors-blocked"  // the server answered, but not to this origin - add it to ALLOWED_FRONTEND_URLS
    | "unreachable"   // nothing listening at the URL
    | "unconfigured"; // no VITE_BACKEND_<NAME>_URL in this build

export interface BackendUser {
    name: string;
    email: string;
    picture_url?: string;
}

export interface BackendSession {
    name: string;
    url: string | undefined;
    state: BackendState;
    user?: BackendUser;
    /** Version the backend reports now. */
    liveVersion?: string;
    /** Version recorded in the committed src/Backends/<Name>/openapi.json, when hooks have been generated. */
    generatedVersion?: string;
}

// Only `info` is pulled from each spec, so the full openapi.json files stay out of the bundle.
const generatedSpecs = import.meta.glob<{ version?: string }>("./*/openapi.json", { eager: true, import: "info" });

function generatedVersionOf(name: string): string | undefined {
    return generatedSpecs[`./${name}/openapi.json`]?.version;
}

/** True when the server is up but refused the CORS request - an opaque no-cors response still proves it answered. */
async function answersWithoutCors(url: string): Promise<boolean> {
    try {
        await fetch(`${url}/api/version/`, { mode: "no-cors", cache: "no-store" });
        return true;
    } catch {
        return false;
    }
}

async function probeBackend(name: string): Promise<BackendSession> {
    const url = backendUrl(name);
    const session: BackendSession = { name, url, state: "unconfigured", generatedVersion: generatedVersionOf(name) };
    if (!url) {
        return session;
    }

    try {
        const versionResponse = await fetch(`${url}/api/version/`, { cache: "no-store" });
        if (versionResponse.ok) {
            const body = (await versionResponse.json().catch(() => ({}))) as { version?: string };
            session.liveVersion = body.version;
        }
    } catch {
        return { ...session, state: (await answersWithoutCors(url)) ? "cors-blocked" : "unreachable" };
    }

    try {
        const meResponse = await fetch(`${url}/api/auth/me`, { credentials: "include", cache: "no-store" });
        if (meResponse.status === 401) {
            return { ...session, state: "signed-out" };
        }
        if (!meResponse.ok) {
            throw new Error(`${name} answered /api/auth/me with ${meResponse.status}`);
        }
        return { ...session, state: "ok", user: (await meResponse.json()) as BackendUser };
    } catch (error) {
        // A credentialed request can be refused by CORS even when the plain one was allowed.
        if (error instanceof TypeError) {
            return { ...session, state: "cors-blocked" };
        }
        throw error;
    }
}

/** One probe per backend name, each cached under [BACKEND_SESSION_QUERY_KEY, name]. */
export function useBackendSessions(names: string[]) {
    return useQueries({
        queries: names.map(name => ({
            queryKey: [BACKEND_SESSION_QUERY_KEY, name],
            queryFn: () => probeBackend(name),
            retry: false,
            staleTime: 1000 * 60 * 5,
        })),
    });
}
