import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";


const fetchPostWsRegisterLog = async (): Promise<unknown> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/ws/register-log`;
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
        return response.json() as Promise<unknown>;
    }
    return Promise.resolve({} as unknown);
};

export const usePostWsRegisterLog = (options?: Partial<UseMutationOptions<unknown, Error, void>>) => {
    return useMutation<unknown, Error, void>({
        mutationFn: () => fetchPostWsRegisterLog(),
        retry: false,
        ...options,
    });
};
