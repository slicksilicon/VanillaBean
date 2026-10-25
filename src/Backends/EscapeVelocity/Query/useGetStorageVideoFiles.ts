import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { VideoFilesResponse } from "./Types";

const fetchGetStorageVideoFiles = async (queryArgs: { folder_path: string;  }): Promise<VideoFilesResponse> => {
    let url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/storage/video-files`;
    const params = new URLSearchParams();
    if (queryArgs?.folder_path !== undefined && queryArgs?.folder_path !== null) {
        if (Array.isArray(queryArgs.folder_path)) { for (const v of queryArgs.folder_path) params.append("folder_path", String(v)); }
        else { params.append("folder_path", String(queryArgs.folder_path)); }
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
        return response.json() as Promise<VideoFilesResponse>;
    }
    return Promise.resolve({} as VideoFilesResponse);
};

export const getStorageVideoFilesQueryKey = (queryArgs?: { folder_path: string;  }) => {
    const key: unknown[] = ["get_video_files_api_storage_video_files_get"];
    for (const part of [queryArgs]) {
        if (part === undefined) return key;
        key.push(part);
    }
    return key;
};

export const useGetStorageVideoFiles = (queryArgs: { folder_path: string;  }, options?: Partial<UseQueryOptions<VideoFilesResponse, Error>>) => {
    return useQuery<VideoFilesResponse, Error>({
        queryKey: getStorageVideoFilesQueryKey(queryArgs),
        queryFn: () => fetchGetStorageVideoFiles(queryArgs),
        retry: false,
        ...options,
    });
};
