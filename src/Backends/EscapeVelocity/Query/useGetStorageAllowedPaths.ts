import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { AllowedPathsResponse } from "./Types";

const fetchGetStorageAllowedPaths = async (): Promise<AllowedPathsResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/storage/allowed-paths`;
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
        return response.json() as Promise<AllowedPathsResponse>;
    }
    return Promise.resolve({} as AllowedPathsResponse);
};

export const getStorageAllowedPathsQueryKey = () => {
    return ["get_allowed_paths_api_storage_allowed_paths_get"] as const;
};

export const useGetStorageAllowedPaths = (options?: Partial<UseQueryOptions<AllowedPathsResponse, Error>>) => {
    return useQuery<AllowedPathsResponse, Error>({
        queryKey: getStorageAllowedPathsQueryKey(),
        queryFn: () => fetchGetStorageAllowedPaths(),
        retry: false,
        ...options,
    });
};
