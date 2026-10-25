import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import "./StepperSelector.css";

export type StepperVariant = "primary" | "secondary" | "success" | "info" | "warning" | "danger" | "gilded-noir";

export type TitlePosition = "top" | "left" | "none";

export interface StepperSelectorProps<T extends string | number> {
    /** Array of values to select from */
    items: T[];
    /** Currently selected value */
    value: T;
    /** Callback when value changes */
    onChange: (value: T) => void;
    /** Optional title text */
    title?: string;
    /** Position of the title (default: "top") */
    titlePosition?: TitlePosition;
    /** Visual variant matching Button styles (default: "primary") */
    variant?: StepperVariant;
    /** Whether the selector is disabled */
    disabled?: boolean;
    /** Optional CSS class name */
    className?: string;
    /** Optional format function to display values */
    formatValue?: (value: T) => string;
}

export const StepperSelector = <T extends string | number>({
    items,
    value,
    onChange,
    title,
    titlePosition = "top",
    variant = "primary",
    disabled = false,
    className = "",
    formatValue,
}: StepperSelectorProps<T>) => {
    const currentIndex = items.indexOf(value);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handlePrevious = () => {
        if (disabled || currentIndex <= 0) return;
        onChange(items[currentIndex - 1]);
    };

    const handleNext = () => {
        if (disabled || currentIndex >= items.length - 1) return;
        onChange(items[currentIndex + 1]);
    };

    const displayValue = formatValue ? formatValue(value) : String(value);

    const commitEdit = () => {
        setIsEditing(false);
        const parsed = Number(editText);
        if (isNaN(parsed)) return;
        let bestIdx = 0;
        let bestDist = Math.abs(Number(items[0]) - parsed);
        for (let i = 1; i < items.length; i++) {
            const dist = Math.abs(Number(items[i]) - parsed);
            if (dist < bestDist) {
                bestDist = dist;
                bestIdx = i;
            }
        }
        onChange(items[bestIdx]);
    };

    const handleValueClick = () => {
        if (disabled) return;
        setEditText(displayValue);
        setIsEditing(true);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEditText(e.target.value);
    };

    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            commitEdit();
        } else if (e.key === "Escape") {
            setIsEditing(false);
        }
    };

    const isPreviousDisabled = disabled || currentIndex <= 0;
    const isNextDisabled = disabled || currentIndex >= items.length - 1;

    const renderSelector = () => (
        <div className={`stepper-selector stepper-${variant} ${disabled ? "stepper-disabled" : ""} ${className}`}>
            <button
                className={`stepper-button stepper-button-left ${isPreviousDisabled ? "stepper-button-disabled" : ""}`}
                onClick={handlePrevious}
                disabled={isPreviousDisabled}
                aria-label="Previous"
            >
                <span className="stepper-symbol">−</span>
            </button>

            {isEditing ? (
                <input
                    ref={inputRef}
                    className="stepper-value-input"
                    type="text"
                    value={editText}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    onBlur={commitEdit}
                />
            ) : (
                <div className="stepper-value" onClick={handleValueClick}>{displayValue}</div>
            )}

            <button
                className={`stepper-button stepper-button-right ${isNextDisabled ? "stepper-button-disabled" : ""}`}
                onClick={handleNext}
                disabled={isNextDisabled}
                aria-label="Next"
            >
                <span className="stepper-symbol">+</span>
            </button>
        </div>
    );

    if (!title || titlePosition === "none") {
        return renderSelector();
    }

    if (titlePosition === "top") {
        return (
            <div className="stepper-container-vertical">
                <div className="stepper-title">{title}</div>
                {renderSelector()}
            </div>
        );
    }

    // titlePosition === "left"
    return (
        <div className="stepper-container-horizontal">
            <div className="stepper-title">{title}</div>
            {renderSelector()}
        </div>
    );
};

export default StepperSelector;
