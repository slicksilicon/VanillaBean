import React, { useState } from 'react';
import SegmentControl from '../Components/SegmentControl/SegmentControl';
import { BarChartComponent, type BarChartProps } from './BarChart';
import { PieChartComponent, type PieChartProps } from './PieChart';
import { LineChartComponent, type LineChartProps } from './LineChart';
import Vector2DChart, { type Vector2DProps } from './Vector2D';
import Vector3DChart, { type Vector3DProps } from './Vector3D';
import './GraphContainer.css';
import '../Helpers/ColorScheme.css';

export type GraphTypes = 'bar' | 'pie' | 'line' | 'vector2d' | 'vector3d';

export type GraphItems = {
    segmentTitle: string;
    chartTitle: string;
    graphType: GraphTypes;
    graphProps: BarChartProps | PieChartProps | LineChartProps | Vector2DProps | Vector3DProps;
}

export interface GraphContainerProps {
    items: GraphItems[];
    className?: string;
}

export const GraphContainer: React.FC<GraphContainerProps> = ({ items, className = "" }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const handleSelectionChange = (item: string) => {
        const index = items.findIndex(graphItem => graphItem.segmentTitle === item);
        if (index !== -1) {
            setSelectedIndex(index);
        }
    };

    const selectedItem = items[selectedIndex];
    const segmentTitles = items.map(item => item.segmentTitle);

    /* Each tab is keyed by its own title so that switching tabs mounts a fresh chart rather
       than re-using the previous one. Two tabs of the same graph type land in the same
       position in the tree, so without this React reconciles them as one component and the
       chart's internal state - its Accumulate switch, its per-stack toggles - carries over
       from the tab that was just left. A tab must open in the state its own props ask for. */
    const renderChart = () => {
        if (!selectedItem) return null;

        const key = selectedItem.segmentTitle;
        switch (selectedItem.graphType) {
            case 'bar':
                return <BarChartComponent key={key} {...(selectedItem.graphProps as BarChartProps)} />;
            case 'pie':
                return <PieChartComponent key={key} {...(selectedItem.graphProps as PieChartProps)} />;
            case 'line':
                return <LineChartComponent key={key} {...(selectedItem.graphProps as LineChartProps)} />;
            case 'vector2d':
                return <Vector2DChart key={key} {...(selectedItem.graphProps as Vector2DProps)} />;
            case 'vector3d':
                return <Vector3DChart key={key} {...(selectedItem.graphProps as Vector3DProps)} />;
            default:
                return null;
        }
    };

    return (
        <div className={`graph-container ${className}`}>
            <div className="graph-container-header">
                <SegmentControl
                    items={segmentTitles}
                    selectedIndex={selectedIndex}
                    onSelectionChange={handleSelectionChange}
                    colorScheme="warning"
                />
                <div className="graph-container-title">{selectedItem?.chartTitle || ""}</div>
            </div>

            <div className="graph-container-content">
                {renderChart()}
            </div>
        </div>
    );
};

export default GraphContainer;