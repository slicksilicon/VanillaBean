import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import "./PercentageInput.css";
import { adjustFontSizeToFit } from "../../Helpers/TextAdjust";

export type DescriptionPosition = "top" | "left" | "none";

export interface PercentageInputRef {
    reset: () => void;
    setValue: (value: string) => void;
}

interface PercentageInputProps {
    placeholder?: string;
    defaultValue?: string;
    description?: string;
    descriptionPosition?: DescriptionPosition;
    onChange?: (value: string) => void;
    onBlur?: (value: string) => void;
    onFocus?: (value: string) => void;
    onReset?: (placeholder: string) => void;
    className?: string;
    disabled?: boolean;
    maxLength?: number;
}

const PercentageInput = forwardRef<PercentageInputRef, PercentageInputProps>(({
    placeholder = "0.00",
    defaultValue = "",
    description,
    descriptionPosition = "top",
    onChange,
    onBlur,
    onFocus,
    onReset,
    className = "",
    disabled = false,
    maxLength,
}, ref) => {
    const [value, setValue] = useState<string>(defaultValue);
    const [isFocused, setIsFocused] = useState(false);
    const [fontSize, setFontSize] = useState(16);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLDivElement>(null);
    const percentSymbolRef = useRef<HTMLDivElement>(null);

    // Update internal value when defaultValue prop changes
    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    // Reset method exposed via ref
    const reset = useCallback(() => {
        setValue("");
        onChange?.("");
        onReset?.(placeholder);
    }, [onChange, onReset, placeholder]);

    // setValue method exposed via ref
    const setValueMethod = useCallback((newValue: string) => {
        // Clean and format the value
        const numericValue = newValue.replace(/[^0-9.]/g, "");
        const parts = numericValue.split(".");
        let cleanValue = parts[0];
        if (parts.length > 1) {
            cleanValue = parts[0] + "." + parts.slice(1).join("").substring(0, 2);
        }
        setValue(cleanValue);
        onChange?.(cleanValue);
    }, [onChange]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        reset,
        setValue: setValueMethod
    }), [reset, setValueMethod]);

    // Adjust font size based on container dimensions
    const adjustFontSize = useCallback(() => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            
            // Calculate font size based on container dimensions
            let calculatedSize = Math.min(width / 20, height / 3);
            calculatedSize = Math.max(12, Math.min(18, calculatedSize)); // Clamp between 12px and 18px
            
            setFontSize(calculatedSize);
        }
    }, []);

    useEffect(() => {
        adjustFontSize();
        
        const resizeObserver = new ResizeObserver(() => {
            adjustFontSize();
        });
        
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        
        return () => {
            resizeObserver.disconnect();
        };
    }, [adjustFontSize]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        
        // Only allow numbers and decimal point
        const numericValue = newValue.replace(/[^0-9.]/g, "");
        
        // Ensure only one decimal point and limit to 2 decimal places
        const parts = numericValue.split(".");
        let cleanValue = parts[0];
        if (parts.length > 1) {
            cleanValue = parts[0] + "." + parts.slice(1).join("").substring(0, 2); // Limit to 2 decimal places
        }
        
        setValue(cleanValue);
        onChange?.(cleanValue);
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(event.target.value);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        onBlur?.(event.target.value);
    };

    // Adjust description font size to fit container
    useEffect(() => {
        if (descriptionRef.current && description && fontSize > 0) {
            adjustFontSizeToFit(descriptionRef.current, fontSize * 1.1, description, 10);
        }
    }, [description, fontSize]);

    const renderDescription = () => {
        if (!description || descriptionPosition === "none") return null;
        
        return (
            <div 
                ref={descriptionRef}
                className={`percentage-input-description ${descriptionPosition}`}
            >
                {description}
            </div>
        );
    };

    return (
        <div ref={containerRef} className={`percentage-input-container ${descriptionPosition} ${className}`}>
            {descriptionPosition === "top" && renderDescription()}
            <div className="percentage-input-main-row">
                {descriptionPosition === "left" && renderDescription()}
                <div className={`percentage-input-wrapper ${isFocused ? "focused" : ""} ${disabled ? "disabled" : ""}`}>
                    <input
                        ref={inputRef}
                        type="text"
                        inputMode="decimal"
                        value={value}
                        placeholder={placeholder}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        disabled={disabled}
                        maxLength={maxLength}
                        className="percentage-input-field"
                        style={{ fontSize: `${fontSize}px` }}
                    />
                </div>
                
                <div 
                    ref={percentSymbolRef}
                    className="percentage-symbol" 
                    style={{ fontSize: `${fontSize}px` }}
                >
                    %
                </div>
            </div>
        </div>
    );
});

PercentageInput.displayName = "PercentageInput";

export default PercentageInput;
