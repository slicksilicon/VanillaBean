import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";


const fetchGetEnumsKeys = async (enum_name: string): Promise<string[]> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/enums/${enum_name}/keys`;
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
        return response.json() as Promise<string[]>;
    }
    return Promise.resolve([]) as Promise<string[]>;
};

export const getEnumsKeysQueryKey = (enum_name?: string) => {
    const key: unknown[] = ["get_enum_keys_api_enums__enum_name__keys_get"];
    for (const part of [enum_name]) {
        if (part === undefined) return key;
        key.push(part);
    }
    return key;
};

export const useGetEnumsKeys = (enum_name: string, options?: Partial<UseQueryOptions<string[], Error>>) => {
    return useQuery<string[], Error>({
        queryKey: getEnumsKeysQueryKey(enum_name),
        queryFn: () => fetchGetEnumsKeys(enum_name),
        retry: false,
        ...options,
    });
};
