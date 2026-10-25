import { z } from "@hono/zod-openapi";

export const GoogleCallbackRequest = z.object({
    code: z.string().min(1).openapi({ description: "Authorization code received from Google OAuth2 consent flow" }),
    redirect_uri: z.string().min(1).openapi({ description: "Redirect URI used in the OAuth2 flow - \"postmessage\" for the popup flow" }),
}).openapi("GoogleCallbackRequest", { description: "Request model for Google OAuth2 authorization code exchange." });

export type GoogleCallbackRequest = z.infer<typeof GoogleCallbackRequest>;
