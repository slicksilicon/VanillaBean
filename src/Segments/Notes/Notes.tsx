import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import TextInput from "../../Components/TextInput/TextInput";
import Button from "../../Components/Button/Button";
import QueryState from "../../Components/QueryState/QueryState";
import { showToast } from "../../Components/Toast/toastBus";
import { useGetNotes } from "../../Backends/App/Query/useGetNotes";
import { usePostNotes } from "../../Backends/App/Query/usePostNotes";
import { useDeleteNotes } from "../../Backends/App/Query/useDeleteNotes";
import { invalidateNotesData } from "../../Hooks/appInvalidation";

import "./Notes.css";

/*
 * The database demo: notes kept in MongoDB (local mongod in dev, Atlas on Vercel). Everything goes through the hooks
 * generated from server/ - the segment never sees the database. Hidden unless features.database is "mongodb".
 */
const Notes: React.FC = () => {
    const queryClient = useQueryClient();
    const [text, setText] = useState("");
    const { data: notes, isLoading, isError, error, refetch } = useGetNotes();

    const createNote = usePostNotes({
        onSuccess: () => {
            setText("");
            void invalidateNotesData(queryClient);
        },
        onError: (err) => showToast(err.message, { variant: "error" }),
    });
    const deleteNote = useDeleteNotes({
        onSuccess: () => void invalidateNotesData(queryClient),
        onError: (err) => showToast(err.message, { variant: "error" }),
    });

    const submit = () => {
        if (text.trim()) {
            createNote.mutate({ data: { text } });
        }
    };

    return (
        <div className="notes-container">
            <div className="notes-editor">
                <TextInput value={text} onChange={setText} placeholder="Write a note" description="New note" />
                <Button variant="primary" onClick={submit} loading={createNote.isPending} disabled={!text.trim()}>
                    Add note
                </Button>
            </div>
            <div className="notes-list">
                <QueryState
                    isLoading={isLoading}
                    isError={isError}
                    error={error}
                    isEmpty={!notes?.length}
                    emptyMessage="No notes yet"
                    onRetry={() => void refetch()}
                >
                    {notes?.map(note => (
                        <div key={note.id} className="notes-item">
                            <div className="notes-item-body">
                                <span className="notes-item-text">{note.text}</span>
                                <span className="notes-item-meta">{new Date(note.created_at).toLocaleString()} - {note.owner}</span>
                            </div>
                            <Button
                                variant="danger"
                                size="small"
                                onClick={() => deleteNote.mutate({ note_id: note.id })}
                                disabled={deleteNote.isPending}
                            >
                                Delete
                            </Button>
                        </div>
                    ))}
                </QueryState>
            </div>
        </div>
    );
};

export default Notes;
export const segmentName = "Notes";
export const requiredFeatures = "database";
