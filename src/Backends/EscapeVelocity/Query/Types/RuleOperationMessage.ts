/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

import type { WebSocketRuleOperation } from "./WebSocketRuleOperation";

export interface RuleOperationMessage {
    /**
     * @description discriminator enum property added by openapi-typescript
     * @enum {string}
     */
    type: "rule_operation";
    payload: WebSocketRuleOperation;
}
