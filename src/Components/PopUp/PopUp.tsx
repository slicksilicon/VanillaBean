import React, { useEffect, useRef } from "react";
import Modal from "../Modal/Modal";
import "./PopUp.css";

export type PopUpResult = "ok" | "cancel" | null;
export type PopUpButtonFormat = "ok-only" | "ok-cancel" | "self-timeout";

interface PopUpProps {
    message: string;
    buttonFormat: PopUpButtonFormat;
    onResult: (result: PopUpResult) => void;
    isVisible: boolean;
}

const TIMEOUT_DURATION_MS = 1500; // 1.5 seconds

const PopUp: React.FC<PopUpProps> = ({ message, buttonFormat, onResult, isVisible }) => {
    const timeoutRef = useRef<number | null>(null);

    // Handle self-timeout
    useEffect(() => {
        if (isVisible && buttonFormat === "self-timeout") {
            timeoutRef.current = setTimeout(() => {
                onResult("ok");
            }, TIMEOUT_DURATION_MS);
        }

        // Cleanup timeout on unmount or when visibility changes
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [isVisible, buttonFormat, onResult]);

    return (
        <Modal isOpen={isVisible} onClose={() => onResult("cancel")} size="small" title={message} className="popup-panel">
            <div className="popup-message">{message}</div>

            {buttonFormat !== "self-timeout" && (
                <div className="popup-buttons">
                    {buttonFormat === "ok-cancel" && (
                        <button
                            className="popup-button popup-button-cancel"
                            onClick={() => onResult("cancel")}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        className="popup-button popup-button-ok"
                        onClick={() => onResult("ok")}
                    >
                        OK
                    </button>
                </div>
            )}
        </Modal>
    );
};

export default PopUp;
