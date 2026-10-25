import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { EnumListResponse } from "./Types";

const fetchListEnums = async (): Promise<EnumListResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/enums/`;
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
        return response.json() as Promise<EnumListResponse>;
    }
    return Promise.resolve({} as EnumListResponse);
};

export const listEnumsQueryKey = () => {
    return ["list_enums_api_enums__get"] as const;
};

export const useListEnums = (options?: Partial<UseQueryOptions<EnumListResponse, Error>>) => {
    return useQuery<EnumListResponse, Error>({
        queryKey: listEnumsQueryKey(),
        queryFn: () => fetchListEnums(),
        retry: false,
        ...options,
    });
};
