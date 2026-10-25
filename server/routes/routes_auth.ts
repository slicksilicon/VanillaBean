import { createRoute } from "@hono/zod-openapi";
import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { isEmailAllowed, settings } from "../config.js";
import { ForbiddenError, ServiceUnavailableError, UnauthorizedError } from "../errors.js";
import { createRouter } from "../router.js";
import { AUTH_COOKIE_NAME } from "../auth/middleware.js";
import { exchangeAuthCode, verifyGoogleIdToken } from "../auth/google.js";
import { createJwt } from "../auth/jwt.js";
import { GoogleCallbackRequest } from "../schema/GoogleCallbackRequest.js";
import { LogoutResponse } from "../schema/LogoutResponse.js";
import { UserInfo } from "../schema/UserInfo.js";
import type { AppEnv } from "../types.js";

/*
 * Google sign-in, on EscapeVelocity's paths and operation ids so the generated hooks (useGetAuthMe,
 * usePostAuthGoogleCallback, usePostAuthLogout) match what EscapeVelocity's useAuth.tsx expects. Stateless: nothing is
 * stored, the JWT cookie carries the session.
 */

export const router = createRouter();

const json = (schema: typeof UserInfo | typeof LogoutResponse, description: string) => ({
    description,
    content: { "application/json": { schema } },
});

async function issueSession(c: Context<AppEnv>, user: UserInfo): Promise<void> {
    if (!settings.JWT_SECRET_KEY) {
        throw new ServiceUnavailableError("Authentication is not configured on this server");
    }
    setCookie(c, AUTH_COOKIE_NAME, await createJwt(user), {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
        maxAge: settings.JWT_EXPIRE_MINUTES * 60,
    });
}

function currentUser(c: Context<AppEnv>): UserInfo {
    const user = c.get("user");
    if (!user) {
        throw new UnauthorizedError("Missing authentication credentials");
    }
    return user;
}

router.openapi(
    createRoute({
        method: "post",
        path: "/api/auth/google/callback",
        operationId: "google_callback_api_auth_google_callback_post",
        tags: ["Authentication"],
        summary: "Google Callback",
        description: "Exchange a Google authorization code for app authentication and set the HttpOnly session cookie.",
        request: { body: { required: true, content: { "application/json": { schema: GoogleCallbackRequest } } } },
        responses: { 200: json(UserInfo, "The signed-in user") },
    }),
    async c => {
        const { code, redirect_uri } = c.req.valid("json");
        const tokens = await exchangeAuthCode(code, redirect_uri);
        if (!tokens.id_token) {
            throw new UnauthorizedError("No ID token received from Google");
        }
        const user = await verifyGoogleIdToken(tokens.id_token);
        // Reject any account not on the allowlist before a token is ever issued.
        if (!isEmailAllowed(user.email)) {
            throw new ForbiddenError("This Google account is not authorized to access this application");
        }
        await issueSession(c, user);
        return c.json(user, 200);
    },
);

router.openapi(
    createRoute({
        method: "get",
        path: "/api/auth/me",
        operationId: "get_current_user_info_api_auth_me_get",
        tags: ["Authentication"],
        summary: "Get Current User Info",
        responses: { 200: json(UserInfo, "The signed-in user") },
    }),
    c => c.json(currentUser(c), 200),
);

router.openapi(
    createRoute({
        method: "post",
        path: "/api/auth/refresh",
        operationId: "refresh_token_api_auth_refresh_post",
        tags: ["Authentication"],
        summary: "Refresh Token",
        description: "Issue a fresh session cookie for the signed-in user, extending the session.",
        responses: { 200: json(UserInfo, "The signed-in user") },
    }),
    async c => {
        const user = currentUser(c);
        await issueSession(c, user);
        return c.json(user, 200);
    },
);

router.openapi(
    createRoute({
        method: "post",
        path: "/api/auth/logout",
        operationId: "logout_api_auth_logout_post",
        tags: ["Authentication"],
        summary: "Logout",
        responses: { 200: json(LogoutResponse, "Logout confirmation") },
    }),
    c => {
        deleteCookie(c, AUTH_COOKIE_NAME, { path: "/", secure: true });
        return c.json({ message: "Logged out" }, 200);
    },
);
