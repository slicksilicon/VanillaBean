import StatItem from "../../Components/StatItem/StatItem";
import TextInput from "../../Components/TextInput/TextInput";
import Button from "../../Components/Button/Button";
import { showToast } from "../../Components/Toast/toastBus";
import { useStoredState } from "../../Hooks/useStoredState";

import "./Sample.css";

const Sample: React.FC = () => {
    // Survives a reload - stored in this browser's localStorage.
    const [note, setNote] = useStoredState("sample.note", "");
    const [clicks, setClicks] = useStoredState("sample.clicks", 0);

    return (
        <div className="sample-segment-container">
            <div className="sample-segment-top-row">
                <div className="sample-segment-stats-container">
                    <StatItem number={import.meta.env.VITE_APP_TITLE || "VanillaBean"} label="Application" variant="info" />
                    <StatItem number={clicks} label="Stored clicks" variant="success" />
                    <StatItem number={note.length} label="Characters in note" variant="warning" />
                </div>
            </div>
            <div className="sample-segment-bottom-row">
                <div className="sample-segment-panel">
                    <TextInput value={note} onChange={setNote} description="Note (kept in localStorage)" placeholder="Type something, then reload" />
                    <div className="sample-segment-actions">
                        <Button variant="primary" onClick={() => setClicks(c => c + 1)}>Count click</Button>
                        <Button variant="success" onClick={() => showToast("Saved locally", { variant: "success" })}>Success toast</Button>
                        <Button variant="danger" onClick={() => showToast("Something went wrong", { variant: "error" })}>Error toast</Button>
                        <Button variant="secondary" onClick={() => { setNote(""); setClicks(0); }}>Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sample;
export const segmentName = "Sample";
