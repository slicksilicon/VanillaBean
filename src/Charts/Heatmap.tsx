import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import SegmentControl from '../Components/SegmentControl/SegmentControl';
import { SliderRange } from '../Components/SliderRange/SliderRange';
import './Heatmap.css';

export interface HeatmapItem {
    id: string;
    label: string;
    imageUrl: string;    
}

interface HeatmapProps {
    xItems: HeatmapItem[];
    yItems: HeatmapItem[];
    matrix: number[][];
    showControls?: boolean;
}

const THEMES = ["Warm", "Cool", "Divergent"];

export const Heatmap: React.FC<HeatmapProps> = ({ xItems, yItems, matrix, showControls = true}) => {
    // Internalized State
    const [threshold, setThreshold] = useState<number>(0.2);
    const [colorTheme, setColorTheme] = useState<string>("Warm");
  
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !tooltipRef.current) return;

        // 1. Setup Dimensions & SVG
        const nX = xItems.length;
        const nY = yItems.length;

        if (nX === 0 || nY === 0 || matrix.length !== nY || (matrix[0]?.length ?? 0) !== nX) return;

        const cellSize = 100;
        const imgSize = 40;
        const margin = { top: 20, right: 20, bottom: 120, left: 120 };
        const innerWidth = nX * cellSize;
        const innerHeight = nY * cellSize;
        const width = innerWidth + margin.left + margin.right;
        const height = innerHeight + margin.top + margin.bottom;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        const rootGroup = svg
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const tooltip = d3.select(tooltipRef.current);

        // 2. Scales
        const x = d3.scaleBand<number>().domain(d3.range(nX)).range([0, innerWidth]).padding(0.05);
        const y = d3.scaleBand<number>().domain(d3.range(nY)).range([0, innerHeight]).padding(0.05);

        // 3. Color Selection
        let colorScale: (t: number) => string;
        switch (colorTheme) {
            case "Cool":
                colorScale = d3.scaleSequential(d3.interpolatePuBuGn).domain([0, 1]);
                break;
            case "Divergent":
                colorScale = d3.scaleSequential(d3.interpolateRdYlBu).domain([1, 0]); // Inverted for Red=High
                break;
            case "Warm":
            default:
                colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 1]);
                break;
        }

        // 4. Draw Custom Axes Functions
        const drawAxis = (isX: boolean, isSecondary: boolean) => {
        const g = rootGroup.append("g").attr("class", `axis ${isX ? 'axis-x' : 'axis-y'}`);
        const axisItems = isX ? xItems : yItems;

        axisItems.forEach((item, i) => {
            let xPos = 0, yPos = 0;
            const scale = isX ? x(i)! + x.bandwidth() / 2 : y(i)! + y.bandwidth() / 2;

            if (isX) {
                xPos = scale;
                yPos = isSecondary ? innerHeight + 20 : -imgSize - 20;
            } else {
                yPos = scale;
                xPos = isSecondary ? innerWidth + 20 : -imgSize - 20;
            }

            const tickGroup = g.append("g")
                .attr("class", `tick-group tick-${isX ? 'x' : 'y'}-${i}`)
                .attr("transform", `translate(${xPos}, ${yPos})`);

            // Image centered in the group
            tickGroup.append("image")
                .attr("href", item.imageUrl)
                .attr("width", imgSize)
                .attr("height", imgSize)
                .attr("x", -imgSize / 2)
                .attr("y", isX ? 0 : -imgSize / 2)
                .attr("preserveAspectRatio", "xMidYMid slice")
                .attr("clip-path", "inset(0% round 8px)");

            // Label below the image
            tickGroup.append("text")
                .attr("y", isX ? imgSize + 15 : imgSize / 2 + 15)
                .attr("x", 0)
                .attr("text-anchor", "middle")
                .attr("class", "axis-label")
                .text(item.label);
            });
        };

        drawAxis(true, true);   // Bottom X
        drawAxis(false, false); // Left Y

        // 5. Draw Matrix Cells
        for (let row = 0; row < nY; row++) {
            for (let col = 0; col < nX; col++) {
                const val = matrix[row][col];
                const isMasked = val < threshold;

                const cellGroup = rootGroup.append("g")
                    .attr("transform", `translate(${x(col)}, ${y(row)})`);

                cellGroup.append("rect")
                    .attr("width", x.bandwidth())
                    .attr("height", y.bandwidth())
                    .attr("rx", 4)
                    .attr("fill", isMasked ? "#f0f0f0" : colorScale(val))
                    .attr("class", "heatmap-cell")
                    .on("mouseover", (event: MouseEvent) => {
                        d3.selectAll(`.tick-x-${col} text`).classed("highlighted-text", true);
                        d3.selectAll(`.tick-y-${row} text`).classed("highlighted-text", true);
            
                        tooltip
                            .style("opacity", 1)
                            .style("left", `${event.pageX + 15}px`)
                            .style("top", `${event.pageY - 28}px`)
                            .html(`
                                <strong>${yItems[row].label}</strong> × <strong>${xItems[col].label}</strong><br/>
                                Similarity: <span style="color: #0066cc">${val.toFixed(3)}</span>
                        `);
                    })
          
                    .on("mouseout", () => {          
                        d3.selectAll(".axis-label").classed("highlighted-text", false);
                        tooltip.style("opacity", 0);
                    });

                if (!isMasked) {
                    cellGroup.append("text")
                        .attr("x", x.bandwidth() / 2)
                        .attr("y", y.bandwidth() / 2)
                        .attr("dy", ".32em")
                        .attr("text-anchor", "middle")
                        .attr("fill", val > 0.6 || colorTheme === "Cool" ? "#fff" : "#333")
                        .attr("font-size", "14px")
                        .attr("font-weight", "500")
                        .style("pointer-events", "none")
                        .text(val.toFixed(2));
                }
            }
        }
    }, [xItems, yItems, matrix, threshold, colorTheme]);

    return (
        <div className="heatmap-module">
            {/* Embedded Controls */}
            {showControls && (
                <div className="heatmap-controls">
                    <div className="control-group">
                        <SliderRange
                            label="Similarity Threshold"
                            min={0}
                            max={1}
                        step={0.05}
                        value={threshold}
                        onChange={setThreshold}                
                    />
                </div>

                <div className="control-group">                    
                    <SegmentControl
                        items={THEMES}
                        selectedIndex={THEMES.indexOf(colorTheme)}
                        onSelectionChange={setColorTheme}
                        colorScheme="primary"
                    />
                </div>
            </div>
            )}

            {/* SVG Canvas */}
            <div className="heatmap-wrapper">
                <svg ref={svgRef}></svg>
                <div ref={tooltipRef} className="heatmap-tooltip" style={{ opacity: 0 }}></div>
            </div>
        </div>
  );
};

export default Heatmap;