import React, { useRef, useState, useEffect } from "react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend} from "recharts";
import { getColorFromScheme } from "../Helpers/GetColorsFromScheme";
import type { ColorSchemeNames } from "../Helpers/GetColorsFromScheme";
import { formatCurrencyValue } from "../Helpers/CurrencyDisplay";
import "./LineChart.css";
import type { Currency } from "../Query/Types";

export type LineChartAxisType = "category" | "number";
export type LineChartCurveType = "linear" | "monotone" | "step" | "stepBefore" | "stepAfter" | "basis" | "natural";
export type LineChartValueFormat = "number" | "currency";

export interface LineChartDataItem {
    x: string | number;
    [key: string]: string | number;
}

export interface LineChartLineConfig {
    dataKey: string;
    name: string;
    yAxisId?: "left" | "right";
    strokeWidth?: number;
    dot?: boolean;
}

export interface LineChartProps {
    data: LineChartDataItem[];
    lines: LineChartLineConfig[];
    colorScheme: ColorSchemeNames;
    xAxisType?: LineChartAxisType;
    curveType?: LineChartCurveType;
    showGrid?: boolean;
    showLegend?: boolean;
    showDots?: boolean;
    leftAxisLabel?: string;
    rightAxisLabel?: string;
    leftAxisFormat?: LineChartValueFormat;
    rightAxisFormat?: LineChartValueFormat;
    leftAxisCurrency?: Currency | null;
    rightAxisCurrency?: Currency | null;
}

// Custom Tooltip Component
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        dataKey: string;
        color: string;
        payload: LineChartDataItem;
    }>;
    label?: string | number;
    leftAxisFormat?: LineChartValueFormat;
    rightAxisFormat?: LineChartValueFormat;
    leftAxisCurrency?: Currency | null;
    rightAxisCurrency?: Currency | null;
    lineConfigs: LineChartLineConfig[];
}

const formatValue = (value: number, format: LineChartValueFormat, currency: Currency | null): string => {
    if (format === "currency" && currency) {
        return formatCurrencyValue(value, currency);
    }
    return value.toLocaleString();
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
    active, 
    payload, 
    label,
    leftAxisFormat = "number",
    rightAxisFormat = "number",
    leftAxisCurrency = null,
    rightAxisCurrency = null,
    lineConfigs
}) => {
    if (active && payload && payload.length) {
        return (
            <div className="line-chart-tooltip">
                <p className="line-chart-tooltip-label">{`${label}`}</p>
                {payload.map((entry, index) => {
                    const lineConfig = lineConfigs.find(config => config.dataKey === entry.dataKey);
                    const yAxisId = lineConfig?.yAxisId || "left";
                    const format = yAxisId === "left" ? leftAxisFormat : rightAxisFormat;
                    const currency = yAxisId === "left" ? leftAxisCurrency : rightAxisCurrency;
                    const formattedValue = formatValue(entry.value, format, currency);
                    
                    return (
                        <p key={`item-${index}`} className="line-chart-tooltip-item" style={{ color: entry.color }}>
                            {`${entry.name}: ${formattedValue}`}
                        </p>
                    );
                })}
            </div>
        );
    }
    return null;
};

