/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

import type { WebSocketProgressInfo } from "./WebSocketProgressInfo";

export interface ProgressInfoMessage {
    /**
     * @description discriminator enum property added by openapi-typescript
     * @enum {string}
     */
    type: "progress_info";
    payload: WebSocketProgressInfo;
}
