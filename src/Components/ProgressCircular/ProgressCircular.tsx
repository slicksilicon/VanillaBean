import React from "react";
import "./ProgressCircular.css";

export interface ProgressCircularProps {
    title: string;
    progress: number;
    currentAction: string;
    variant?: "primary" | "secondary" | "success" | "info" | "warning" | "danger";
    size?: "small" | "medium" | "large";
    showPercentage?: boolean;
}

const ProgressCircular: React.FC<ProgressCircularProps> = ({
    title,
    progress,
    currentAction,
    variant = "primary",
    size = "medium",
    showPercentage = true,
}) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.min(100, Math.max(0, progress));
    
    // Calculate the stroke dash offset based on progress
    const radius = size === "small" ? 40 : size === "large" ? 60 : 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
    
    // Size configurations
    const svgSize = size === "small" ? 100 : size === "large" ? 140 : 120;
    const strokeWidth = size === "small" ? 6 : size === "large" ? 10 : 8;
    
    const containerClasses = [
        "circular-progress-container",
        `circular-progress-${size}`,
        `circular-progress-${variant}`,
    ].filter(Boolean).join(" ");

    return (
        <div className={containerClasses}>
            <div className="circular-progress-header">
                <h3 className="circular-progress-title">{title}</h3>
            </div>
            
            <div className="circular-progress-svg-container">
                <svg 
                    className="circular-progress-svg" 
                    width={svgSize} 
                    height={svgSize}
                    viewBox={`0 0 ${svgSize} ${svgSize}`}
                >
                    {/* Background circle */}
                    <circle
                        className="circular-progress-background"
                        cx={svgSize / 2}
                        cy={svgSize / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                    />
                    
                    {/* Progress circle */}
                    <circle
                        className="circular-progress-foreground"
                        cx={svgSize / 2}
                        cy={svgSize / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
                    />
                </svg>
                
                {/* Center percentage text */}
                {showPercentage && (
                    <div className="circular-progress-percentage">
                        <span className="circular-progress-percentage-value">{Math.round(clampedProgress)}</span>
                        <span className="circular-progress-percentage-symbol">%</span>
                    </div>
                )}
            </div>
            
            <div className="circular-progress-footer">
                <p className="circular-progress-action">{currentAction}</p>
            </div>
        </div>
    );
};

export default ProgressCircular;
