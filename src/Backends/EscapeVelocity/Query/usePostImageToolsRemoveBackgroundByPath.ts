import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { RemoveBackgroundByPathRequest, RemoveBackgroundByPathResponse } from "./Types";

const fetchPostImageToolsRemoveBackgroundByPath = async (data: RemoveBackgroundByPathRequest): Promise<RemoveBackgroundByPathResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/image-tools/remove-background-by-path`;
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
        return response.json() as Promise<RemoveBackgroundByPathResponse>;
    }
    return Promise.resolve({} as RemoveBackgroundByPathResponse);
};

export const usePostImageToolsRemoveBackgroundByPath = (options?: Partial<UseMutationOptions<RemoveBackgroundByPathResponse, Error, { data: RemoveBackgroundByPathRequest }>>) => {
    return useMutation<RemoveBackgroundByPathResponse, Error, { data: RemoveBackgroundByPathRequest }>({
        mutationFn: ({ data }) => fetchPostImageToolsRemoveBackgroundByPath(data),
        retry: false,
        ...options,
    });
};
