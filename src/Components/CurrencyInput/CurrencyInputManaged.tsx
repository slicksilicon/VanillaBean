import { useState, useEffect, forwardRef } from "react";
import CurrencyInput from "./CurrencyInput";
import type { CurrencyInputRef, CurrencyType } from "./CurrencyInput";

interface CurrencyInputManagedProps {
    defaultValue?: string;
    defaultCurrency?: CurrencyType;
    placeholder?: string;
    description?: string;
    descriptionOnLeft?: boolean;
    descriptionLeftWidth?: string;
    onChange?: (value: string) => void;
    onCurrencyChange?: (currency: CurrencyType) => void;
    className?: string;
    disabled?: boolean;
    maxLength?: number;
}

const CurrencyInputManaged = forwardRef<CurrencyInputRef, CurrencyInputManagedProps>(({
    defaultValue = "",
    defaultCurrency = "USD",
    onChange,
    onCurrencyChange,
    ...rest
}, ref) => {
    const [value, setValue] = useState(defaultValue);
    const [currency, setCurrency] = useState<CurrencyType>(defaultCurrency);

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    useEffect(() => {
        setCurrency(defaultCurrency);
    }, [defaultCurrency]);

    const handleChange = (newValue: string) => {
        setValue(newValue);
        onChange?.(newValue);
    };

    const handleCurrencyChange = (newCurrency: CurrencyType) => {
        setCurrency(newCurrency);
        onCurrencyChange?.(newCurrency);
    };

    return (
        <CurrencyInput
            ref={ref}
            value={value}
            currency={currency}
            onChange={handleChange}
            onCurrencyChange={handleCurrencyChange}
            {...rest}
        />
    );
});

CurrencyInputManaged.displayName = "CurrencyInputManaged";

export default CurrencyInputManaged;
