import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { UserInfo } from "./Types";

const fetchPostAuthRefresh = async (): Promise<UserInfo> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/auth/refresh`;
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
        return response.json() as Promise<UserInfo>;
    }
    return Promise.resolve({} as UserInfo);
};

export const usePostAuthRefresh = (options?: Partial<UseMutationOptions<UserInfo, Error, void>>) => {
    return useMutation<UserInfo, Error, void>({
        mutationFn: () => fetchPostAuthRefresh(),
        retry: false,
        ...options,
    });
};
