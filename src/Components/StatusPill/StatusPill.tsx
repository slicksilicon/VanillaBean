import React, { useEffect, useRef } from "react";
import { adjustFontSizeToFit } from "../../Helpers/TextAdjust";
import "./StatusPill.css";

export type StatusVariant = "success" | "warning" | "danger" | "info" | "primary";

const minFontSize = 8;
const targetFontSize = 12;

interface StatusPillProps {
    text : string;
    variant?: StatusVariant;
    onClick?: () => void;
}

const StatusPill: React.FC<StatusPillProps> = ({
    text,
    variant = "primary",
    onClick,
}) => {
    const pillRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (pillRef.current) {
            adjustFontSizeToFit(pillRef.current, targetFontSize, text, minFontSize);
        }
    }, [text]);

    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (onClick) {
            onClick();
        }
    };

    const pillClasses = [
        "status-pill",
        `status-pill-${variant}`,
        onClick ? "status-pill-clickable" : "",
    ].filter(Boolean).join(" ");

    return (
        <div
            ref={pillRef}
            className={pillClasses}
            onClick={handleClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    const syntheticEvent = e as unknown as React.MouseEvent;
                    handleClick(syntheticEvent);
                }
            } : undefined}
        >
            {text}
        </div>
    );
};

export default StatusPill;