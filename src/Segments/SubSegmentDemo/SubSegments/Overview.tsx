import StatItem from "../../../Components/StatItem/StatItem";
import "./SubSegments.css";

const Overview: React.FC = () => {
    return (
        <div className="sub-segment-demo-pane">
            <h2 className="sub-segment-demo-title">Overview</h2>
            <p className="sub-segment-demo-text">
                A segment with a collapsible sidebar. Each sidebar item renders its own sub-segment from
                <code> SubSegments/</code>, the pattern EscapeVelocity's Image Tools uses.
            </p>
            <div className="sub-segment-demo-stats">
                <StatItem number={2} label="Sub-segments" variant="info" />
                <StatItem number="0" label="Backends needed" variant="success" />
            </div>
        </div>
    );
};

export default Overview;
