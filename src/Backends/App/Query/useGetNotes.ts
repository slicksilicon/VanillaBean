import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { Note } from "./Types";

const fetchGetNotes = async (): Promise<Note[]> => {
    const url = `/api/notes`;
    const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
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
        return response.json() as Promise<Note[]>;
    }
    return Promise.resolve([]) as Promise<Note[]>;
};

export const getNotesQueryKey = () => {
    return ["get_notes_api_notes_get"] as const;
};

export const useGetNotes = (options?: Partial<UseQueryOptions<Note[], Error>>) => {
    return useQuery<Note[], Error>({
        queryKey: getNotesQueryKey(),
        queryFn: () => fetchGetNotes(),
        retry: false,
        ...options,
    });
};
