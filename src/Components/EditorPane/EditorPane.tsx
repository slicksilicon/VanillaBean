import React, { useState, useEffect } from "react";
import DropdownSelectorManaged from "../DropdownSelector/DropdownSelectorManaged";
import type { Option } from "../DropdownSelector/DropdownSelector";
import TextInputManaged from "../TextInput/TextInputManaged";
import PercentageInput from "../PercentageInput/PercentageInput";
import DateSelector from "../DateSelector/DateSelector";
import Button from "../Button/Button";
import { type Amount, type Currency } from "../../Query/Types";
import CurrencyInputManaged from "../CurrencyInput/CurrencyInputManaged";

import "./EditorPane.css";
import "../../Helpers/CommonStyles.css";

export type EditorItem = "calendar" | "text" | "number" | "percentage" | "currency" | "dropdown" | "tickbox";

export interface EditorFieldConfig {
    key: string;
    label: string;
    type: EditorItem;
    placeholder?: string;
    dropdownItems?: string[];
    dropdownLoading?: boolean;
    currency?: Currency;
}

export interface EditorPaneProps {
    operationName: string;
    fields: EditorFieldConfig[];
    values: Record<string, Option | string | number | boolean | Date | Amount | null>;
    onSubmit: (values: Record<string, Option | string | number | boolean | Date | Amount | null>) => void;
    onModify: (values: Record<string, Option | string | number | boolean | Date | Amount | null>) => void;
    onDelete: () => void;
    onCancel: () => void;
    onDateChange?: (date: Date) => void;
    optionalFieldKeys?: string[];
    isLoading?: boolean;
    disabled?: boolean;
}

type EditorPaneMode = "create" | "modify";

