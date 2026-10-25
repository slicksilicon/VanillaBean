import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { ChildStorageResponse } from "./Types";

const fetchGetStorageFolders = async (queryArgs: { path: string;  }): Promise<ChildStorageResponse> => {
    let url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/storage/folders`;
    const params = new URLSearchParams();
    if (queryArgs?.path !== undefined && queryArgs?.path !== null) {
        if (Array.isArray(queryArgs.path)) { for (const v of queryArgs.path) params.append("path", String(v)); }
        else { params.append("path", String(queryArgs.path)); }
    }
    if (params.toString()) { url += "?" + params.toString(); }
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
        return response.json() as Promise<ChildStorageResponse>;
    }
    return Promise.resolve({} as ChildStorageResponse);
};

export const getStorageFoldersQueryKey = (queryArgs?: { path: string;  }) => {
    const key: unknown[] = ["get_child_folders_api_storage_folders_get"];
    for (const part of [queryArgs]) {
        if (part === undefined) return key;
        key.push(part);
    }
    return key;
};

export const useGetStorageFolders = (queryArgs: { path: string;  }, options?: Partial<UseQueryOptions<ChildStorageResponse, Error>>) => {
    return useQuery<ChildStorageResponse, Error>({
        queryKey: getStorageFoldersQueryKey(queryArgs),
        queryFn: () => fetchGetStorageFolders(queryArgs),
        retry: false,
        ...options,
    });
};
