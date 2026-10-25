import { z } from "@hono/zod-openapi";

export const LogoutResponse = z.object({
    message: z.string().openapi({ description: "Logout confirmation message" }),
}).openapi("LogoutResponse", { description: "Response model for logout endpoint." });

export type LogoutResponse = z.infer<typeof LogoutResponse>;