export const EditorPane: React.FC<EditorPaneProps> = ({
    operationName,
    fields,
    values,
    onSubmit,
    onModify,
    onDelete,
    onCancel,
    onDateChange,
    isLoading = false,
    disabled = false,
    optionalFieldKeys = [],
}) => {
    const [paneMode, setPaneMode] = useState<EditorPaneMode>("create");
    const [title, setTitle] = useState<string>("");
    const [formValues, setFormValues] = useState<Record<string, Option | string | number | boolean | Date | Amount | null>>(values);

    /* Update Panel mode based on whether values are populated */
    useEffect(() => {
        let hasAllValues : boolean = true;
        
        Object.entries(values).forEach(([key, value]) => {            
            if (value !== null && value !== "" && value !== undefined) {
                return;
            }

            if (optionalFieldKeys.includes(key)) {
                return;
            }

            hasAllValues = false;
            
        });        
        setPaneMode(hasAllValues ? "modify" : "create");
    }, [values, optionalFieldKeys]);

    /* Update form values when props change - but preserve user changes */
    useEffect(() => {
        setFormValues(prevValues => {
            // Only update if values have meaningfully changed
            // Merge incoming values with existing ones, preserving non-null user selections
            const newValues = { ...prevValues };
            let hasChanges = false;
            
            Object.keys(values).forEach(key => {
                // Update if the incoming value is different and not null/undefined
                // OR if the previous value was null and we have a non-null incoming value
                if (values[key] !== prevValues[key]) {
                    // If incoming value is null/undefined, only update if previous was also null/undefined
                    if (values[key] === null || values[key] === undefined || values[key] === "") {
                        if (prevValues[key] === null || prevValues[key] === undefined || prevValues[key] === "") {
                            newValues[key] = values[key];
                            hasChanges = true;
                        }
                        // else preserve the user's selection
                    } else {
                        // Non-null incoming value, update it
                        newValues[key] = values[key];
                        hasChanges = true;
                    }
                }
            });
            
            return hasChanges ? newValues : prevValues;
        });
    }, [values]);

    /* Update Title */
    useEffect(() => {
        if (paneMode === "create") {
            setTitle(`Create New ${operationName}`);
        } else if (paneMode === "modify") {
            setTitle(`Edit ${operationName}`);
        }
    }, [operationName, paneMode]);

    const handleFieldChange = (key: string, value: Option | string | number | boolean | Date | Amount | null) => {
        setFormValues((prev) => ({
            ...prev,
            [key]: value,
        }));

        if (key === "date" && value instanceof Date && onDateChange) {
            onDateChange(value);
        }
    };

    const handleFieldReset = (key: string) => {
        setFormValues((prev) => ({
            ...prev,
            [key]: null,
        }));
    };

    const handleSubmitClick = () => {
        if (paneMode === "create") {            
            onSubmit(formValues);
        } else {
            onModify(formValues);
        }
    };

    const handleCancelClick = () => {
        onCancel();
    };

    const renderField = (field: EditorFieldConfig) => {
        const key = `${field.key}-${paneMode}`;
        const value = formValues[field.key];

        switch (field.type) {
            case "dropdown":                
                return (
                    <DropdownSelectorManaged
                        key={key}
                        options={(field.dropdownItems || []).map(item => ({ id: item, value: item }))}
                        placeholder={field.placeholder || `Select ${field.label}`}
                        description={field.label}
                        onChange={(val) => handleFieldChange(field.key, val)}
                        defaultValue={ value ? { id: String(value), value: String(value) } : null}
                    />
                );

            case "text":
                return (
                    <TextInputManaged
                        key={key}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        description={field.label}
                        onChange={(val) => handleFieldChange(field.key, val)}
                        defaultValue={(value as string) || ""}
                    />
                );

            case "currency": {
                const amountValue = value as Amount | null;
                return (
                    <CurrencyInputManaged
                        key={key}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        description={field.label}
                        defaultCurrency={amountValue?.currency || field.currency || "MYR"}
                        onChange={(val) => {
                            const currentAmount = formValues[field.key] as Amount | null;
                            handleFieldChange(field.key, {
                                value: parseFloat(val) || 0,
                                currency: currentAmount?.currency || field.currency || "MYR",
                                exchange_rate_to_myr: currentAmount?.exchange_rate_to_myr || 1
                            } as Amount);
                        }}
                        onCurrencyChange={(curr) => {
                            const currentAmount = formValues[field.key] as Amount | null;
                            handleFieldChange(field.key, {
                                value: currentAmount?.value || 0,
                                currency: curr,
                                exchange_rate_to_myr: currentAmount?.exchange_rate_to_myr || 1
                            } as Amount);
                        }}
                        defaultValue={amountValue?.value?.toString() || ""}
                    />
                );
            }
                  
            

            case "percentage":
                return (
                    <PercentageInput
                        key={key}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        description={field.label}
                        descriptionPosition="top"
                        onChange={(val) => handleFieldChange(field.key, val)}
                        onReset={() => handleFieldReset(field.key)}
                        defaultValue={(value as string) || ""}
                    />
                );

            case "calendar":
                return (
                    <div key={key}>
                        <div style={{ fontSize: "12px", marginBottom: "8px", color: "rgba(255, 255, 255, 0.7)" }}>
                            {field.label}
                        </div>
                        <DateSelector
                            onDateSelect={(val: Date) => handleFieldChange(field.key, val)}
                            initialDate={value as Date | undefined}                            
                        />
                    </div>
                );

            case "tickbox":
                return (
                    <div
                        key={key}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            color: "rgba(255, 255, 255, 0.9)",
                        }}
                    >
                        <input
                            type="checkbox"
                            id={field.key}
                            checked={Boolean(value)}
                            onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                            style={{
                                width: "16px",
                                height: "16px",
                                accentColor: "#4caf50",
                            }}
                        />
                        <label htmlFor={field.key} style={{ fontSize: "14px" }}>
                            {field.label}
                        </label>
                    </div>
                );

            case "number":
                return (
                    <TextInputManaged
                        key={key}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        description={field.label}
                        onChange={(val) => handleFieldChange(field.key, val)}
                        defaultValue={String(value || "")}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="editor-pane-container">
            {/* Form Header */}
            <div className="secondary-titles">
                <h3
                    style={{
                        color: "rgba(255, 255, 255, 0.9)",
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: 600,
                    }}
                >
                    {title}
                </h3>
            </div>

            {/* Scrollable Fields Container */}
            <div className="editor-pane-fields">
                {fields.map((field) => renderField(field))}
            </div>

            {/* Fixed Action Buttons */}
            <div className="editor-pane-actions">
                {paneMode === "modify" ? (
                    // Edit mode buttons
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <Button variant="warning" onClick={handleSubmitClick} loading={isLoading} disabled={disabled}>
                            Modify
                        </Button>
                        <Button variant="danger" onClick={onDelete} disabled={isLoading || disabled}>
                            Delete
                        </Button>
                        <Button variant="info" onClick={handleCancelClick} disabled={isLoading}>
                            Cancel
                        </Button>
                    </div>
                ) : (
                    // Create mode button
                    <Button variant="success" onClick={handleSubmitClick} loading={isLoading} disabled={disabled}>
                        Create {operationName}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default EditorPane;
