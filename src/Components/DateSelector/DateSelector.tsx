import React, { useState, useCallback } from "react";
import "./DateSelector.css";
import { getMonthName, dayNames } from "../../Helpers/DateHelpers";

interface DateSelectorProps {
    onDateSelect?: (date: Date) => void;
    initialDate?: Date;
    className?: string;
}

const DateSelector: React.FC<DateSelectorProps> = ({ onDateSelect, initialDate = new Date(), className = "" }) => {
    const [currentDate, setCurrentDate] = useState(new Date(initialDate));
    const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);

    const today = new Date();

    // Get first day of the month and number of days
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysInMonth = lastDayOfMonth.getDate();

    const navigateMonth = useCallback((direction: "prev" | "next") => {
        setCurrentDate((prevDate) => {
            const newDate = new Date(prevDate);
            if (direction === "prev") {
                newDate.setMonth(newDate.getMonth() - 1);
            } else {
                newDate.setMonth(newDate.getMonth() + 1);
            }
            return newDate;
        });
    }, []);

    const handleDateClick = useCallback(
        (day: number) => {            
            const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 12, 0, 0);
            setSelectedDate(newSelectedDate);
            onDateSelect?.(newSelectedDate);
        },
        [currentDate, onDateSelect]
    );

    const isToday = (day: number) => {
        return today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth() && today.getDate() === day;
    };

    const isSelected = (day: number) => {
        return (
            selectedDate &&
            selectedDate.getFullYear() === currentDate.getFullYear() &&
            selectedDate.getMonth() === currentDate.getMonth() &&
            selectedDate.getDate() === day
        );
    };

    // Generate calendar days
    const renderCalendarDays = () => {
        const days = [];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isTodayDay = isToday(day);
            const isSelectedDay = isSelected(day);

            const dayClasses = [
                "calendar-day",
                // Only show today highlight if no date is selected or if today is the selected date
                isTodayDay && (!selectedDate || isSelectedDay) ? "today" : "",
                isSelectedDay ? "selected" : "",
            ]
                .filter(Boolean)
                .join(" ");

            days.push(
                <button key={day} className={dayClasses} onClick={() => handleDateClick(day)} type="button">
                    {day}
                </button>
            );
        }

        return days;
    };

    return (
        <div className={`date-selector ${className}`}>
            <div className="calendar-header">
                <button className="nav-button prev" onClick={() => navigateMonth("prev")} type="button">
                    ‹
                </button>

                <div className="month-year">
                    {getMonthName(currentDate)} {currentDate.getFullYear()}
                </div>

                <button className="nav-button next" onClick={() => navigateMonth("next")} type="button">
                    ›
                </button>
            </div>

            <div className="calendar-weekdays">
                {dayNames.map((day) => (
                    <div key={day} className="weekday">
                        {day}
                    </div>
                ))}
            </div>

            <div className="calendar-grid">{renderCalendarDays()}</div>
        </div>
    );
};

export default DateSelector;
