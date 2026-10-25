import React, { useState } from "react";
import Button, { type ButtonProps } from "../Button/Button";

export interface ButtonToggleProps extends Omit<ButtonProps, "children" | "variant" | "onClick"> {
    values: string[];
    variants: ("primary" | "secondary" | "success" | "info" | "warning" | "danger")[];
    onValueChange?: (value: string, index: number) => void;
    initialIndex?: number;
    minWidth?: string | number;
}

const ButtonToggle: React.FC<ButtonToggleProps> = ({ values, variants, onValueChange, initialIndex = 0, minWidth, ...buttonProps }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    if (values.length === 0) {
        throw new Error("ButtonToggle: values array cannot be empty");
    }

    if (values.length !== variants.length) {
        throw new Error("ButtonToggle: values and variants arrays must have the same length");
    }

    const handleClick = () => {
        const nextIndex = (currentIndex + 1) % values.length;
        setCurrentIndex(nextIndex);
        onValueChange?.(values[nextIndex], nextIndex);
    };

    const minWidthStyle = minWidth !== undefined ? { minWidth: typeof minWidth === "number" ? `${minWidth}px` : minWidth } : {};

    return (
        <Button {...buttonProps} variant={variants[currentIndex]} onClick={handleClick} style={minWidthStyle}>
            {values[currentIndex]}
        </Button>
    );
};

export default ButtonToggle;
