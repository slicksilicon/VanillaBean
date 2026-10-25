import { createRoute, z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { createRouter } from "../router.js";
import { CreateNoteRequest } from "../schema/CreateNoteRequest.js";
import { DeleteNoteResponse } from "../schema/DeleteNoteResponse.js";
import { Note } from "../schema/Note.js";
import { createNote, deleteNote, listNotes } from "../tools/Notes/notes.js";
import type { AppEnv } from "../types.js";

/* Notes - the MongoDB demo. Mounted only when features.database is "mongodb". */

export const router = createRouter();

/** With sign-in on, notes are per user; with it off, everyone shares the "anonymous" notes. */
function ownerOf(c: Context<AppEnv>): string {
    return c.get("user")?.email ?? "anonymous";
}

router.openapi(
    createRoute({
        method: "get",
        path: "/api/notes",
        operationId: "get_notes_api_notes_get",
        tags: ["Notes"],
        summary: "Get Notes",
        responses: { 200: { description: "Notes, newest first", content: { "application/json": { schema: z.array(Note) } } } },
    }),
    async c => c.json(await listNotes(ownerOf(c)), 200),
);

router.openapi(
    createRoute({
        method: "post",
        path: "/api/notes",
        operationId: "create_note_api_notes_post",
        tags: ["Notes"],
        summary: "Create Note",
        request: { body: { required: true, content: { "application/json": { schema: CreateNoteRequest } } } },
        responses: { 201: { description: "The created note", content: { "application/json": { schema: Note } } } },
    }),
    async c => c.json(await createNote(ownerOf(c), c.req.valid("json").text), 201),
);

router.openapi(
    createRoute({
        method: "delete",
        path: "/api/notes/{note_id}",
        operationId: "delete_note_api_notes__note_id__delete",
        tags: ["Notes"],
        summary: "Delete Note",
        request: { params: z.object({ note_id: z.string().openapi({ param: { name: "note_id", in: "path" } }) }) },
        responses: { 200: { description: "Whether a note was removed", content: { "application/json": { schema: DeleteNoteResponse } } } },
    }),
    async c => c.json({ deleted: await deleteNote(ownerOf(c), c.req.valid("param").note_id) }, 200),
);
