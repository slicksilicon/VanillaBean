import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { EnumRefreshResponse } from "./Types";

const fetchPostEnumsRefresh = async (): Promise<EnumRefreshResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/enums/refresh`;
    const response = await fetch(url, {
        method: "POST",
        credentials: "include",
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
        return response.json() as Promise<EnumRefreshResponse>;
    }
    return Promise.resolve({} as EnumRefreshResponse);
};

export const usePostEnumsRefresh = (options?: Partial<UseMutationOptions<EnumRefreshResponse, Error, void>>) => {
    return useMutation<EnumRefreshResponse, Error, void>({
        mutationFn: () => fetchPostEnumsRefresh(),
        retry: false,
        ...options,
    });
};
