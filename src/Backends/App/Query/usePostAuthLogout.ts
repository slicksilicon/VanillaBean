import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { LogoutResponse } from "./Types";

const fetchPostAuthLogout = async (): Promise<LogoutResponse> => {
    const url = `/api/auth/logout`;
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
        return response.json() as Promise<LogoutResponse>;
    }
    return Promise.resolve({} as LogoutResponse);
};

export const usePostAuthLogout = (options?: Partial<UseMutationOptions<LogoutResponse, Error, void>>) => {
    return useMutation<LogoutResponse, Error, void>({
        mutationFn: () => fetchPostAuthLogout(),
        retry: false,
        ...options,
    });
};
