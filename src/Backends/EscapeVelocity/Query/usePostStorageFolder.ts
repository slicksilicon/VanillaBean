import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { CreateStorageRequest, CreateStorageResponse } from "./Types";

const fetchPostStorageFolder = async (data: CreateStorageRequest): Promise<CreateStorageResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/storage/folder`;
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
        return response.json() as Promise<CreateStorageResponse>;
    }
    return Promise.resolve({} as CreateStorageResponse);
};

export const usePostStorageFolder = (options?: Partial<UseMutationOptions<CreateStorageResponse, Error, { data: CreateStorageRequest }>>) => {
    return useMutation<CreateStorageResponse, Error, { data: CreateStorageRequest }>({
        mutationFn: ({ data }) => fetchPostStorageFolder(data),
        retry: false,
        ...options,
    });
};
