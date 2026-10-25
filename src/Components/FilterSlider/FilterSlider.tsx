import { useState, useRef, useEffect, useCallback } from "react";
import "./FilterSlider.css";

export interface FilterSliderItem {
    label: string;
    icon?: React.ReactNode;
}

export interface FilterSliderProps {
    items: FilterSliderItem[];
    selectedIndex?: number;
    onSelectionChange?: (index: number, item: FilterSliderItem) => void;
    className?: string;
    colorScheme?: "primary" | "info" | "success" | "warning" | "danger";
    disabled?: boolean;
}

const FilterSlider: React.FC<FilterSliderProps> = ({ items, selectedIndex = 0, onSelectionChange, className = "", colorScheme = "info", disabled = false }) => {
    const [activeIndex, setActiveIndex] = useState(selectedIndex);
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        setActiveIndex(selectedIndex);
    }, [selectedIndex]);

    const updateIndicator = useCallback(() => {
        if (activeIndex < 0 || activeIndex >= items.length) {
            setIndicatorStyle({ opacity: "0" });
            return;
        }

        const activeButton = itemRefs.current[activeIndex];
        if (activeButton && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const buttonRect = activeButton.getBoundingClientRect();
            setIndicatorStyle({
                left: `${buttonRect.left - containerRect.left}px`,
                width: `${buttonRect.width}px`,
                opacity: "1",
            });
        }
    }, [activeIndex, items.length]);

    useEffect(() => {
        const timeoutId = setTimeout(() => updateIndicator(), 10);
        return () => clearTimeout(timeoutId);
    }, [activeIndex, updateIndicator]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => updateIndicator());
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        updateIndicator();
        return () => resizeObserver.disconnect();
    }, [updateIndicator]);

    const handleItemClick = (index: number) => {
        if (disabled) return;
        setActiveIndex(index);
        onSelectionChange?.(index, items[index]);
    };

    return (
        <div ref={containerRef} className={`filter-slider filter-slider-${colorScheme}${disabled ? " filter-slider-disabled" : ""} ${className}`}>
            <div className="filter-slider-indicator" style={indicatorStyle} />
            {items.map((item, index) => (
                <button
                    key={index}
                    ref={(el) => { itemRefs.current[index] = el; }}
                    className={`filter-slider-item${index === activeIndex ? " active" : ""}`}
                    onClick={() => handleItemClick(index)}
                    type="button"
                    disabled={disabled}
                >
                    {item.icon && <span className="filter-slider-icon">{item.icon}</span>}
                    <span className="filter-slider-label">{item.label}</span>
                </button>
            ))}
        </div>
    );
};

export default FilterSlider;
