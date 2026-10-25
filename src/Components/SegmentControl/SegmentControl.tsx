import { useState, useRef, useEffect, useCallback } from "react";
import "./SegmentControl.css";

interface SegmentControlProps {
    items: string[];
    selectedIndex?: number;
    onSelectionChange?: (item: string) => void;
    className?: string;
    colorScheme?: "primary" | "info" | "success" | "warning" | "danger";
}

const SegmentControl: React.FC<SegmentControlProps> = ({ items, selectedIndex = -1, onSelectionChange, className = "", colorScheme = "primary" }) => {
    const [activeIndex, setActiveIndex] = useState(selectedIndex);
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const updateIndicator = useCallback(() => {
        if (activeIndex === -1) {
            // No selection - hide indicator
            setIndicatorStyle({
                opacity: "0",
            });
            return;
        }

        const activeButton = itemRefs.current[activeIndex];
        if (activeButton && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const buttonRect = activeButton.getBoundingClientRect();

            const left = buttonRect.left - containerRect.left;
            const width = buttonRect.width;

            setIndicatorStyle({
                left: `${left}px`,
                width: `${width}px`,
                opacity: "1",
            });
        }
    }, [activeIndex]);

    // Update indicator when activeIndex changes
    useEffect(() => {
        // Use a small delay to ensure the DOM has updated with the new active class
        const timeoutId = setTimeout(() => {
            updateIndicator();
        }, 10);

        return () => clearTimeout(timeoutId);
    }, [activeIndex, updateIndicator]);

    // Handle resize and initial setup
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            updateIndicator();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Initial setup
        updateIndicator();

        return () => {
            resizeObserver.disconnect();
        };
    }, [updateIndicator]);

    const handleItemClick = (index: number) => {
        setActiveIndex(index);
        onSelectionChange?.(items[index]);
    };

    return (
        <div ref={containerRef} className={`segment-control segment-control-${colorScheme} ${className}`}>
            <div className="segment-indicator" style={indicatorStyle} />
            {items.map((item, index) => (
                <button
                    key={index}
                    ref={(el) => {
                        itemRefs.current[index] = el;
                    }}
                    className={`segment-item ${index === activeIndex ? "active" : ""}`}
                    onClick={() => handleItemClick(index)}
                    type="button">
                    {item}
                </button>
            ))}
        </div>
    );
};

export default SegmentControl;
