import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { EnumValuesResponse } from "./Types";

const fetchGetEnums = async (enum_name: string): Promise<EnumValuesResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/enums/${enum_name}`;
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
        return response.json() as Promise<EnumValuesResponse>;
    }
    return Promise.resolve({} as EnumValuesResponse);
};

export const getEnumsQueryKey = (enum_name?: string) => {
    const key: unknown[] = ["get_enum_values_api_enums__enum_name__get"];
    for (const part of [enum_name]) {
        if (part === undefined) return key;
        key.push(part);
    }
    return key;
};

export const useGetEnums = (enum_name: string, options?: Partial<UseQueryOptions<EnumValuesResponse, Error>>) => {
    return useQuery<EnumValuesResponse, Error>({
        queryKey: getEnumsQueryKey(enum_name),
        queryFn: () => fetchGetEnums(enum_name),
        retry: false,
        ...options,
    });
};
