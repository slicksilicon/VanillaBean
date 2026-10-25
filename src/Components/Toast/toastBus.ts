export type ToastVariant = "info" | "success" | "error";

export interface ToastEvent {
    message: string;
    variant: ToastVariant;
    durationMs: number;
}

interface ToastOptions {
    variant?: ToastVariant;
    durationMs?: number;
}

type ToastListener = (event: ToastEvent) => void;

const DEFAULT_DURATION_MS = 4000;

const listeners = new Set<ToastListener>();

/** Fire-and-forget: show a small auto-dismissing toast in the bottom-right corner. */
export function showToast(message: string, options?: ToastOptions): void {
    const event: ToastEvent = {
        message,
        variant: options?.variant ?? "info",
        durationMs: options?.durationMs ?? DEFAULT_DURATION_MS,
    };
    listeners.forEach((listener) => listener(event));
}

export function subscribeToToasts(listener: ToastListener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
