import React from "react";
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip } from "recharts";
import { getColorFromScheme } from "../Helpers/GetColorsFromScheme";
import type { ColorSchemeNames } from "../Helpers/GetColorsFromScheme";
import { formatCurrencyValue } from "../Helpers/CurrencyDisplay";
import ToggleSwitch from "../Components/ToggleSwitch/ToggleSwitch";
import "../Helpers/ColorScheme.css"; // getColorFromScheme reads these CSS vars at runtime — must be bundled
import "./PieChart.css";
import type { Currency } from "../Query/Types";

export type PieChartLabelFormat = 'number' | 'percentage' | 'currency';

export interface PieChartDataItem {
    name: string;
    value: number;
}

/** One pie's worth of data, named. Used only when the caller offers a split. */
export interface PieChartSeries {
    label: string;
    data: PieChartDataItem[];
}

export interface PieChartProps {
    /* Exact colour per slice name, overriding the scheme - the same contract as
       BarChartProps, so one caller can colour a bar chart and a pie consistently. Names not
       present fall back to the scheme by position. */
    colorOverrides?: Record<string, string>;
    data: PieChartDataItem[];
    colorScheme: ColorSchemeNames;
    label_format : PieChartLabelFormat;
    label_currency: Currency | null;
    /* How the hover tooltip formats its value; defaults to the on-slice label's format. Lets a
       chart show a compact % on the slice while the tooltip reveals the full currency value. */
    tooltip_format?: PieChartLabelFormat;
    tooltip_currency?: Currency | null;
    /* The same total broken out into its parts - one pie per entry, side by side. Supplied
       with more than one entry, a switch appears above the chart and the caller's `data`
       becomes the combined view behind it; `data` therefore still has to be the aggregate,
       so turning the switch off is a view change and never a change of subject. Omitted, or
       a single entry, the component behaves exactly as it did before and no switch shows. */
    series?: PieChartSeries[];
    /** Which view the switch opens on. Ignored when there is nothing to split. */
    splitInitial?: boolean;
    /** Names the switch, for callers whose split means something specific ("Split by year"). */
    splitLabel?: string;
}

const RADIAN = Math.PI / 180;

// Custom Tooltip Component
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        payload: PieChartDataItem;
    }>;
    label_format: PieChartLabelFormat;
    label_currency: Currency | null;  
    total: number;
}

const displayValue = (value: number, label_format: PieChartLabelFormat, label_currency: Currency | null, percent: number, append_percent: boolean): string => {
    let labelText = '';
    if (label_format === 'number') {
        labelText = `${value}`;
    } else if (label_format === 'percentage') {
        labelText = `${(percent * 100).toFixed(0)}%`;
    } else if (label_format === 'currency' && label_currency) {
        labelText = `${formatCurrencyValue(value, label_currency)}`;
    } else {
        labelText = `${value}`; // Fallback to number
    }

    if (append_percent && label_format !== 'percentage') {
        labelText += ` [${(percent * 100).toFixed(0)}%]`;
    }

    return labelText;
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label_format, label_currency, total}) => {
    if (active && payload && payload.length > 0) {
        const data = payload[0];

        // A pie of all-zero slices has no total, and x/0 is NaN rather than an error - which
        // renders as "NaN%" in the tooltip rather than failing anywhere you would notice.
        const percent = total ? data.value / total : 0;
        const formattedValue = displayValue(data.value, label_format, label_currency, percent, false);

        return (
            <div className="pie-chart-tooltip">
                <p className="pie-chart-tooltip-label">{data.payload.name}</p>
                <p className="pie-chart-tooltip-value">{formattedValue}</p>
                <p className="pie-chart-tooltip-percent">{(percent * 100).toFixed(1)}%</p>
            </div>
        );
    }

    return null;
};

const labelFormatter = (
        cx : number | string | undefined, 
        cy: number | string | undefined, 
        midAngle: number | undefined, 
        innerRadius: number | undefined, 
        outerRadius: number | undefined, 
        value: number, 
        percent: number, 
        sectionLabel : string,
        label_format: PieChartLabelFormat, 
        label_currency: Currency | null,
        compact: boolean)  => {

            if (cx == null || cy == null || innerRadius == null || outerRadius == null) {
                return null;
            }

            /* A split shows the same slices in a third of the width, so the threshold for
               a slice being worth labelling in place rises with it. */
            if (percent <= (compact ? 0.08 : 0.05)) {
                return null;
            }
                        
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const ncx = Number(cx);
            const x = ncx + radius * Math.cos(-(midAngle ?? 0) * RADIAN) + 10;
            const ncy = Number(cy);
            const y = ncy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

            const labelText = displayValue(value, label_format, label_currency, percent, false);
            const offset = compact ? 8 : 10;
            
            /* pointer-events:none lets the mouse fall through the label onto the slice beneath it,
               so hovering the on-slice text triggers the same tooltip as hovering the slice. */
            return (
                <g style={{ pointerEvents: "none" }}>
                    <text
                        x={x} 
                        y={y-offset} 
                        fill="black"                         
                        textAnchor="middle"
                        dominantBaseline="central" 
                        fontSize={compact ? "10px" : "12px"} 
                        fontWeight="600">
                        {sectionLabel}
                    </text>
                    <text 
                        x={x} 
                        y={y+offset} 
                        fill="black"                         
                        textAnchor="middle"
                        dominantBaseline="central" 
                        fontSize={compact ? "11px" : "14px"} 
                        fontWeight="600"
                    >
                        {labelText}
                    </text>
                </g>
            );
}

