import { SignJWT, jwtVerify } from "jose";
import { settings } from "../config.js";
import { UserInfo } from "../schema/UserInfo.js";

/*
 * The app's session token: HS256, signed with JWT_SECRET_KEY, carried in an HttpOnly cookie.
 *
 * Sign-in is stateless - there is no user collection - so the token itself carries the user's profile. Never share
 * JWT_SECRET_KEY with another app: HS256 is symmetric, so anyone holding it can mint tokens this API accepts.
 */

function signingKey(): Uint8Array {
    return new TextEncoder().encode(settings.JWT_SECRET_KEY);
}

export async function createJwt(user: UserInfo): Promise<string> {
    return new SignJWT({ email: user.email, name: user.name, picture_url: user.picture_url })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(user.google_id)
        .setIssuedAt()
        .setExpirationTime(`${settings.JWT_EXPIRE_MINUTES}m`)
        .sign(signingKey());
}

/** The user a token was issued to, or null when it is missing, malformed, expired or signed with another key. */
export async function verifyJwt(token: string): Promise<UserInfo | null> {
    try {
        const { payload } = await jwtVerify(token, signingKey(), { algorithms: ["HS256"] });
        const parsed = UserInfo.safeParse({
            google_id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture_url: payload.picture_url,
        });
        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
}
