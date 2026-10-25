import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { CreateNoteRequest, Note } from "./Types";

const fetchPostNotes = async (data: CreateNoteRequest): Promise<Note> => {
    const url = `/api/notes`;
    const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            "X-Client-ID": sessionStorage.getItem("x-client-id") || "",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown network error" }));
        throw new Error(errorData.detail || `Network response was not ok: ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json() as Promise<Note>;
    }
    return Promise.resolve({} as Note);
};

export const usePostNotes = (options?: Partial<UseMutationOptions<Note, Error, { data: CreateNoteRequest }>>) => {
    return useMutation<Note, Error, { data: CreateNoteRequest }>({
        mutationFn: ({ data }) => fetchPostNotes(data),
        retry: false,
        ...options,
    });
};
