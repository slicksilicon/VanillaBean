import React from "react";
import "./ProgressBar.css";

export interface ProgressBarProps {
    title: string;
    progress: number;
    currentAction: string;
    variant?: "primary" | "secondary" | "success" | "info" | "warning" | "danger";
    size?: "small" | "medium" | "large";
    showPercentage?: boolean;
    animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
    title,
    progress,
    currentAction,
    variant = "primary",
    size = "medium",
    showPercentage = true,
    animated = true,
}) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.min(100, Math.max(0, progress));
    
    const containerClasses = [
        "progress-bar-container",
        `progress-bar-${size}`,
        `progress-bar-${variant}`,
    ].filter(Boolean).join(" ");
    
    const barClasses = [
        "progress-bar-fill",
        animated ? "progress-bar-animated" : "",
    ].filter(Boolean).join(" ");

    return (
        <div className={containerClasses}>
            <div className="progress-bar-header">
                <h3 className="progress-bar-title">{title}</h3>
                {showPercentage && (
                    <span className="progress-bar-percentage">
                        {Math.round(clampedProgress)}%
                    </span>
                )}
            </div>
            
            <div className="progress-bar-track">
                <div 
                    className={barClasses}
                    style={{ width: `${clampedProgress}%` }}
                    role="progressbar"
                    aria-valuenow={clampedProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${title} progress`}
                >
                    {animated && (
                        <div className="progress-bar-shimmer"></div>
                    )}
                </div>
            </div>
            
            <div className="progress-bar-footer">
                <p className="progress-bar-action">{currentAction}</p>
            </div>
        </div>
    );
};

export default ProgressBar;