export const LineChartComponent: React.FC<LineChartProps> = ({
    data,
    lines,
    colorScheme = "gemini-large",
    xAxisType = "category",
    curveType = "monotone",
    showGrid = true,
    showLegend = true,
    showDots = true,
    leftAxisLabel,
    rightAxisLabel,
    leftAxisFormat = "number",
    rightAxisFormat = "number",
    leftAxisCurrency = null,
    rightAxisCurrency = null,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Set up ResizeObserver to track container size
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });

        resizeObserver.observe(containerRef.current);

        // Cleanup
        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Get colors from scheme
    const colors = getColorFromScheme(colorScheme);

    // Check if we need dual axes
    const hasRightAxis = lines.some(line => line.yAxisId === "right");
    const hasLeftAxis = lines.some(line => !line.yAxisId || line.yAxisId === "left");

    // Calculate dynamic Y-axis domains to highlight variation
    const calculateAxisDomain = (yAxisId: "left" | "right"): [number, number] => {
        const relevantLines = lines.filter(line => (line.yAxisId || "left") === yAxisId);
        const values: number[] = [];

        data.forEach(item => {
            relevantLines.forEach(line => {
                const value = item[line.dataKey];
                if (typeof value === "number") {
                    values.push(value);
                }
            });
        });

        if (values.length === 0) return [0, 100];

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;

        // Add 10% padding on both sides to show variation clearly
        const padding = range * 0.1;
        const domainMin = min - padding;
        const domainMax = max + padding;

        return [domainMin, domainMax];
    };

    const leftAxisDomain = hasLeftAxis ? calculateAxisDomain("left") : [0, 100];
    const rightAxisDomain = hasRightAxis ? calculateAxisDomain("right") : [0, 100];

    // Format Y-axis tick values
    const formatYAxisTick = (value: number, yAxisId: "left" | "right"): string => {
        const format = yAxisId === "left" ? leftAxisFormat : rightAxisFormat;
        const currency = yAxisId === "left" ? leftAxisCurrency : rightAxisCurrency;
        return formatValue(value, format, currency);
    };

    if (!data || data.length === 0) {
        return (
            <div className="line-chart-empty">
                <p>No data to display</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="line-chart-container">
            {dimensions.width > 0 && dimensions.height > 0 && (
                <RechartsLineChart
                    width={dimensions.width}
                    height={dimensions.height}
                    data={data}
                    margin={{ top: 20, right: hasRightAxis ? 60 : 30, left: 20, bottom: 20 }}
                >
                    {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />}
                    
                    <XAxis 
                        dataKey="x" 
                        type={xAxisType}
                        stroke="rgba(255, 255, 255, 0.5)"
                        tick={{ fill: "rgba(255, 255, 255, 0.7)" }}
                    />
                    
                    {hasLeftAxis && (
                        <YAxis 
                            yAxisId="left"
                            orientation="left"
                            stroke="rgba(255, 255, 255, 0.5)"
                            tick={{ fill: "rgba(255, 255, 255, 0.7)" }}
                            tickFormatter={(value) => formatYAxisTick(value, "left")}
                            domain={leftAxisDomain}
                            label={leftAxisLabel ? { value: leftAxisLabel, angle: -90, position: "insideLeft", fill: "palegoldenrod", dx: -15 } : undefined}
                        />
                    )}
                    
                    {hasRightAxis && (
                        <YAxis 
                            yAxisId="right"
                            orientation="right"
                            stroke="rgba(255, 255, 255, 0.5)"
                            tick={{ fill: "rgba(255, 255, 255, 0.7)" }}
                            tickFormatter={(value) => formatYAxisTick(value, "right")}
                            domain={rightAxisDomain}
                            label={rightAxisLabel ? { value: rightAxisLabel, angle: 90, position: "insideRight", fill: "palegoldenrod", dx: 15 } : undefined}
                        />
                    )}
                    
                    <Tooltip 
                        content={
                            <CustomTooltip 
                                leftAxisFormat={leftAxisFormat}
                                rightAxisFormat={rightAxisFormat}
                                leftAxisCurrency={leftAxisCurrency}
                                rightAxisCurrency={rightAxisCurrency}
                                lineConfigs={lines}
                            />
                        }
                    />
                    
                    {showLegend && (
                        <Legend 
                            wrapperStyle={{ color: "rgba(255, 255, 255, 0.7)" }}
                            iconType="line"
                        />
                    )}
                    
                    {lines.map((lineConfig, index) => (
                        <Line
                            key={lineConfig.dataKey}
                            type={curveType}
                            dataKey={lineConfig.dataKey}
                            name={lineConfig.name}
                            yAxisId={lineConfig.yAxisId || "left"}
                            stroke={colors[index % colors.length]}
                            strokeWidth={lineConfig.strokeWidth || 2}
                            dot={lineConfig.dot !== undefined ? lineConfig.dot : showDots}
                            activeDot={{ r: 6 }}
                            animationDuration={800}
                        />
                    ))}
                </RechartsLineChart>
            )}
        </div>
    );
};

export default LineChartComponent;
