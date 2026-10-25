import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { IcoSaveRequest, IcoSaveResponse } from "./Types";

const fetchPostImageToolsSaveIco = async (data: IcoSaveRequest): Promise<IcoSaveResponse> => {
    const url = `${import.meta.env.VITE_BACKEND_ESCAPEVELOCITY_URL}/api/image-tools/save-ico`;
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
        return response.json() as Promise<IcoSaveResponse>;
    }
    return Promise.resolve({} as IcoSaveResponse);
};

export const usePostImageToolsSaveIco = (options?: Partial<UseMutationOptions<IcoSaveResponse, Error, { data: IcoSaveRequest }>>) => {
    return useMutation<IcoSaveResponse, Error, { data: IcoSaveRequest }>({
        mutationFn: ({ data }) => fetchPostImageToolsSaveIco(data),
        retry: false,
        ...options,
    });
};
