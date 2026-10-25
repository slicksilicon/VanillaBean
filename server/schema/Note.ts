import { z } from "@hono/zod-openapi";

export const Note = z.object({
    id: z.string().openapi({ description: "Note id (MongoDB ObjectId as hex)" }),
    text: z.string().openapi({ description: "Note text" }),
    owner: z.string().openapi({ description: "Email of the user who wrote it, or \"anonymous\" when sign-in is off" }),
    created_at: z.string().openapi({ description: "Creation time, ISO 8601 UTC" }),
}).openapi("Note", { description: "A note stored in MongoDB - the database demo." });

export type Note = z.infer<typeof Note>;
