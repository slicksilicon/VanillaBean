import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { ConvertToIcoByPathRequest, IcoConvertResponse } from "./Types";

const fetchPostImageToolsConvertToIcoByPath = async (data: ConvertToIcoByPathRequest): Promise<IcoConvertResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/image-tools/convert-to-ico-by-path`;
    const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            "X-Client-ID": sessionStorage.getItem("x-client-id") || "",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown network error" }));
        throw new Error(errorData.detail || `Network response was not ok: ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json() as Promise<IcoConvertResponse>;
    }
    return Promise.resolve({} as IcoConvertResponse);
};

export const usePostImageToolsConvertToIcoByPath = (options?: Partial<UseMutationOptions<IcoConvertResponse, Error, { data: ConvertToIcoByPathRequest }>>) => {
    return useMutation<IcoConvertResponse, Error, { data: ConvertToIcoByPathRequest }>({
        mutationFn: ({ data }) => fetchPostImageToolsConvertToIcoByPath(data),
        retry: false,
        ...options,
    });
};
