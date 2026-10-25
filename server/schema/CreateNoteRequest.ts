import { z } from "@hono/zod-openapi";

export const CreateNoteRequest = z.object({
    text: z.string().trim().min(1).max(2000).openapi({ description: "Note text, 1-2000 characters" }),
}).openapi("CreateNoteRequest", { description: "Request model for creating a note." });

export type CreateNoteRequest = z.infer<typeof CreateNoteRequest>;
