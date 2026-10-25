/**
 * TextInput Component
 * 
 * A controlled text input component with flexible layout and styling options.
 * 
 * @component
 * 
 * @description
 * This component is ALWAYS controlled - it requires both `value` and `onChange` props.
 * The parent component must manage the input state.
 * 
 * @features
 * - Fully controlled component (no internal state for value)
 * - Optional description label with flexible positioning (top or left)
 * - When descriptionOnLeft is true, description appears on the left
 * - When descriptionOnLeft is false/undefined, description appears on top (default)
 * - descriptionLeftWidth controls the width when description is on the left
 * - Support for various input types (text, password, email, number, date, datetime-local)
 * - Internal focus state management for styling
 * - Imperative API via ref for programmatic control (reset, setValue)
 * 
 * @usage
 * 
 * Basic usage:
 * ```tsx
 * const [value, setValue] = useState("");
 * 
 * <TextInput 
 *     value={value}
 *     onChange={setValue}
 *     placeholder="Enter text..."
 * />
 * ```
 * 
 * With description label on top (default):
 * ```tsx
 * <TextInput 
 *     value={name}
 *     onChange={setName}
 *     description="Full Name"
 * />
 * ```
 * 
 * With description label on left:
 * ```tsx
 * <TextInput 
 *     value={name}
 *     onChange={setName}
 *     description="Full Name"
 *     descriptionOnLeft={true}
 *     descriptionLeftWidth="120px"
 * />
 * ```
 * 
 * With ref for programmatic control:
 * ```tsx
 * const inputRef = useRef<TextInputRef>(null);
 * 
 * const handleClear = () => {
 *     inputRef.current?.reset(); // Clears the input
 * };
 * 
 * const handleSetValue = () => {
 *     inputRef.current?.setValue("New value"); // Sets a specific value
 * };
 * 
 * <TextInput 
 *     ref={inputRef}
 *     value={value}
 *     onChange={setValue}
 * />
 * ```
 * 
 * Custom styling with focus states:
 * ```tsx
 * <TextInput 
 *     value={email}
 *     onChange={setEmail}
 *     className="my-custom-input"
 *     type="email"
 * />
 * ```
 * Note: The component internally manages focus state and applies "focused" class.
 * You can target `.text-input-wrapper.focused` in CSS for focus styling.
 * 
 * @see TextInputManaged - For uncontrolled component with internal state management
 */

import { useCallback, forwardRef, useId, useImperativeHandle, useState } from "react";
import "./TextInput.css";

type DescriptionPosition = "top" | "left" | "none";

export interface TextInputRef {
    reset: () => void;
    setValue: (value: string) => void;
}

interface TextInputProps {
    value: string; // Always controlled
    placeholder?: string;
    description?: string; // Description label text
    descriptionOnLeft?: boolean; // If true, description appears on left; if false/undefined, appears on top
    descriptionLeftWidth?: string; // Width of description when on left (e.g., "120px", "30%")
    onChange: (value: string) => void;
    onFocus?: () => void; // Optional callback when input receives focus
    className?: string;
    type?: "text" | "password" | "email" | "number" | "date" | "datetime-local";
    disabled?: boolean;
    maxLength?: number;
    /**
     * Values offered as autocomplete while typing, via a native `<datalist>`.
     *
     * The field stays free text — a suggestion is a shortcut, never a constraint — which is what
     * makes this the right control for a value that is usually one of a few existing strings but
     * must still accept a brand new one. An empty or omitted list renders no datalist at all.
     */
    suggestions?: string[];
}

const TextInput = forwardRef<TextInputRef, TextInputProps>(({
    value,
    placeholder = "",
    description = "",
    descriptionOnLeft = false,
    descriptionLeftWidth,
    onChange,
    onFocus,
    className = "",
    type = "text",
    disabled = false,
    maxLength,
    suggestions
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    // A datalist is linked by id, so two inputs on one screen must not share one.
    const listId = useId();
    const hasSuggestions = (suggestions?.length ?? 0) > 0;
    
    // Derive description position from descriptionOnLeft
    const descriptionPosition: DescriptionPosition = description? (descriptionOnLeft ? "left" : "top") : "none";

    const reset = useCallback(() => {
        onChange("");
    }, [onChange]);

    const setValueMethod = useCallback((newValue: string) => {
        onChange(newValue);
    }, [onChange]);

    useImperativeHandle(ref, () => ({
        reset,
        setValue: setValueMethod
    }), [reset, setValueMethod]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleFocus = () => {
        setIsFocused(true);
        onFocus?.();
    };

    const renderDescription = () => {
        if (description) {
            const descriptionStyle: React.CSSProperties = {};

            if (descriptionPosition === "left" && descriptionLeftWidth) {
                descriptionStyle.width = descriptionLeftWidth;
                descriptionStyle.minWidth = descriptionLeftWidth;
                descriptionStyle.maxWidth = descriptionLeftWidth;
            }

            return (
                <span
                    className={`text-input-description ${descriptionPosition}`}
                    style={descriptionStyle}
                >
                    {description}
                </span>
            );
        }
        return null;
    };

    /* Ensure Value is not null or undefined */
    const placeValue = value ?? "";

    return (
        <div className={`text-input-container ${descriptionPosition} ${className}`}>
            {descriptionPosition === "top" && renderDescription()}
            <div className="text-input-main-row">
                {descriptionPosition === "left" && renderDescription()}
                <div className={`text-input-wrapper ${disabled ? "disabled" : ""} ${isFocused ? "focused" : ""}`}>
                    <input
                        type={type}
                        value={placeValue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={handleFocus}
                        placeholder={placeholder}
                        disabled={disabled}
                        maxLength={maxLength}
                        list={hasSuggestions ? listId : undefined}
                        className="text-input-field"
                    />
                    {hasSuggestions && (
                        <datalist id={listId}>
                            {suggestions?.map((suggestion) => (
                                <option key={suggestion} value={suggestion} />
                            ))}
                        </datalist>
                    )}
                </div>
            </div>
        </div>
    );
});

TextInput.displayName = "TextInput";

export default TextInput;