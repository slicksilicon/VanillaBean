import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import "./DropdownSelector.css";
import { adjustFontSizeToFit } from "../../Helpers/TextAdjust";

export interface Option {
    id: string;
    value: string;
}

export interface DropdownSelectorRef {
    reset: () => void;
}

interface DropdownSelectorProps {
    options: Option[]; // Array of { value, label } objects
    value: Option | null; // Always controlled
    placeholder?: string;
    description?: string;
    descriptionOnTheLeft?: boolean;
    descriptionLeftWidth?: string;
    onChange: (selected : Option | null) => void;
    className?: string;
}

const DropdownSelector = forwardRef<DropdownSelectorRef, DropdownSelectorProps>(({
    options,
    value,
    placeholder = "Please Select ...",
    description,
    descriptionOnTheLeft = false,
    descriptionLeftWidth,
    onChange,
    className = "",
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [fontSize, setFontSize] = useState(16);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const descriptionRef = useRef<HTMLDivElement>(null);

    // Expose reset function to parent components
    useImperativeHandle(ref, () => ({
        reset: () => {
            onChange(null);
            setIsOpen(false);
        }
    }), [onChange]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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

    const handleItemClick = (option: Option) => {
        onChange(option);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + "...";
    };

    // Calculate max characters based on container width and font size
    const getMaxCharacters = () => {
        if (containerRef.current) {
            const width = containerRef.current.getBoundingClientRect().width;
            const charWidth = fontSize * 0.6; // Approximate character width
            return Math.floor(width / charWidth) - 5; // Leave some padding
        }
        return 20; // Default fallback
    };

    // Adjust description font size to fit container
    useEffect(() => {
        if (descriptionRef.current && description && descriptionOnTheLeft && fontSize > 0) {
            adjustFontSizeToFit(descriptionRef.current, fontSize * 1.1, description, 10);
        }
    }, [description, descriptionOnTheLeft, fontSize, descriptionLeftWidth]);

    const renderDescription = () => {
        if (!description) return null;

        const descriptionStyle: React.CSSProperties = {};

        if (descriptionLeftWidth && descriptionOnTheLeft) {
            descriptionStyle.width = descriptionLeftWidth;
            descriptionStyle.minWidth = descriptionLeftWidth;
            descriptionStyle.maxWidth = descriptionLeftWidth;
        }

        return (
            <div
                ref={descriptionRef}
                className={`dropdown-description ${descriptionOnTheLeft ? "left" : ""}`}
                style={descriptionStyle}
            >
                {description}
            </div>
        );
    };

    const maxChars = getMaxCharacters();
    const selectedOption = options.find(o => o.id === value?.id);
    const displayLabel = selectedOption ? selectedOption.value : placeholder;
    const displayValue = (!value || value.value === placeholder) ? placeholder : truncateText(displayLabel, maxChars);

    return (
        <div ref={containerRef} className={`dropdown-container ${isOpen ? "open" : ""} ${descriptionOnTheLeft ? "left" : ""} ${className}`}>
            <div className="dropdown-main-row">
                {descriptionOnTheLeft && renderDescription()}

                <div ref={dropdownRef} className={`dropdown-selector ${isOpen ? "open" : ""}`}>
                    <button className="dropdown-trigger" onClick={toggleDropdown} type="button" style={{ fontSize: `${fontSize}px` }}>
                        <span className="dropdown-value">{displayValue}</span>
                        <span className={`dropdown-arrow ${isOpen ? "up" : "down"}`}>{isOpen ? "▲" : "▼"}</span>
                    </button>

                    {isOpen && (
                        <div className="dropdown-menu">
                            {options.map((option, index) => (
                                <button
                                    key={index}
                                    className={`dropdown-item ${value?.id === option.id ? "selected" : ""}`}
                                    onClick={() => handleItemClick(option)}
                                    type="button"
                                    style={{ fontSize: `${fontSize * 0.9}px` }}>
                                    {truncateText(option.value, maxChars)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

DropdownSelector.displayName = "DropdownSelector";

export default DropdownSelector;
