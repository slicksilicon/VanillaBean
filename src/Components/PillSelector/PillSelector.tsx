import React, { useState, useEffect } from "react";
import "./PillSelector.css";

export interface PillSelectorProps {
    items: string[];
    onSelectionChange: (selectedItem: string, index: number) => void;
    defaultSelectedItem?: string | null;
    orientation?: "horizontal" | "vertical";
    highlightFirstN?: number;
    colorScheme?: "primary" | "secondary" | "success" | "info" | "warning" | "danger";
    size?: "small" | "medium" | "large";
}

const PillSelector: React.FC<PillSelectorProps> = ({
    items,
    onSelectionChange,
    defaultSelectedItem = null,
    orientation = "horizontal",
    highlightFirstN = 0,
    colorScheme = "primary",
    size = "medium",
}) => {
    const [selectedItem, setSelectedItem] = useState<string | null>(defaultSelectedItem);

    useEffect(() => {
        setSelectedItem(defaultSelectedItem);
    }, [defaultSelectedItem]);

    const handleItemClick = (item: string, index: number) => {
        setSelectedItem(item);
        onSelectionChange(item, index);
    };

    const isHighlighted = (index: number): boolean => {
        return index < highlightFirstN;
    };

    return (
        <div 
            className={`pill-selector-container pill-selector-${orientation}`}
            role="radiogroup"
        >
            {items.map((item, index) => (
                <button
                    key={`${item}-${index}`}
                    className={`
                        pill-selector-item
                        pill-selector-${size}
                        pill-selector-${colorScheme}
                        ${selectedItem === item ? "pill-selector-selected" : ""}
                        ${isHighlighted(index) ? "pill-selector-highlighted" : ""}
                    `.trim().replace(/\s+/g, " ")}
                    onClick={() => handleItemClick(item, index)}
                    role="radio"
                    aria-checked={selectedItem === item}
                    aria-label={item}
                >
                    {item}
                </button>
            ))}
        </div>
    );
};

export default PillSelector;
