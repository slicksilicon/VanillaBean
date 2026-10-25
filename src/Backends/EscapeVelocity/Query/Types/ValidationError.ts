/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface ValidationError {
    /** Location */
    loc: (string | number)[];
    /** Message */
    msg: string;
    /** Error Type */
    type: string;
    /** Input */
    input?: unknown;
    /** Context */
    ctx?: Record<string, never>;
}
