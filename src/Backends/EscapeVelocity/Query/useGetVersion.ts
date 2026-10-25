import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { VersionResponse } from "./Types";

const fetchGetVersion = async (): Promise<VersionResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/version/`;
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
        return response.json() as Promise<VersionResponse>;
    }
    return Promise.resolve({} as VersionResponse);
};

export const getVersionQueryKey = () => {
    return ["get_version_api_version__get"] as const;
};

export const useGetVersion = (options?: Partial<UseQueryOptions<VersionResponse, Error>>) => {
    return useQuery<VersionResponse, Error>({
        queryKey: getVersionQueryKey(),
        queryFn: () => fetchGetVersion(),
        retry: false,
        ...options,
    });
};
