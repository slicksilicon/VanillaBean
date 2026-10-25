import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { UserInfo } from "./Types";

const fetchGetAuthMe = async (): Promise<UserInfo> => {
    const url = `/api/auth/me`;
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
        return response.json() as Promise<UserInfo>;
    }
    return Promise.resolve({} as UserInfo);
};

export const getAuthMeQueryKey = () => {
    return ["get_current_user_info_api_auth_me_get"] as const;
};

export const useGetAuthMe = (options?: Partial<UseQueryOptions<UserInfo, Error>>) => {
    return useQuery<UserInfo, Error>({
        queryKey: getAuthMeQueryKey(),
        queryFn: () => fetchGetAuthMe(),
        retry: false,
        ...options,
    });
};
