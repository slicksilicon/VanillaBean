import React from "react";
import "./StatItem.css";

export interface StatItemProps {
    number: string | number;
    label: string;
    variant?: "default" | "success" | "warning" | "info" | "danger";
    /** Optional leading glyph. Supplying one switches the tile to a row layout with the
     *  icon beside the figure; without it the tile stays centred and stacked. */
    icon?: React.ReactNode;
    className?: string;
}

const StatItem: React.FC<StatItemProps> = ({
    number,
    label,
    variant = "default",
    icon,
    className = "",
}) => {
    const baseClasses = "stat-item";
    const variantClass = variant !== "default" ? `stat-item-${variant}` : "";

    const combinedClasses = [
        baseClasses,
        variantClass,
        icon ? "stat-item-with-icon" : "",
        className
    ].filter(Boolean).join(" ");

    return (
        <div className={combinedClasses}>
            {icon && <span className="stat-icon" aria-hidden="true">{icon}</span>}
            <span className="stat-body">
                <span className="stat-number">{number}</span>
                <span className="stat-label">{label}</span>
            </span>
        </div>
    );
};

export default StatItem;