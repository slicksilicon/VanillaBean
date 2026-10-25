import React, { type ChangeEvent } from 'react';
import './SliderRange.css';

interface SliderRangeProps {
    label: string;
    min: number;
    max: number;
    step?: number; // Now optional
    value: number;
    onChange: (value: number) => void;
    className?: string;
}

// Smart default formatting function
const formatValue = (val: number): string => {
    return Number.isInteger(val) ? val.toString() : val.toFixed(2);
};

// Smart default step calculation based on min and max
const calculateDefaultStep = (min: number, max: number): number => {
    const range = Math.abs(max - min);
    if (range <= 1) return 0.01;
    if (range <= 10) return 0.1;
    return 1;
};

export const SliderRange: React.FC<SliderRangeProps> = ({label, min,max, step, value, onChange, className = ""}) => {
    // Use the provided step, or calculate the default if undefined
    const resolvedStep = step !== undefined ? step : calculateDefaultStep(min, max);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(parseFloat(e.target.value));
    };

    return (
        <div className={`range-slider-container ${className}`}>
            <div className="range-slider-header">
                <label className="range-slider-label">{label}</label>
                <span className="range-slider-value">{formatValue(value)}</span>
            </div>
            <input type="range" className="range-slider-input" min={min} max={max} step={resolvedStep} value={value} onChange={handleChange}/>
        </div>
    );
};

export default SliderRange;