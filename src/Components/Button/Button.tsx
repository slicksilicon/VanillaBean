import React from "react";
import "./Button.css";

export interface ButtonProps {
    variant?: "primary" | "secondary" | "success" | "info" | "warning" | "danger" | "gilded-noir";
    size?: "small" | "medium" | "large";
    disabled?: boolean;
    loading?: boolean;
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement> | (() => void);
    type?: "button" | "submit" | "reset";
    className?: string;
    style?: React.CSSProperties;
    /** Native tooltip, for when the label alone doesn't say what the action will do. */
    title?: string;
}

const Button: React.FC<ButtonProps> = ({
    variant = "primary",
    size = "medium",
    disabled = false,
    loading = false,
    children,
    onClick,
    type = "button",
    className = "",
    style,
    title,
}) => {
    const baseClasses = "liquid-glass-button";
    const variantClass = `button-${variant}`;
    const sizeClass = `button-${size}`;
    const disabledClass = disabled || loading ? "button-disabled" : "";
    const loadingClass = loading ? "button-loading" : "";

    const combinedClasses = [
        baseClasses,
        variantClass,
        sizeClass,
        disabledClass,
        loadingClass,
        className
    ].filter(Boolean).join(" ");

    return (
        <button
            type={type}
            className={combinedClasses}
            onClick={onClick}
            disabled={disabled || loading}
            style={style}
            title={title}
        >
            {loading && (
                <div className="button-spinner">
                    <div className="spinner"></div>
                </div>
            )}
            <span className={loading ? "button-content-hidden" : "button-content"}>
                {children}
            </span>
        </button>
    );
};

export default Button;