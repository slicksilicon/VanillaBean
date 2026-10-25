import Modal from "../Modal/Modal";
import "./RowDetailPopup.css";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RowDetailPopupProps {
    title: string;
    data: Record<string, unknown>;
    onClose: () => void;
}

interface ValueNodeProps {
    keyName: string | null;
    value: unknown;
    depth: number;
}

// ── Recursive value renderer ──────────────────────────────────────────────────

const ValueNode: React.FC<ValueNodeProps> = ({ keyName, value, depth }) => {
    const indent = depth * 20;

    if (value === null || value === undefined) {
        return (
            <div className="rdp-row" style={{ paddingLeft: indent }}>
                {keyName !== null && <span className="rdp-key">{keyName}:</span>}
                <span className="rdp-null">null</span>
            </div>
        );
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return (
                <div className="rdp-row" style={{ paddingLeft: indent }}>
                    {keyName !== null && <span className="rdp-key">{keyName}:</span>}
                    <span className="rdp-empty">[]</span>
                </div>
            );
        }
        const allPrimitive = value.every((v) => v === null || typeof v !== "object");
        if (allPrimitive) {
            return (
                <div className="rdp-row" style={{ paddingLeft: indent }}>
                    {keyName !== null && <span className="rdp-key">{keyName}:</span>}
                    <span className="rdp-array-inline">[{value.map((v) => (v === null ? "null" : String(v))).join(", ")}]</span>
                </div>
            );
        }
        return (
            <>
                <div className="rdp-row rdp-row--parent" style={{ paddingLeft: indent }}>
                    {keyName !== null && <span className="rdp-key">{keyName}:</span>}
                    <span className="rdp-parent-label">({value.length} items)</span>
                </div>
                {value.map((item, i) => (
                    <ValueNode key={i} keyName={`[${i}]`} value={item} depth={depth + 1} />
                ))}
            </>
        );
    }

    if (typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>);
        return (
            <>
                <div className="rdp-row rdp-row--parent" style={{ paddingLeft: indent }}>
                    {keyName !== null && <span className="rdp-key">{keyName}:</span>}
                    {entries.length === 0 && <span className="rdp-empty">{"{}"}</span>}
                </div>
                {entries.map(([k, v]) => (
                    <ValueNode key={k} keyName={k} value={v} depth={depth + 1} />
                ))}
            </>
        );
    }

    return (
        <div className="rdp-row" style={{ paddingLeft: indent }}>
            {keyName !== null && <span className="rdp-key">{keyName}:</span>}
            <span className={`rdp-value rdp-value--${typeof value}`}>{String(value)}</span>
        </div>
    );
};

// ── Popup ─────────────────────────────────────────────────────────────────────

const RowDetailPopup: React.FC<RowDetailPopupProps> = ({ title, data, onClose }) => {
    return (
        <Modal isOpen onClose={onClose} title={title} size="medium" className="rdp-panel">
            <div className="rdp-header">
                <span className="rdp-title">{title}</span>
                <button className="rdp-close" onClick={onClose}>✕</button>
            </div>
            <div className="rdp-body">
                {Object.entries(data).map(([key, value]) => (
                    <ValueNode key={key} keyName={key} value={value} depth={0} />
                ))}
            </div>
        </Modal>
    );
};

export default RowDetailPopup;
