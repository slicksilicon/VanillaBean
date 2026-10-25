/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

import type { WebSocketRuleProgress } from "./WebSocketRuleProgress";

export interface RuleExecutionMessage {
    /**
     * @description discriminator enum property added by openapi-typescript
     * @enum {string}
     */
    type: "rule_execution";
    payload: WebSocketRuleProgress;
}
