import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import "./CurrencyInput.css";
import { adjustFontSizeToFit } from "../../Helpers/TextAdjust";
import { CurrencyList, type Currency } from "../../Query/Types/Currency";

export type CurrencyType = Currency;

export interface CurrencyInputRef {
    reset: () => void;
    setValue: (value: string) => void;
    setCurrency: (currency: CurrencyType) => void;
}

interface CurrencyInputProps {
    value: string; // Always controlled
    currency: CurrencyType; // Always controlled
    placeholder?: string;
    description?: string;
    descriptionOnLeft?: boolean;
    descriptionLeftWidth?: string;
    onChange: (value: string) => void;
    onCurrencyChange?: (currency: CurrencyType) => void;
    className?: string;
    disabled?: boolean;
    maxLength?: number;
}

const CurrencyInput = forwardRef<CurrencyInputRef, CurrencyInputProps>(({
    value,
    currency,
    placeholder = "0.00",
    description,
    descriptionOnLeft = false,
    descriptionLeftWidth,
    onChange,
    onCurrencyChange,
    className = "",
    disabled = false,
    maxLength,
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [fontSize, setFontSize] = useState(16);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLDivElement>(null);
    const currencySymbolRef = useRef<HTMLDivElement>(null);

    // Expose imperative API
    useImperativeHandle(ref, () => ({
        reset: () => {
            onChange("");
        },
        setValue: (newValue: string) => {
            onChange(newValue);
        },
        setCurrency: (newCurrency: CurrencyType) => {
            onCurrencyChange?.(newCurrency);
        }
    }), [onChange, onCurrencyChange]);

    // Currency symbols mapping
    const currencySymbols: Record<CurrencyType, string> = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        JPY: "¥",
        MYR: "RM",
        SGD: "S$",
        AUD: "A$",
        CAD: "C$",
        CHF: "CHF",
        CNY: "¥",
        NZD: "NZ$",
        HKD: "HK$",
    };

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
        
        // Only allow numbers, decimal point, and backspace/delete
        const numericValue = newValue.replace(/[^0-9.]/g, "");
        
        // Ensure only one decimal point
        const parts = numericValue.split(".");
        let cleanValue = parts[0];
        if (parts.length > 1) {
            cleanValue = parts[0] + "." + parts.slice(1).join("").substring(0, 2); // Limit to 2 decimal places
        }
        
        onChange(cleanValue);
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    // Handle click event on currency symbol to cycle to next currency
    const handleCurrencyClick = useCallback(() => {
        if (disabled || !onCurrencyChange) return;
        
        const currentIndex = CurrencyList.indexOf(currency);
        const newIndex = (currentIndex + 1) % CurrencyList.length;
        
        onCurrencyChange(CurrencyList[newIndex] as CurrencyType);
    }, [currency, disabled, onCurrencyChange]);

    // Handle wheel event on currency symbol to cycle through currencies
    const handleCurrencyWheel = useCallback((event: WheelEvent) => {
        if (disabled || !onCurrencyChange) return;
        
        event.preventDefault();
        
        const currentIndex = CurrencyList.indexOf(currency);
        let newIndex;
        
        if (event.deltaY > 0) {
            // Scrolling down - next currency
            newIndex = (currentIndex + 1) % CurrencyList.length;
        } else {
            // Scrolling up - previous currency
            newIndex = (currentIndex - 1 + CurrencyList.length) % CurrencyList.length;
        }
        
        onCurrencyChange(CurrencyList[newIndex] as CurrencyType);
    }, [currency, disabled, onCurrencyChange]);

    // Add wheel event listener to currency symbol
    useEffect(() => {
        const symbolElement = currencySymbolRef.current;
        if (symbolElement && onCurrencyChange) {
            symbolElement.addEventListener("wheel", handleCurrencyWheel, { passive: false });
            
            return () => {
                symbolElement.removeEventListener("wheel", handleCurrencyWheel);
            };
        }
    }, [handleCurrencyWheel, onCurrencyChange]);

    // Adjust description font size to fit container
    useEffect(() => {
        if (descriptionRef.current && description && fontSize > 0) {
            adjustFontSizeToFit(descriptionRef.current, fontSize * 1.1, description, 10);            
        }
    }, [description, fontSize]);

    const renderDescription = () => {
        if (!description) return null;
        
        const descriptionStyle: React.CSSProperties = {};
        
        if (descriptionLeftWidth && descriptionOnLeft) {
            descriptionStyle.width = descriptionLeftWidth;
            descriptionStyle.minWidth = descriptionLeftWidth;
            descriptionStyle.maxWidth = descriptionLeftWidth;
        }
        
        return (
            <div 
                ref={descriptionRef}
                className={`currency-input-description ${descriptionOnLeft ? "currency-input-description-left" : ""}`}
                style={descriptionStyle}
            >
                {description}
            </div>
        );
    };

    const containerClassName = `currency-input-container ${descriptionOnLeft ? "currency-input-layout-horizontal" : ""} ${className}`;

    return (
        <div ref={containerRef} className={containerClassName}>
            {!descriptionOnLeft && renderDescription()}
            <div className="currency-input-main-row">
                {descriptionOnLeft && renderDescription()}
                <div 
                    ref={currencySymbolRef}
                    className="currency-symbol" 
                    style={{ fontSize: `${fontSize}px`, cursor: onCurrencyChange ? "pointer" : "default" }}
                    title={onCurrencyChange ? "Click or scroll to change currency" : undefined}
                    onClick={handleCurrencyClick}
                >
                    {currencySymbols[currency]}
                </div>
                
                <div className={`currency-input-wrapper ${isFocused ? "focused" : ""} ${disabled ? "disabled" : ""}`}>
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
                        className="currency-input-field"
                        style={{ fontSize: `${fontSize}px` }}
                    />
                </div>
            </div>
        </div>
    );
});

CurrencyInput.displayName = "CurrencyInput";

export default CurrencyInput;