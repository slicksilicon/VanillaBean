import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import DateSelector from "../DateSelector/DateSelector";
import TimePicker from "../TimePicker/TimePicker";
import "./DateTimePicker.css";
import {ICON_SVG_CALENDAR_COLOR} from "../../assets/svg_icons/calendar"

export interface DateTimePickerRef {
    reset: () => void;
    setValue: (value: string) => void;
}

interface DateTimePickerProps {
    value: string;
    placeholder?: string;
    description?: string;
    variant?: "primary" | "secondary" | "success" | "info" | "warning" | "danger";
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

const formatDateDisplay = (date: Date): string => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const DateTimePicker = forwardRef<DateTimePickerRef, DateTimePickerProps>(({
    value,
    placeholder = "Select date...",
    description = "",
    variant = "primary",
    onChange,
    className = "",
    disabled = false,
}, ref) => {
    const [showCalendar, setShowCalendar] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    const parseDateFromValue = useCallback((): Date | null => {
        if (!value) return null;
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }, [value]);

    const parseTimeFromValue = useCallback((): string => {
        if (!value) return "";
        const d = new Date(value);
        if (isNaN(d.getTime())) return "";
        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    }, [value]);

    const currentDate = parseDateFromValue();
    const currentTime = parseTimeFromValue();

    const reset = useCallback(() => {
        onChange("");
        setShowCalendar(false);
    }, [onChange]);

    const setValueMethod = useCallback((newValue: string) => {
        onChange(newValue);
    }, [onChange]);

    useImperativeHandle(ref, () => ({
        reset,
        setValue: setValueMethod,
    }), [reset, setValueMethod]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const buildISOString = (date: Date, time: string): string => {
        const [hours, minutes] = time ? time.split(":").map(Number) : [0, 0];
        const y = date.getFullYear();
        const mo = (date.getMonth() + 1).toString().padStart(2, "0");
        const d = date.getDate().toString().padStart(2, "0");
        const h = hours.toString().padStart(2, "0");
        const mi = minutes.toString().padStart(2, "0");
        return `${y}-${mo}-${d}T${h}:${mi}:00`;
    };

    const handleDateSelect = (date: Date) => {
        const timeStr = currentTime || "00:00";
        onChange(buildISOString(date, timeStr));
        setShowCalendar(false);
    };

    const handleTimeChange = (time: string) => {
        const dateToUse = currentDate || new Date();
        onChange(buildISOString(dateToUse, time));
    };

    const toggleCalendar = () => {
        if (!disabled) setShowCalendar(!showCalendar);
    };

    const dateDisplayText = currentDate ? formatDateDisplay(currentDate) : "";

    return (
        <div className={`datetime-picker-container ${className}`}>
            {description && <span className="datetime-picker-description">{description}</span>}
            <div className="datetime-picker-row">
                <div ref={calendarRef} className="datetime-picker-date-wrapper">
                    <button
                        type="button"
                        className={`datetime-picker-date-trigger datetime-picker-${variant} ${showCalendar ? "focused" : ""} ${disabled ? "disabled" : ""}`}
                        onClick={toggleCalendar}
                        disabled={disabled}
                    >
                        <span className={`datetime-picker-date-value ${!dateDisplayText ? "placeholder" : ""}`}>
                            {dateDisplayText || placeholder}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: ICON_SVG_CALENDAR_COLOR }}></span>
                    </button>

                    {showCalendar && (
                        <div className="datetime-picker-calendar-popover">
                            <DateSelector
                                onDateSelect={handleDateSelect}
                                initialDate={currentDate || undefined}
                            />
                        </div>
                    )}
                </div>

                <div className="datetime-picker-time-wrapper">
                    <TimePicker
                        value={currentTime}
                        onChange={handleTimeChange}
                        placeholder="Time"
                        variant={variant}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
});

DateTimePicker.displayName = "DateTimePicker";

export default DateTimePicker;
