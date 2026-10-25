import { z } from "@hono/zod-openapi";

export const VersionResponse = z.object({
    version: z.string().openapi({ description: "Current API version in semantic versioning format (MAJOR.MINOR.PATCH)" }),
}).openapi("VersionResponse", { description: "Response model for API version information." });

export type VersionResponse = z.infer<typeof VersionResponse>;
