import { useState, useEffect, forwardRef } from "react";
import TimePicker from "./TimePicker";
import type { TimePickerRef } from "./TimePicker";

interface TimePickerManagedProps {
    defaultValue?: string;
    placeholder?: string;
    description?: string;
    descriptionOnLeft?: boolean;
    descriptionLeftWidth?: string;
    onChange?: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

const TimePickerManaged = forwardRef<TimePickerRef, TimePickerManagedProps>(({
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
        <TimePicker
            ref={ref}
            value={value}
            onChange={handleChange}
            {...rest}
        />
    );
});

TimePickerManaged.displayName = "TimePickerManaged";
export default TimePickerManaged;
