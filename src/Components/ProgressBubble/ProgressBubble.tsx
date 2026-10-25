import React from "react";
import "./ProgressBubble.css";

export interface ProgressBubbleProps {
    progress: number;
    text?: string;
    variant?: "primary" | "secondary" | "success" | "info" | "warning" | "danger";
    size?: "small" | "medium" | "large";
    showPercentage?: boolean;
}

const ProgressBubble: React.FC<ProgressBubbleProps> = ({
    progress,
    text = "",
    variant = "primary",
    size = "medium",
    showPercentage = true,
}) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.min(100, Math.max(0, progress));
    
    const containerClasses = [
        "progress-bubble-container",
        `progress-bubble-${size}`,
        `progress-bubble-${variant}`,
    ].filter(Boolean).join(" ");

    return (
        <div className={containerClasses}>
            <div className="progress-bubble-circle">
                <div className="progress-bubble-liquid" style={{ height: `${clampedProgress}%` }}>
                    <div className="progress-bubble-wave"></div>
                    <div className="progress-bubble-wave progress-bubble-wave-delay"></div>
                </div>
                {showPercentage && (
                    <div className="progress-bubble-percentage">
                        <span className="progress-bubble-percentage-value">{Math.round(clampedProgress)}</span>
                        <span className="progress-bubble-percentage-symbol">%</span>
                    </div>
                )}
            </div>
            {text && (
                <div className="progress-bubble-text">
                    {text}
                </div>
            )}
        </div>
    );
};

export default ProgressBubble;
