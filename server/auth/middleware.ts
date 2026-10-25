import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { isEmailAllowed, projectName, settings } from "../config.js";
import { features } from "../features.js";
import { errorResponse } from "../errors.js";
import { verifyJwt } from "./jwt.js";
import type { AppEnv } from "../types.js";

/*
 * Authenticates every /api request when Google sign-in is enabled - the counterpart of EscapeVelocity's AuthMiddleware.
 *
 * A valid signature is not authorization: the allowlist is checked again here on every request, so removing an email
 * from ALLOWED_EMAILS locks that user out on their next request, not when their token expires.
 */

// Named per project so several VanillaBean apps on localhost never overwrite one another's cookie.
export const AUTH_COOKIE_NAME = `auth-token-${projectName.replace(/[^A-Za-z0-9_-]/g, "_")}`;

const PUBLIC_PATH_PREFIXES = ["/api/auth/google/", "/api/version", "/api/openapi.json"];

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
    if (!features.authGoogle || PUBLIC_PATH_PREFIXES.some(prefix => c.req.path.startsWith(prefix))) {
        return next();
    }

    // Fail closed while the signing key is unset - otherwise anyone could mint a token against an empty key.
    if (!settings.JWT_SECRET_KEY) {
        return errorResponse(c, 503, "ServiceUnavailable", "Authentication is not configured on this server");
    }

    const token = getCookie(c, AUTH_COOKIE_NAME);
    if (!token) {
        return errorResponse(c, 401, "Unauthorized", "Missing authentication credentials");
    }
    const user = await verifyJwt(token);
    if (!user) {
        return errorResponse(c, 401, "Unauthorized", "Invalid or expired authentication token");
    }
    if (!isEmailAllowed(user.email)) {
        return errorResponse(c, 403, "ForbiddenException", "This Google account is not authorized to access this application");
    }

    c.set("user", user);
    return next();
});
