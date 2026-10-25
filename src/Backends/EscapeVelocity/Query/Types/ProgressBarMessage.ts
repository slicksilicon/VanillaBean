/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

import type { WebSocketProgressBar } from "./WebSocketProgressBar";

export interface ProgressBarMessage {
    /**
     * @description discriminator enum property added by openapi-typescript
     * @enum {string}
     */
    type: "progress_bar";
    payload: WebSocketProgressBar;
}
