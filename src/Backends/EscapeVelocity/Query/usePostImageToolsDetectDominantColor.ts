import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { DominantColorResponse } from "./Types";

const fetchPostImageToolsDetectDominantColor = async (data: { file: File }): Promise<DominantColorResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/image-tools/detect-dominant-color`;
    const formData = new FormData();
    formData.append("file", data.file);
    const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            "X-Client-ID": sessionStorage.getItem("x-client-id") || "",
        },
        body: formData,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown network error" }));
        throw new Error(errorData.detail || `Network response was not ok: ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json() as Promise<DominantColorResponse>;
    }
    return Promise.resolve({} as DominantColorResponse);
};

export const usePostImageToolsDetectDominantColor = (options?: Partial<UseMutationOptions<DominantColorResponse, Error, { data: { file: File } }>>) => {
    return useMutation<DominantColorResponse, Error, { data: { file: File } }>({
        mutationFn: ({ data }) => fetchPostImageToolsDetectDominantColor(data),
        retry: false,
        ...options,
    });
};
