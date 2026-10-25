import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { PngSaveRequest, PngSaveResponse } from "./Types";

const fetchPostImageToolsSavePng = async (data: PngSaveRequest): Promise<PngSaveResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/image-tools/save-png`;
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
        return response.json() as Promise<PngSaveResponse>;
    }
    return Promise.resolve({} as PngSaveResponse);
};

export const usePostImageToolsSavePng = (options?: Partial<UseMutationOptions<PngSaveResponse, Error, { data: PngSaveRequest }>>) => {
    return useMutation<PngSaveResponse, Error, { data: PngSaveRequest }>({
        mutationFn: ({ data }) => fetchPostImageToolsSavePng(data),
        retry: false,
        ...options,
    });
};
