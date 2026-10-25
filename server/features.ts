import { z } from "zod";
import vanillabeanConfig from "../vanillabean.config.json" with { type: "json" };

/*
 * Which optional parts of VanillaBean this app uses - read from the committed vanillabean.config.json, which
 * ./configure.sh writes. The frontend reads the same file at build time (vite.config.ts), so both halves always agree.
 */

const VanillaBeanConfigSchema = z.object({
    features: z.object({
        api: z.boolean(),
        auth: z.enum(["none", "google"]),
        database: z.enum(["none", "mongodb"]),
    }),
    google: z.object({
        clientId: z.string(),
        scopes: z.string(),
    }),
}).refine(config => config.features.api || (config.features.auth === "none" && config.features.database === "none"), {
    message: "features.api must be true when auth or database is enabled - run ./configure.sh",
});

const config = VanillaBeanConfigSchema.parse(vanillabeanConfig);

export const features = {
    api: config.features.api,
    authGoogle: config.features.auth === "google",
    database: config.features.database === "mongodb",
} as const;

export const googleConfig = config.google;
