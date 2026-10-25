/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

import type { LogMessage } from "./LogMessage";
import type { ProgressBarMessage } from "./ProgressBarMessage";
import type { ProgressInfoMessage } from "./ProgressInfoMessage";
import type { RuleExecutionMessage } from "./RuleExecutionMessage";
import type { RuleOperationMessage } from "./RuleOperationMessage";

export type WebSocketMessage = ProgressBarMessage | ProgressInfoMessage | LogMessage | RuleExecutionMessage | RuleOperationMessage;
