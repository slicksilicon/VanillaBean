import React, { useState, useRef, useEffect, useCallback } from "react";
import "./Selector.css";

interface SelectorProps {
    items: string[] | number[];
    defaultIndex?: number;
    onSelectionChange?: (value: string | number, index: number) => void;
    className?: string;
    disabled?: boolean;
    loop?: boolean; // Whether to loop back to start/end when reaching limits
}

const Selector: React.FC<SelectorProps> = ({
    items,
    defaultIndex = 0,
    onSelectionChange,
    className = "",
    disabled = false,
    loop = true,
}) => {
    const [currentIndex, setCurrentIndex] = useState<number>(Math.max(0, Math.min(defaultIndex, items.length - 1)));
    const [fontSize, setFontSize] = useState(16);
    const containerRef = useRef<HTMLDivElement>(null);

    // Adjust font size based on container dimensions
    const adjustFontSize = useCallback(() => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            
            // Calculate font size based on container dimensions
            let calculatedSize = Math.min(width / 15, height / 2.5);
            calculatedSize = Math.max(12, Math.min(20, calculatedSize)); // Clamp between 12px and 20px
            
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

    const handlePrevious = () => {
        if (disabled) return;
        
        let newIndex: number;
        if (currentIndex > 0) {
            newIndex = currentIndex - 1;
        } else if (loop) {
            newIndex = items.length - 1;
        } else {
            return; // Don't change if at start and not looping
        }
        
        setCurrentIndex(newIndex);
        onSelectionChange?.(items[newIndex], newIndex);
    };

    const handleNext = () => {
        if (disabled) return;
        
        let newIndex: number;
        if (currentIndex < items.length - 1) {
            newIndex = currentIndex + 1;
        } else if (loop) {
            newIndex = 0;
        } else {
            return; // Don't change if at end and not looping
        }
        
        setCurrentIndex(newIndex);
        onSelectionChange?.(items[newIndex], newIndex);
    };

    const canGoPrevious = loop || currentIndex > 0;
    const canGoNext = loop || currentIndex < items.length - 1;

    return (
        <div 
            ref={containerRef}
            className={`selector-container ${disabled ? "disabled" : ""} ${className}`}
        >
            <button
                className={`selector-button prev-button ${!canGoPrevious || disabled ? "disabled" : ""}`}
                onClick={handlePrevious}
                disabled={disabled || !canGoPrevious}
                type="button"
                style={{ fontSize: `${fontSize}px` }}
            >
                −
            </button>
            
            <div 
                className="selector-display"
                style={{ fontSize: `${fontSize}px` }}
            >
                {items[currentIndex]}
            </div>
            
            <button
                className={`selector-button next-button ${!canGoNext || disabled ? "disabled" : ""}`}
                onClick={handleNext}
                disabled={disabled || !canGoNext}
                type="button"
                style={{ fontSize: `${fontSize}px` }}
            >
                +
            </button>
        </div>
    );
};

export default Selector;