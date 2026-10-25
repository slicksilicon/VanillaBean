/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

import type { WebSocketLog } from "./WebSocketLog";

export interface LogMessage {
    /**
     * @description discriminator enum property added by openapi-typescript
     * @enum {string}
     */
    type: "log";
    payload: WebSocketLog;
}
