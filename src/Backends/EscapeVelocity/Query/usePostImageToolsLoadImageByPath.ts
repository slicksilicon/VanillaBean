import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { LoadImageByPathRequest, LoadImageByPathResponse } from "./Types";

const fetchPostImageToolsLoadImageByPath = async (data: LoadImageByPathRequest): Promise<LoadImageByPathResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/image-tools/load-image-by-path`;
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
        return response.json() as Promise<LoadImageByPathResponse>;
    }
    return Promise.resolve({} as LoadImageByPathResponse);
};

export const usePostImageToolsLoadImageByPath = (options?: Partial<UseMutationOptions<LoadImageByPathResponse, Error, { data: LoadImageByPathRequest }>>) => {
    return useMutation<LoadImageByPathResponse, Error, { data: LoadImageByPathRequest }>({
        mutationFn: ({ data }) => fetchPostImageToolsLoadImageByPath(data),
        retry: false,
        ...options,
    });
};
