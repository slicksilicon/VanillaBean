import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { DeleteNoteResponse } from "./Types";

const fetchDeleteNotes = async (note_id: string): Promise<DeleteNoteResponse> => {
    const url = `/api/notes/${note_id}`;
    const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "X-Client-ID": sessionStorage.getItem("x-client-id") || "",
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown network error" }));
        throw new Error(errorData.detail || `Network response was not ok: ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json() as Promise<DeleteNoteResponse>;
    }
    return Promise.resolve({} as DeleteNoteResponse);
};

export const useDeleteNotes = (options?: Partial<UseMutationOptions<DeleteNoteResponse, Error, { note_id: string }>>) => {
    return useMutation<DeleteNoteResponse, Error, { note_id: string }>({
        mutationFn: ({ note_id }) => fetchDeleteNotes(note_id),
        retry: false,
        ...options,
    });
};
