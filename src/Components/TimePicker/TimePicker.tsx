import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import "./TimePicker.css";

type DescriptionPosition = "top" | "left" | "none";

export interface TimePickerRef {
    reset: () => void;
    setValue: (value: string) => void;
}

interface TimePickerProps {
    value: string;
    placeholder?: string;
    description?: string;
    descriptionOnLeft?: boolean;
    descriptionLeftWidth?: string;
    variant?: "primary" | "secondary" | "success" | "info" | "warning" | "danger";
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

const TimePicker = forwardRef<TimePickerRef, TimePickerProps>(({
    value,
    description = "",
    descriptionOnLeft = false,
    descriptionLeftWidth,
    variant = "primary",
    onChange,
    className = "",
    disabled = false,
}, ref) => {
    const [focusedField, setFocusedField] = useState<"hour" | "minute" | null>(null);
    const [localHour, setLocalHour] = useState("");
    const [localMinute, setLocalMinute] = useState("");
    const hourInputRef = useRef<HTMLInputElement>(null);
    const minuteInputRef = useRef<HTMLInputElement>(null);

    const descriptionPosition: DescriptionPosition = description ? (descriptionOnLeft ? "left" : "top") : "none";

    const parsedHour = value ? (value.split(":")[0] || "") : "";
    const parsedMinute = value ? (value.split(":")[1] || "") : "";

    // Sync local state with prop value when not focused
    React.useEffect(() => {
        if (!focusedField) {
            setLocalHour(parsedHour);
            setLocalMinute(parsedMinute);
        }
    }, [parsedHour, parsedMinute, focusedField]);

    const displayHour = focusedField === "hour" ? localHour : parsedHour;
    const displayMinute = focusedField === "minute" ? localMinute : parsedMinute;

    const reset = useCallback(() => {
        onChange("");
    }, [onChange]);

    const setValueMethod = useCallback((newValue: string) => {
        onChange(newValue);
    }, [onChange]);

    useImperativeHandle(ref, () => ({
        reset,
        setValue: setValueMethod,
    }), [reset, setValueMethod]);

    const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value.replace(/\D/g, "");
        setLocalHour(inputValue);
        if (inputValue === "") {
            onChange(parsedMinute ? `:${parsedMinute}` : "");
            return;
        }
        let hourNum = parseInt(inputValue, 10);
        if (hourNum > 23) {
            setLocalHour("23");
            hourNum = 23;
        }
        const hourStr = inputValue.length >= 2 ? hourNum.toString().padStart(2, "0") : inputValue;
        const min = parsedMinute || "";
        onChange(min ? `${hourStr}:${min}` : `${hourStr}:`);
        if (inputValue.length >= 2) {
            minuteInputRef.current?.focus();
            minuteInputRef.current?.select();
        }
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value.replace(/\D/g, "");
        setLocalMinute(inputValue);
        if (inputValue === "") {
            onChange(parsedHour ? `${parsedHour}:` : "");
            return;
        }
        let minNum = parseInt(inputValue, 10);
        if (minNum > 59) {
            setLocalMinute("59");
            minNum = 59;
        }
        const minStr = inputValue.length >= 2 ? minNum.toString().padStart(2, "0") : inputValue;
        const hr = parsedHour || "";
        onChange(hr ? `${hr}:${minStr}` : `:${minStr}`);
    };

    const handleHourFocus = () => {
        setFocusedField("hour");
        setLocalHour(parsedHour);
    };

    const handleMinuteFocus = () => {
        setFocusedField("minute");
        setLocalMinute(parsedMinute);
    };

    const handleHourBlur = () => {
        setFocusedField(null);
        if (parsedHour && parsedHour.length === 1) {
            const paddedHour = parsedHour.padStart(2, "0");
            const min = parsedMinute || "00";
            onChange(`${paddedHour}:${min}`);
        } else if (parsedHour && !parsedMinute) {
            onChange(`${parsedHour}:00`);
        }
    };

    const handleMinuteBlur = () => {
        setFocusedField(null);
        if (parsedMinute && parsedMinute.length === 1) {
            const hr = parsedHour || "00";
            const paddedMinute = parsedMinute.padStart(2, "0");
            onChange(`${hr}:${paddedMinute}`);
        } else if (parsedMinute && !parsedHour) {
            onChange(`00:${parsedMinute}`);
        }
    };

    const handleHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowRight" && hourInputRef.current) {
            const selectionStart = hourInputRef.current.selectionStart ?? 0;
            const valueLength = hourInputRef.current.value.length;
            if (selectionStart >= valueLength) {
                e.preventDefault();
                minuteInputRef.current?.focus();
                minuteInputRef.current?.setSelectionRange(0, 0);
            }
        } else if (e.key === ":" || e.key === "Tab") {
            if (e.key === ":") e.preventDefault();
            minuteInputRef.current?.focus();
            minuteInputRef.current?.select();
        }
    };

    const handleMinuteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowLeft" && minuteInputRef.current) {
            const selectionStart = minuteInputRef.current.selectionStart ?? 0;
            if (selectionStart === 0) {
                e.preventDefault();
                hourInputRef.current?.focus();
                const len = hourInputRef.current?.value.length ?? 0;
                hourInputRef.current?.setSelectionRange(len, len);
            }
        } else if (e.key === "Backspace" && minuteInputRef.current?.value === "") {
            e.preventDefault();
            hourInputRef.current?.focus();
        }
    };

    const renderDescription = () => {
        if (!description) return null;
        const descriptionStyle: React.CSSProperties = {};
        if (descriptionPosition === "left" && descriptionLeftWidth) {
            descriptionStyle.width = descriptionLeftWidth;
            descriptionStyle.minWidth = descriptionLeftWidth;
            descriptionStyle.maxWidth = descriptionLeftWidth;
        }
        return (
            <span className={`time-picker-description ${descriptionPosition}`} style={descriptionStyle}>
                {description}
            </span>
        );
    };

    return (
        <div className={`time-picker-container ${descriptionPosition} ${className}`}>
            {descriptionPosition === "top" && renderDescription()}
            <div className="time-picker-main-row">
                {descriptionPosition === "left" && renderDescription()}
                <div className={`time-picker-input-wrapper time-picker-${variant} ${disabled ? "disabled" : ""}`}>
                    <input
                        ref={hourInputRef}
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        className={`time-picker-input ${focusedField === "hour" ? "focused" : ""}`}
                        value={displayHour}
                        placeholder="HH"
                        onChange={handleHourChange}
                        onFocus={handleHourFocus}
                        onBlur={handleHourBlur}
                        onKeyDown={handleHourKeyDown}
                        disabled={disabled}
                        aria-label="Hours"
                    />
                    <span className="time-picker-colon">:</span>
                    <input
                        ref={minuteInputRef}
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        className={`time-picker-input ${focusedField === "minute" ? "focused" : ""}`}
                        value={displayMinute}
                        placeholder="MM"
                        onChange={handleMinuteChange}
                        onFocus={handleMinuteFocus}
                        onBlur={handleMinuteBlur}
                        onKeyDown={handleMinuteKeyDown}
                        disabled={disabled}
                        aria-label="Minutes"
                    />
                </div>
            </div>
        </div>
    );
});

TimePicker.displayName = "TimePicker";

export default TimePicker;
