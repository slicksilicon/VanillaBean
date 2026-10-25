/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

import type { Currency } from "./Currency";

export interface Amount {
    /**
     * Value
     * @description Monetary value
     */
    value: number;
    /**
     * @description Currency of the amount
     * @default MYR
     */
    currency: Currency;
    /**
     * Exchange Rate To Myr
     * @description Exchange rate to MYR
     * @default 1
     */
    exchange_rate_to_myr: number;
}
