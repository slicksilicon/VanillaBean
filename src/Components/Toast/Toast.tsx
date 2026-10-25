import { useEffect, useState, type CSSProperties } from "react";
import { subscribeToToasts, type ToastEvent } from "../Toast/toastBus";
import "./Toast.css";

interface ToastMessage extends ToastEvent {
    id: number;
}

const VARIANT_ICON: Record<ToastEvent["variant"], string> = {
    error: "⚠️",
    success: "✓",
    info: "ℹ️",
};

/** Mount once near the app root. Any code can trigger a toast via showToast() from ./toastBus. */
export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        return subscribeToToasts((event) => {
            const id = Date.now() + Math.random();
            setToasts((prev) => [...prev, { ...event, id }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((toast) => toast.id !== id));
            }, event.durationMs);
        });
    }, []);

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="toast-stack">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.variant}`}
                    style={{ "--toast-fade-delay": `${Math.max(toast.durationMs - 400, 0)}ms` } as CSSProperties}
                >
                    <span className="toast-icon">{VARIANT_ICON[toast.variant]}</span>
                    <span className="toast-message">{toast.message}</span>
                </div>
            ))}
        </div>
    );
}