/* One pie. Extracted so that the combined view and each pane of a split are rendered by
   exactly the same code - a split cannot drift from the whole it is a split of. Hover state
   is per-pie, so pointing at one pane does not repaint its neighbours. */
interface SinglePieProps {
    data: PieChartDataItem[];
    colorScheme: ColorSchemeNames;
    label_format: PieChartLabelFormat;
    label_currency: Currency | null;
    tooltip_format?: PieChartLabelFormat;
    tooltip_currency?: Currency | null;
    colorOverrides?: Record<string, string>;
    compact: boolean;
}

const SinglePie: React.FC<SinglePieProps> = ({ data, colorScheme, label_format, label_currency, tooltip_format, tooltip_currency, colorOverrides, compact }) => {
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

    const colors = getColorFromScheme(colorScheme);

    const filteredData = data.filter((item) => item.value > 0);
    const rechartsData = filteredData.map((item) => ({ ...item } as Record<string, string | number>));
    const sectionNames = filteredData.map(item => item.name);
    const totalValue = filteredData.reduce((sum, item) => sum + item.value, 0);

    if (filteredData.length === 0) {
        return (
            <div className="pie-chart-empty">
                <p>No data to display</p>
            </div>
        );
    }

    return (
        <div className="pie-chart-chart">
            <RechartsPieChart height="100%" width="100%">
                <Pie
                    data={rechartsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={
                        ({cx, cy, midAngle, innerRadius, outerRadius, value, percent, index }) =>
                            labelFormatter(
                                cx,
                                cy,
                                midAngle as number | undefined,
                                innerRadius as number | undefined,
                                outerRadius as number | undefined,
                                value as number,
                                percent as number,
                                sectionNames[index],
                                label_format,
                                label_currency,
                                compact)}
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={0}
                    isAnimationActive={false}
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    {rechartsData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={hoveredIndex === index ? "#303030" : (colorOverrides?.[String(entry.name)] ?? colors[index % colors.length])}
                            style={{ cursor: "pointer" }}
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip label_format={tooltip_format ?? label_format} label_currency={tooltip_currency ?? label_currency} total={totalValue} />} />
            </RechartsPieChart>
        </div>
    );
};

export const PieChartComponent: React.FC<PieChartProps> = ({
    data,
    colorScheme = "gemini-large",
    label_format,
    label_currency,
    tooltip_format,
    tooltip_currency,
    colorOverrides,
    series,
    splitInitial = false,
    splitLabel = "Split",
}) => {
    /* A split of one pane is the combined view, so the switch only earns its place from two
       panes up. Holding the preference rather than the resolved value means a selection that
       drops to a single series and grows again comes back split. */
    const canSplit = (series?.length ?? 0) > 1;
    const [splitPreference, setSplitPreference] = React.useState<boolean>(splitInitial);
    const isSplit = canSplit && splitPreference;

    const hasAnyValue = data.some((item) => item.value > 0);

    return (
        <>
            {canSplit && hasAnyValue && (
                <div className="pie-chart-selectors">
                    <ToggleSwitch
                        id="pie-split-toggle"
                        variant="info"
                        label={splitLabel}
                        checked={isSplit}
                        onChange={(isChecked) => { setSplitPreference(isChecked); }}
                    />
                </div>
            )}

            {isSplit ? (
                <div className="pie-chart-split">
                    {series?.map((entry) => (
                        <div key={entry.label} className="pie-chart-split-pane">
                            <div className="pie-chart-split-label">{entry.label}</div>
                            <SinglePie
                                data={entry.data}
                                colorScheme={colorScheme}
                                label_format={label_format}
                                label_currency={label_currency}
                                tooltip_format={tooltip_format}
                                tooltip_currency={tooltip_currency}
                                colorOverrides={colorOverrides}
                                compact={true}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <SinglePie
                    data={data}
                    colorScheme={colorScheme}
                    label_format={label_format}
                    label_currency={label_currency}
                    tooltip_format={tooltip_format}
                    tooltip_currency={tooltip_currency}
                    colorOverrides={colorOverrides}
                    compact={false}
                />
            )}
        </>
    );
};

export default PieChartComponent;