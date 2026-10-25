import { useState, useEffect, forwardRef } from "react";
import DropdownSelector from "./DropdownSelector";
import type { Option, DropdownSelectorRef } from "./DropdownSelector";


interface DropdownSelectorManagedProps {
    options: Option[];
    defaultValue?: Option | null;
    placeholder?: string;
    description?: string;
    descriptionOnTheLeft?: boolean;
    descriptionLeftWidth?: string;
    onChange?: (selected: Option | null) => void;
    className?: string;
}

const DropdownSelectorManaged = forwardRef<DropdownSelectorRef, DropdownSelectorManagedProps>(({
    defaultValue = null,
    onChange,
    ...rest
}, ref) => {
    const [value, setValue] = useState<Option | null>(defaultValue);

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    const handleChange = (selected: Option | null) => {
        setValue(selected);
        onChange?.(selected);
    };

    return (
        <DropdownSelector
            ref={ref}
            value={value}
            onChange={handleChange}
            {...rest}
        />
    );
});

DropdownSelectorManaged.displayName = "DropdownSelectorManaged";

export default DropdownSelectorManaged;
