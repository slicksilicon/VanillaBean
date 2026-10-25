import { type Amount } from "../Query/Types"
import type { Currency } from "../Query/Types";



export const displayRinggit = (amountInRinggit: number): string => {
    const amount : Amount = {
        currency: "MYR",
        value: amountInRinggit,
        exchange_rate_to_myr: 1,
    };
    return displayCurrency(amount);
    
};

export const displayCurrency = (amount: Amount): string => {
    const currencySymbols: Record<string, string> = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        JPY: "¥",
        MYR: "RM",
        SGD: "S$",
        AUD: "A$",
        CAD: "C$",
        CHF: "CHF",
        CNY: "¥",
        NZD: "NZ$",
        HKD: "HK$",
    };

    const symbol = currencySymbols[amount.currency] || amount.currency;
    const decimalPlaces = amount.currency === "JPY" ? 0 : 2;

    const formattedValue: string = amount.value.toLocaleString('en-US', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
    });

    return `${symbol} ${formattedValue}`;
};

export const formatCurrencyValue = (value: number, currency: Currency): string => {
    const amount : Amount = {
        currency : currency,
        value: value,
        exchange_rate_to_myr: 1,
    };
    return displayCurrency(amount);
}
        