/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface WebSocketRuleProgress {
    /**
     * Window Id
     * @description Unique identifier for the window/session
     */
    window_id: string;
    /**
     * Rule Total
     * @description Total number of rules
     */
    rule_total: number;
    /**
     * Rule Current
     * @description Current rule being executed
     */
    rule_current: number;
    /**
     * Email Total
     * @description Total number of emails
     */
    email_total: number;
    /**
     * Email Current
     * @description Current email being processed
     */
    email_current: number;
}
