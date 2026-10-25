import { z } from "zod";
import packageJson from "../package.json" with { type: "json" };

/*
 * Server settings, read once from the environment: .env.local in dev (server/dev.ts runs with --env-file), the Vercel
 * project's environment variables in production. Nothing here is ever sent to the browser.
 */

const emailList = z.string().default("").transform(value => value.split(",").map(email => email.trim().toLowerCase()).filter(Boolean));

const SettingsSchema = z.object({
    MONGODB_URI: z.string().default(""),
    MONGODB_DATABASE: z.string().default(""),
    JWT_SECRET_KEY: z.string().default(""),
    JWT_EXPIRE_MINUTES: z.coerce.number().int().positive().default(60 * 24 * 7),
    GOOGLE_CLIENT_SECRET: z.string().default(""),
    ALLOWED_EMAILS: emailList,
});

export const settings = SettingsSchema.parse(process.env);

/** npm package name - used for the auth cookie name and the default database name. */
export const projectName = packageJson.name;

export const apiVersion = packageJson.version;

/**
 * Login allowlist. Fails closed: an empty ALLOWED_EMAILS admits nobody, exactly like EscapeVelocity's
 * app_settings.is_email_allowed(). Checked when a token is issued and again on every request.
 */
export function isEmailAllowed(email: string): boolean {
    return settings.ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}

export function databaseName(): string {
    return settings.MONGODB_DATABASE || projectName.replace(/[^A-Za-z0-9_-]/g, "_");
}
