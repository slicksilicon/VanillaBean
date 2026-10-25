import React from 'react';
import "./BarLegend.css";

export interface BarLegendProps {
    colorMapping: Record<string, string>;
    items: string[];
    className?: string;
    hoveredItem?: string;
    /* Series totals, keyed by item name. When supplied each entry carries its own total so
       the legend doubles as a ranking rather than being a colour key alone. */
    totals?: Record<string, number>;
}

const formatTotal = (value: number): string => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `RM ${(value / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `RM ${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
    return `RM ${Math.round(value)}`;
};

export const BarLegend: React.FC<BarLegendProps> = ({ colorMapping, items, className = "", hoveredItem = "", totals }) => {
    return (
        <div className={`bar-legend ${className}`}>
            {items.map((item) => (
                <div
                    key={item}
                    className="bar-legend-item"
                    /* Hovering a series in the chart dims the others here too, so the two
                       highlights read as one gesture. */
                    style={{ opacity: hoveredItem !== "" && hoveredItem !== item ? 0.35 : 1 }}
                >
                    <div className="bar-legend-color-box" style={{ backgroundColor: colorMapping[item] }} />
                    <span>{item}</span>
                    {totals && totals[item] !== undefined && (
                        <b className="bar-legend-total">{formatTotal(totals[item])}</b>
                    )}
                </div>
            ))}
        </div>
    );
};
