import React from "react";
import "./Checkbox.css";

export interface CheckboxProps {
    checked?: boolean;
    /** Renders the "some but not all" dash — for a checkbox standing in for a group of children.
     *  Clicking an indeterminate box selects the whole group (`onChange(true)`), which is the
     *  behaviour a partially-filled box invites. Ignored when `checked` is true. */
    indeterminate?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    colorScheme?: "primary" | "secondary" | "success" | "info" | "warning" | "danger";
    /** `compact` is the density variant for table/grid rows: a small flat box with an inline
     *  tick, no hover scaling and no overflowing checkmark, so it fits a ~26px row. */
    size?: "compact" | "small" | "medium" | "large";
    label?: string;
    className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
    checked = false,
    indeterminate = false,
    onChange,
    disabled = false,
    colorScheme = "primary",
    size = "medium",
    label,
    className = "",
}) => {
    const isPartial = indeterminate && !checked;

    const handleClick = () => {
        if (!disabled && onChange) {
            onChange(isPartial ? true : !checked);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            handleClick();
        }
    };

    const containerClasses = [
        "checkbox-container",
        `checkbox-${size}`,
        disabled ? "checkbox-disabled" : "",
        className,
    ].filter(Boolean).join(" ");

    const boxClasses = [
        "checkbox-box",
        `checkbox-box-${colorScheme}`,
        checked ? "checkbox-box-checked" : "",
        isPartial ? "checkbox-box-indeterminate" : "",
        disabled ? "checkbox-box-disabled" : "",
    ].filter(Boolean).join(" ");

    return (
        <div className={containerClasses}>
            <div
                className={boxClasses}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                role="checkbox"
                aria-checked={isPartial ? "mixed" : checked}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
            >
                {checked && (
                    <span className="checkbox-checkmark">🗸</span>
                )}
                {isPartial && (
                    <span className="checkbox-dash" />
                )}
            </div>
            {label && (
                <label className="checkbox-label" onClick={handleClick}>
                    {label}
                </label>
            )}
        </div>
    );
};

export default Checkbox;
