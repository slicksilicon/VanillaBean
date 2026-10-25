import React from "react";
import "./SlideFlow.css";

interface SlideFlowProps {
    steps: React.ReactNode[];
    activeIndex: number;
    className?: string;
    style?: React.CSSProperties;
}

const SlideFlow: React.FC<SlideFlowProps> = ({ steps, activeIndex, className = "", style }) => {
    const maxIndex = Math.max(steps.length - 1, 0);
    const clampedIndex = Math.max(0, Math.min(activeIndex, maxIndex));

    return (
        <div className={`slide-flow ${className}`} style={style}>
            <div className="slide-flow-track"
                style={{
                    width: `${Math.max(steps.length, 1) * 100}%`,
                    transform: `translateX(-${clampedIndex * 100}%)`
                }}
            >
                {steps.map((step, index) => (
                    <div key={index} className="slide-flow-step">
                        {step}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SlideFlow;
