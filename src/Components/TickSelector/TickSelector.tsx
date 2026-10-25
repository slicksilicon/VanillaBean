import React, { useState, useRef, useEffect, useCallback } from "react";
import "./TickSelector.css";

export interface TickSelectorItem {
    id: string | number;
    label: string;
    disabled?: boolean;
}

export type SelectionMode = "single" | "multiple";
export type Layout = "horizontal" | "vertical";

interface TickSelectorProps {
    items: TickSelectorItem[];
    mode?: SelectionMode;
    layout?: Layout;
    defaultSelected?: (string | number)[];
    onSelectionChange?: (selectedIds: (string | number)[], selectedItems: TickSelectorItem[]) => void;
    className?: string;
    disabled?: boolean;
    maxHeight?: string;
    title?: string;
}

const TickSelector: React.FC<TickSelectorProps> = ({
    items,
    mode = "multiple",
    layout = "vertical",
    defaultSelected = [],
    onSelectionChange,
    className = "",
    disabled = false,
    maxHeight = "300px",
    title,
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set(defaultSelected));
    const [fontSize, setFontSize] = useState(14);
    const containerRef = useRef<HTMLDivElement>(null);

    // Adjust font size based on container dimensions
    const adjustFontSize = useCallback(() => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            
            // Calculate font size based on container dimensions
            let calculatedSize = Math.min(width / 25, height / 20);
            calculatedSize = Math.max(12, Math.min(16, calculatedSize)); // Clamp between 12px and 16px
            
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

    const handleItemClick = (item: TickSelectorItem) => {
        if (disabled || item.disabled) return;

        let newSelectedIds: Set<string | number>;

        if (mode === "single") {
            // Single selection mode - replace current selection
            newSelectedIds = new Set([item.id]);
        } else {
            // Multiple selection mode - toggle selection
            newSelectedIds = new Set(selectedIds);
            if (selectedIds.has(item.id)) {
                newSelectedIds.delete(item.id);
            } else {
                newSelectedIds.add(item.id);
            }
        }

        setSelectedIds(newSelectedIds);

        // Call onChange callback
        if (onSelectionChange) {
            const selectedIdsArray = Array.from(newSelectedIds);
            const selectedItems = items.filter(item => newSelectedIds.has(item.id));
            onSelectionChange(selectedIdsArray, selectedItems);
        }
    };

    const isSelected = (itemId: string | number): boolean => {
        return selectedIds.has(itemId);
    };

    const renderTickIcon = (selected: boolean) => {
        if (mode === "single") {
            return (
                <div className={`tick-icon radio-icon ${selected ? "selected" : ""}`}>
                    {selected && <div className="radio-dot" />}
                </div>
            );
        } else {
            return (
                <div className={`tick-icon checkbox-icon ${selected ? "selected" : ""}`}>
                    {selected && <span className="checkmark">✓</span>}
                </div>
            );
        }
    };

    const renderItem = (item: TickSelectorItem) => {
        const selected = isSelected(item.id);
        const itemDisabled = disabled || item.disabled;

        return (
            <div
                key={item.id}
                className={`tick-item ${selected ? "selected" : ""} ${itemDisabled ? "disabled" : ""} ${layout}`}
                onClick={() => handleItemClick(item)}
                style={{ fontSize: `${fontSize}px` }}
            >
                {renderTickIcon(selected)}
                <span className="tick-label">{item.label}</span>
            </div>
        );
    };

    return (
        <div 
            ref={containerRef}
            className={`tick-selector-container ${layout} ${disabled ? "disabled" : ""} ${className}`}
        >
            {title && (
                <div className="tick-selector-title" style={{ fontSize: `${fontSize + 2}px` }}>
                    {title}
                </div>
            )}
            
            <div 
                className={`tick-items-container ${layout}`} 
                style={{ 
                    maxHeight: layout === "vertical" ? maxHeight : "auto",
                }}
            >
                {items.map(renderItem)}
            </div>
        </div>
    );
};

export default TickSelector;