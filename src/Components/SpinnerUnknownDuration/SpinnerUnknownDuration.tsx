import React from "react";
import "./SpinnerUnknownDuration.css";

interface SpinnerUnknownDurationProps {
    size?: number;
    className?: string;
    label?: string;
}

const BAR_COLORS = [
    "#0b3a5a",
    "#0e4366",
    "#124c73",
    "#165680",
    "#1a5f8c",
    "#1f6a98",
    "#2375a4",
    "#2a82af",
    "#3490ba",
    "#3f9dc4",
    "#4aa9ce",
    "#55b5d7"
];

const SpinnerUnknownDuration: React.FC<SpinnerUnknownDurationProps> = ({ size = 80, className = "", label }) => {
    return (
        <div className={`spinner-unknown ${className}`} style={{ "--spinner-size": `${size}px` } as React.CSSProperties}>
            <div className="spinner-unknown-ring">
                {BAR_COLORS.map((color, index) => (
                    <span
                        key={color}
                        className="spinner-unknown-bar"
                        style={{
                            "--spinner-rotate": `${index * 30}deg`,
                            "--spinner-delay": `${index * 0.08}s`,
                            "--spinner-color": color
                        } as React.CSSProperties}
                    />
                ))}
            </div>
            {label && <div className="spinner-unknown-label">{label}</div>}
        </div>
    );
};

export default SpinnerUnknownDuration;
