import React from "react";
import "./ToggleSwitch.css";

export interface ToggleSwitchProps {
    /** Whether the toggle is currently enabled/on */
    checked?: boolean;
    /** Callback function called when toggle state changes */
    onChange?: (checked: boolean) => void;
    /** Whether the toggle is disabled */
    disabled?: boolean;
    /** Size variant of the toggle */
    size?: "small" | "medium" | "large";
    /** Color variant of the toggle */
    variant?: "primary" | "success" | "info" | "warning" | "danger";
    /** Optional label text */
    label?: string;
    /** Position of the label relative to the toggle */
    labelPosition?: "left" | "right";
    /** Additional CSS classes */
    className?: string;
    /** Loading state */
    loading?: boolean;
    /** Unique identifier */
    id?: string;
    /** Name attribute for form handling */
    name?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    checked = false,
    onChange,
    disabled = false,
    size = "medium",
    variant = "primary",
    label,
    labelPosition = "right",
    className = "",
    loading = false,
    id,
    name,
}) => {
    const handleToggle = () => {
        if (disabled || loading) return;
        onChange?.(!checked);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            handleToggle();
        }
    };

    const toggleClasses = [
        "liquid-glass-toggle",
        `toggle-${size}`,
        `toggle-${variant}`,
        checked ? "toggle-checked" : "toggle-unchecked",
        disabled ? "toggle-disabled" : "",
        loading ? "toggle-loading" : "",
        className
    ].filter(Boolean).join(" ");

    const toggleElement = (
        <div
            className={toggleClasses}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            role="switch"
            aria-checked={checked}
            aria-disabled={disabled || loading}
            tabIndex={disabled || loading ? -1 : 0}
            id={id}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={handleToggle}
                disabled={disabled || loading}
                className="toggle-input"
                name={name}
                tabIndex={-1}
            />
            <div className="toggle-track">
                <div className="toggle-thumb">
                    {loading && (
                        <div className="toggle-spinner">
                            <div className="spinner"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (label) {
        const labelElement = (
            <label 
                htmlFor={id}
                className={`toggle-label ${disabled || loading ? "toggle-label-disabled" : ""}`}
            >
                {label}
            </label>
        );

        return (
            <div className={`toggle-container ${labelPosition}`}>
                {labelPosition === "left" && labelElement}
                {toggleElement}
                {labelPosition === "right" && labelElement}
            </div>
        );
    }

    return toggleElement;
};

export default ToggleSwitch;