import React, { useRef, useCallback, useEffect } from "react";
import "./TripleHandleSlider.css";

interface TripleHandleSliderProps {
    label: string;
    absoluteMin: number;
    absoluteMax: number;
    minVal: number;
    maxVal: number;
    step?: number;
    onChange: (min: number, max: number) => void;
    className?: string;
}

type HandleKey = "min" | "max";

const TripleHandleSlider: React.FC<TripleHandleSliderProps> = ({
    label,
    absoluteMin,
    absoluteMax,
    minVal,
    maxVal,
    step = 0.01,
    onChange,
    className = "",
}) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const dragging = useRef<HandleKey | null>(null);

    const snap = useCallback((raw: number): number => {
        const snapped = Math.round((raw - absoluteMin) / step) * step + absoluteMin;
        return Math.min(absoluteMax, Math.max(absoluteMin, parseFloat(snapped.toFixed(10))));
    }, [absoluteMin, absoluteMax, step]);

    const toPercent = useCallback((val: number): number => {
        const span = absoluteMax - absoluteMin;
        if (span === 0) return 0;
        return ((val - absoluteMin) / span) * 100;
    }, [absoluteMin, absoluteMax]);

    const fromClientX = useCallback((clientX: number): number => {
        const track = trackRef.current;
        if (!track) return absoluteMin;
        const rect = track.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        return snap(absoluteMin + ratio * (absoluteMax - absoluteMin));
    }, [absoluteMin, absoluteMax, snap]);

    // Synchronously updated each render — handlers always see the latest values
    const stateRef = useRef({ minVal, maxVal, onChange, fromClientX });
    stateRef.current = { minVal, maxVal, onChange, fromClientX };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const key = dragging.current;
        if (!key) return;
        const { minVal, maxVal, onChange, fromClientX } = stateRef.current;
        const raw = fromClientX(e.clientX);

        if (key === "min") {
            const newMin = Math.min(raw, maxVal);
            onChange(newMin, maxVal);
        } else {
            const newMax = Math.max(raw, minVal);
            onChange(minVal, newMax);
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        dragging.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    }, [handleMouseMove]);

    const startDrag = useCallback((key: HandleKey) => (e: React.MouseEvent) => {
        e.preventDefault();
        dragging.current = key;
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    }, [handleMouseMove, handleMouseUp]);

    // Touch support
    const handleTouchMove = useCallback((e: TouchEvent) => {
        const key = dragging.current;
        if (!key || e.touches.length === 0) return;
        const { minVal, maxVal, onChange, fromClientX } = stateRef.current;
        const raw = fromClientX(e.touches[0].clientX);

        if (key === "min") {
            const newMin = Math.min(raw, maxVal);
            onChange(newMin, maxVal);
        } else {
            const newMax = Math.max(raw, minVal);
            onChange(minVal, newMax);
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        dragging.current = null;
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
    }, [handleTouchMove]);

    const startTouchDrag = useCallback((key: HandleKey) => (e: React.TouchEvent) => {
        e.preventDefault();
        dragging.current = key;
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd);
    }, [handleTouchMove, handleTouchEnd]);

    // Clean up listeners on unmount
    useEffect(() => {
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    const minPct = toPercent(minVal);
    const maxPct = toPercent(maxVal);

    const fmt = (v: number): string => {
        const digits = step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
        return v.toFixed(digits);
    };

    return (
        <div className={`triple-slider-container ${className}`}>
            <div className="triple-slider-header">
                <span className="triple-slider-label">{label}</span>
                <span className="triple-slider-values">
                    <span className="triple-slider-value triple-slider-value--min">{fmt(minVal)}</span>
                    <span className="triple-slider-separator">·</span>
                    <span className="triple-slider-value triple-slider-value--max">{fmt(maxVal)}</span>
                </span>
            </div>

            <div className="triple-slider-track-wrapper" ref={trackRef}>
                {/* Background track */}
                <div className="triple-slider-track">
                    {/* Filled region between min and max */}
                    <div
                        className="triple-slider-fill"
                        style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
                    />
                </div>

                {/* Min handle */}
                <div
                    className="triple-slider-handle triple-slider-handle--min"
                    style={{ left: `${minPct}%` }}
                    onMouseDown={startDrag("min")}
                    onTouchStart={startTouchDrag("min")}
                    role="slider"
                    aria-label={`${label} minimum`}
                    aria-valuenow={minVal}
                    aria-valuemin={absoluteMin}
                    aria-valuemax={maxVal}
                >
                    <span className="triple-slider-handle-label">min</span>
                </div>

                {/* Max handle */}
                <div
                    className="triple-slider-handle triple-slider-handle--max"
                    style={{ left: `${maxPct}%` }}
                    onMouseDown={startDrag("max")}
                    onTouchStart={startTouchDrag("max")}
                    role="slider"
                    aria-label={`${label} maximum`}
                    aria-valuenow={maxVal}
                    aria-valuemin={minVal}
                    aria-valuemax={absoluteMax}
                >
                    <span className="triple-slider-handle-label">max</span>
                </div>
            </div>

            {/* Absolute range labels */}
            <div className="triple-slider-bounds">
                <span>{fmt(absoluteMin)}</span>
                <span>{fmt(absoluteMax)}</span>
            </div>
        </div>
    );
};

export default TripleHandleSlider;
