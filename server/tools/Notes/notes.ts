import { ObjectId } from "mongodb";
import { getCollection, parseObjectId } from "../../db/mongodb.js";
import type { Note } from "../../schema/Note.js";

/*
 * Notes domain logic - the database demo. Routes stay thin shells over these functions (EscapeVelocity's rule that a
 * routes file holds nothing another caller might want).
 */

const COLLECTION = "notes";
const MAX_NOTES = 500;

interface NoteDocument {
    _id: ObjectId;
    text: string;
    owner: string;
    created_at: Date;
}

function toNote(doc: NoteDocument): Note {
    return { id: doc._id.toHexString(), text: doc.text, owner: doc.owner, created_at: doc.created_at.toISOString() };
}

export async function listNotes(owner: string): Promise<Note[]> {
    const notes = await getCollection<NoteDocument>(COLLECTION);
    const docs = await notes.find({ owner }).sort({ created_at: -1 }).limit(MAX_NOTES).toArray();
    return docs.map(toNote);
}

export async function createNote(owner: string, text: string): Promise<Note> {
    const notes = await getCollection<NoteDocument>(COLLECTION);
    const doc: NoteDocument = { _id: new ObjectId(), text, owner, created_at: new Date() };
    await notes.insertOne(doc);
    return toNote(doc);
}

/** True when the note existed and belonged to `owner`. Another user's note id deletes nothing. */
export async function deleteNote(owner: string, noteId: string): Promise<boolean> {
    const notes = await getCollection<NoteDocument>(COLLECTION);
    const result = await notes.deleteOne({ _id: parseObjectId(noteId, "note id"), owner });
    return result.deletedCount === 1;
}
