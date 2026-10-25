import { z } from "@hono/zod-openapi";

/** User information returned in API responses - same shape as EscapeVelocity's UserInfo. */
export const UserInfo = z.object({
    google_id: z.string().openapi({ description: "Google account unique identifier" }),
    email: z.string().openapi({ description: "User's email address" }),
    name: z.string().openapi({ description: "User's display name" }),
    picture_url: z.string().default("").openapi({ description: "URL to user's profile picture" }),
}).openapi("UserInfo", { description: "User information returned in API responses." });

export type UserInfo = z.infer<typeof UserInfo>;
