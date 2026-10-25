import { useState } from "react";
import ToggleSwitch from "../../../Components/ToggleSwitch/ToggleSwitch";
import "./SubSegments.css";

const Details: React.FC = () => {
    const [enabled, setEnabled] = useState(false);

    return (
        <div className="sub-segment-demo-pane">
            <h2 className="sub-segment-demo-title">Details</h2>
            <p className="sub-segment-demo-text">State here is local to this sub-segment and resets when you switch away.</p>
            <ToggleSwitch checked={enabled} onChange={setEnabled} label={enabled ? "Enabled" : "Disabled"} />
        </div>
    );
};

export default Details;
