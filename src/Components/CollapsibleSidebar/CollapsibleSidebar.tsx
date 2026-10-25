import { useRef, useEffect, useState } from "react";
import "./CollapsibleSidebar.css";

export interface SidebarItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

export interface CollapsibleSidebarProps {
    items: SidebarItem[];
    selectedId: string;
    onSelect: (id: string) => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
    className?: string;
}

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ items, selectedId, onSelect, collapsed, onToggleCollapse, className = "" }) => {
    const [indicatorTop, setIndicatorTop] = useState(0);
    const itemsRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    useEffect(() => {
        const selectedBtn = itemRefs.current.get(selectedId);
        if (selectedBtn && itemsRef.current) {
            const itemsRect = itemsRef.current.getBoundingClientRect();
            const btnRect = selectedBtn.getBoundingClientRect();
            setIndicatorTop(btnRect.top - itemsRect.top);
        }
    }, [selectedId, collapsed]);

    return (
        <div className={`collapsible-sidebar ${collapsed ? "collapsed" : "expanded"} ${className}`}>
            {/* Items */}
            <div ref={itemsRef} className="sidebar-items">
                {/* Sliding indicator */}
                <div className="sidebar-indicator" style={{ top: `${indicatorTop}px`, opacity: selectedId ? 1 : 0 }} />

                {items.map((item) => (
                    <button
                        key={item.id}
                        ref={(el) => { if (el) itemRefs.current.set(item.id, el); else itemRefs.current.delete(item.id); }}
                        className={`sidebar-item ${item.id === selectedId ? "active" : ""}`}
                        onClick={() => onSelect(item.id)}
                        title={collapsed ? item.label : undefined}
                    >
                        <span className="sidebar-item-icon">{item.icon}</span>
                        {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
                    </button>
                ))}
            </div>

            {/* Collapse toggle at the bottom */}
            <button className="sidebar-collapse-btn" onClick={onToggleCollapse} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    {collapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
                </svg>
            </button>
        </div>
    );
};

export default CollapsibleSidebar;
