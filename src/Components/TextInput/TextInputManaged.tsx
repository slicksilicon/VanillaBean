import { useState, useEffect, forwardRef } from "react";
import TextInput from "./TextInput";
import type { TextInputRef } from "./TextInput";

interface TextInputManagedProps {
    defaultValue?: string;
    placeholder?: string;
    description?: string;
    descriptionOnLeft?: boolean;
    descriptionLeftWidth?: string;
    onChange?: (value: string) => void;
    className?: string;
    type?: "text" | "password" | "email" | "number" | "date" | "datetime-local";
    disabled?: boolean;
    maxLength?: number;
    /** If true, clears the input value when clicked/focused for fresh input */
    clearOnClick?: boolean;
}

const TextInputManaged = forwardRef<TextInputRef, TextInputManagedProps>(({
    defaultValue = "",
    onChange,
    clearOnClick = false,
    ...rest
}, ref) => {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    const handleChange = (newValue: string) => {
        setValue(newValue);
        onChange?.(newValue);
    };

    const handleFocus = () => {
        if (clearOnClick && value !== "") {
            setValue("");
            onChange?.("");
        }
    };

    return (
        <TextInput
            ref={ref}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            {...rest}
        />
    );
});

TextInputManaged.displayName = "TextInputManaged";

export default TextInputManaged;
