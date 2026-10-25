import { useState, useEffect, forwardRef } from "react";
import DateTimePicker from "./DateTimePicker";
import type { DateTimePickerRef } from "./DateTimePicker";

interface DateTimePickerManagedProps {
    defaultValue?: string;
    placeholder?: string;
    description?: string;
    variant?: "primary" | "secondary" | "success" | "info" | "warning" | "danger";
    onChange?: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

const DateTimePickerManaged = forwardRef<DateTimePickerRef, DateTimePickerManagedProps>(({
    defaultValue = "",
    onChange,
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

    return (
        <DateTimePicker
            ref={ref}
            value={value}
            onChange={handleChange}
            {...rest}
        />
    );
});

DateTimePickerManaged.displayName = "DateTimePickerManaged";
export default DateTimePickerManaged;
