import { createRemoteJWKSet, jwtVerify } from "jose";
import { settings } from "../config.js";
import { googleConfig } from "../features.js";
import { BadRequestError, ServiceUnavailableError, UnauthorizedError } from "../errors.js";
import type { UserInfo } from "../schema/UserInfo.js";

/*
 * Google OAuth2 authorization-code exchange and ID-token verification - the server half of EscapeVelocity's popup
 * sign-in (LoginScreen sends the code with redirect_uri "postmessage"). The client secret never leaves the server.
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

interface GoogleTokenResponse {
    id_token?: string;
}

export async function exchangeAuthCode(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
    if (!googleConfig.clientId || !settings.GOOGLE_CLIENT_SECRET) {
        throw new ServiceUnavailableError("Google sign-in is not configured on this server");
    }
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: googleConfig.clientId,
            client_secret: settings.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
        }),
    });
    if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string; error_description?: string };
        throw new BadRequestError(`Google rejected the sign-in: ${body.error_description ?? body.error ?? response.status}`);
    }
    return (await response.json()) as GoogleTokenResponse;
}

export async function verifyGoogleIdToken(idToken: string): Promise<UserInfo> {
    try {
        const { payload } = await jwtVerify(idToken, googleKeys, { issuer: GOOGLE_ISSUERS, audience: googleConfig.clientId });
        if (typeof payload.sub !== "string" || typeof payload.email !== "string" || payload.email_verified !== true) {
            throw new UnauthorizedError("Google account has no verified email address");
        }
        return {
            google_id: payload.sub,
            email: payload.email,
            name: typeof payload.name === "string" ? payload.name : payload.email,
            picture_url: typeof payload.picture === "string" ? payload.picture : "",
        };
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            throw error;
        }
        throw new UnauthorizedError("Google ID token could not be verified");
    }
}
