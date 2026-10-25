import React from "react";
import SubSegmentLayout from "../SubSegmentLayout";
import Overview from "./SubSegments/Overview";
import Details from "./SubSegments/Details";
import type { SidebarItem } from "../../Components/CollapsibleSidebar/CollapsibleSidebar";

const SIDEBAR_ITEMS: SidebarItem[] = [
    {
        id: "overview",
        label: "Overview",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        id: "details",
        label: "Details",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1" />
                <circle cx="4" cy="12" r="1" />
                <circle cx="4" cy="18" r="1" />
            </svg>
        ),
    },
];

const renderContent = (id: string): React.ReactNode => {
    if (id === "overview") return <Overview />;
    if (id === "details")  return <Details />;
    return null;
};

const SubSegmentDemo: React.FC = () => {
    return (
        <SubSegmentLayout
            items={SIDEBAR_ITEMS}
            defaultId="overview"
            renderContent={renderContent}
            placeholderText="Select an item from the sidebar"
        />
    );
};

export default SubSegmentDemo;
export const segmentName = "Sub Segments";
