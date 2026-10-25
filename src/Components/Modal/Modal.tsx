import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

export type ModalSize = "small" | "medium" | "large" | "auto";

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Accessible name for the dialog. Renders no visible header — pass your own title/close
     *  markup as children when you need one visible; this only feeds aria-label. */
    title?: string;
    size?: ModalSize;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    className?: string;
    children: React.ReactNode;
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    size = "medium",
    closeOnBackdrop = true,
    closeOnEscape = true,
    className = "",
    children,
}) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    /* ── Focus first focusable element on open; restore focus to the trigger on close ── */
    useEffect(() => {
        if (!isOpen) return;
        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
        const panel = panelRef.current;
        const first = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        (first ?? panel)?.focus();

        return () => {
            previouslyFocusedRef.current?.focus?.();
        };
    }, [isOpen]);

    /* ── Escape-to-close + Tab/Shift-Tab focus trap within the panel ── */
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (closeOnEscape && e.key === "Escape") {
                onClose();
                return;
            }
            if (e.key !== "Tab") return;
            const panel = panelRef.current;
            if (!panel) return;
            const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, closeOnEscape, onClose]);

    /* ── Lock body scroll while open ── */
    useEffect(() => {
        if (!isOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previousOverflow; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
    };

    return createPortal(
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div
                ref={panelRef}
                className={`modal-panel modal-panel-${size} ${className}`}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
            >
                {children}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
