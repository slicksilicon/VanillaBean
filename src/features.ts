/*
 * Which optional parts of VanillaBean this app uses, fixed at build time from vanillabean.config.json (written by
 * ./configure.sh). The flags are literal constants after the build, so code behind a disabled feature is dropped from
 * the bundle.
 */

export const features = {
    api: __VB_API__,
    authGoogle: __VB_AUTH_GOOGLE__,
    database: __VB_DATABASE__,
} as const;

/** Feature names a segment may list in its `requiredFeatures` export. */
export type FeatureName = "api" | "auth" | "database";

export function isFeatureEnabled(name: string): boolean {
    switch (name) {
        case "api":
            return features.api;
        case "auth":
            return features.authGoogle;
        case "database":
            return features.database;
        default:
            console.warn(`Unknown feature "${name}" in requiredFeatures - expected api, auth or database`);
            return false;
    }
}
