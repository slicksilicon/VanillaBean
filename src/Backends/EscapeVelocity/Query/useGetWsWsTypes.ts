import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { WebSocketMessage } from "./Types";

const fetchGetWsWsTypes = async (): Promise<WebSocketMessage[]> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/ws/ws_types`;
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
        return response.json() as Promise<WebSocketMessage[]>;
    }
    return Promise.resolve([]) as Promise<WebSocketMessage[]>;
};

export const getWsWsTypesQueryKey = () => {
    return ["get_websocket_types_api_ws_ws_types_get"] as const;
};

export const useGetWsWsTypes = (options?: Partial<UseQueryOptions<WebSocketMessage[], Error>>) => {
    return useQuery<WebSocketMessage[], Error>({
        queryKey: getWsWsTypesQueryKey(),
        queryFn: () => fetchGetWsWsTypes(),
        retry: false,
        ...options,
    });
};
