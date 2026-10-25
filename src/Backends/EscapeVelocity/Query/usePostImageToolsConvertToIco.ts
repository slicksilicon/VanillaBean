import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { IcoConvertResponse } from "./Types";

const fetchPostImageToolsConvertToIco = async (data: { file: File }): Promise<IcoConvertResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/image-tools/convert-to-ico`;
    const formData = new FormData();
    formData.append("file", data.file);
    const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            "X-Client-ID": sessionStorage.getItem("x-client-id") || "",
        },
        body: formData,
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

export const usePostImageToolsConvertToIco = (options?: Partial<UseMutationOptions<IcoConvertResponse, Error, { data: { file: File } }>>) => {
    return useMutation<IcoConvertResponse, Error, { data: { file: File } }>({
        mutationFn: ({ data }) => fetchPostImageToolsConvertToIco(data),
        retry: false,
        ...options,
    });
};
