/*
 * Registry helpers for the EscapeVelocity backends a VanillaBean app can call when it runs locally.
 *
 * A backend is identified by its folder name under src/Backends/ (e.g. "Tools"). Its base URL comes from
 * VITE_BACKEND_<NAME uppercased>_URL, which build-backends.sh also substitutes into that backend's generated hooks.
 * Leaving the variable unset - as on Vercel - hides every segment that requires the backend.
 */

/** The env var holding a backend's base URL, e.g. "Tools" -> "VITE_BACKEND_TOOLS_URL". */
export function backendEnvVar(name: string): string {
    return `VITE_BACKEND_${name.toUpperCase()}_URL`;
}

/** The backend's base URL without a trailing slash, or undefined when it is not configured for this build. */
export function backendUrl(name: string): string | undefined {
    const value: unknown = import.meta.env[backendEnvVar(name)];
    if (typeof value !== "string" || value.trim() === "") {
        return undefined;
    }
    return value.trim().replace(/\/+$/, "");
}

/** Parse a segment's comma-separated `requiredBackends` export into backend names. */
export function parseBackendList(value: string | undefined): string[] {
    if (!value) {
        return [];
    }
    return value.split(",").map(s => s.trim()).filter(Boolean);
}
