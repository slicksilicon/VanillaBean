import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { BgRemoveResponse } from "./Types";

const fetchPostImageToolsRemoveBackground = async (data: { file: File; tolerance?: number }): Promise<BgRemoveResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/image-tools/remove-background`;
    const formData = new FormData();
    formData.append("file", data.file);
    if (data.tolerance !== undefined && data.tolerance !== null) formData.append("tolerance", String(data.tolerance));
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
        return response.json() as Promise<BgRemoveResponse>;
    }
    return Promise.resolve({} as BgRemoveResponse);
};

export const usePostImageToolsRemoveBackground = (options?: Partial<UseMutationOptions<BgRemoveResponse, Error, { data: { file: File; tolerance?: number } }>>) => {
    return useMutation<BgRemoveResponse, Error, { data: { file: File; tolerance?: number } }>({
        mutationFn: ({ data }) => fetchPostImageToolsRemoveBackground(data),
        retry: false,
        ...options,
    });
};
