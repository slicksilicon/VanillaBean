import { z } from "@hono/zod-openapi";

export const DeleteNoteResponse = z.object({
    deleted: z.boolean().openapi({ description: "True when the note existed and was removed" }),
}).openapi("DeleteNoteResponse", { description: "Response model for deleting a note." });

export type DeleteNoteResponse = z.infer<typeof DeleteNoteResponse>;
