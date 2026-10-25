import { useState } from "react";
import CollapsibleSidebar from "../Components/CollapsibleSidebar/CollapsibleSidebar";
import type { SidebarItem } from "../Components/CollapsibleSidebar/CollapsibleSidebar";
import "./SubSegmentLayout.css";

interface SubSegmentLayoutProps {
    items: SidebarItem[];
    defaultId: string;
    renderContent: (id: string) => React.ReactNode;
    placeholderText?: string;
}

const SubSegmentLayout: React.FC<SubSegmentLayoutProps> = ({
    items,
    defaultId,
    renderContent,
    placeholderText = "Select an item from the sidebar",
}) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedId, setSelectedId] = useState(defaultId);

    return (
        <div className="sub-segment-container">
            <CollapsibleSidebar
                items={items}
                selectedId={selectedId}
                onSelect={setSelectedId}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
            />
            <div className="sub-segment-content">
                {renderContent(selectedId) ?? (
                    <div className="sub-segment-placeholder">{placeholderText}</div>
                )}
            </div>
        </div>
    );
};

export default SubSegmentLayout;
