import React, { useState, useEffect } from "react";
import "./TickSelectorButton.css";

export interface TickSelectorButtonProps {
    id: string;
    label: string;
    initial: boolean;
    isDisabled?: boolean;
    /** Height of the pill in px. Padding, gap and font size are derived from it. */
    size?: number;
    onClick: (id: string) => void;
}

/**
 * A pill that carries its own label and tick together.
 *
 * The tick is always rendered and merely hidden when unselected, so the pill is exactly the
 * same size either way — a row of these never reflows as they are ticked, which matters when
 * they are laid out in a line and clicked in sequence.
 */
const TickSelectorButton: React.FC<TickSelectorButtonProps> = ({ id, label, initial, isDisabled = false, onClick, size = 30 }) => {
    const [isSelected, setIsSelected] = useState(initial);

    useEffect(() => {
        setIsSelected(initial);
    }, [initial]);

    const clickHandler = () => {
        if (isDisabled) return;
        setIsSelected(!isSelected);
        onClick(id);
    };

    return (
        <button
            id={`${id}-${label}`}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            className={`tick-selector${isSelected ? " tick-selector-selected" : ""}`}
            style={{ "--tick-selector-size": `${size}px` } as React.CSSProperties}
            onClick={clickHandler}
            disabled={isDisabled}
        >
            <span className="tick-selector-tick" aria-hidden="true">✓</span>
            <span className="tick-selector-label">{label}</span>
        </button>
    );
};

export default TickSelectorButton;
