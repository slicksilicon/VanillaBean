/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface WebSocketLog {
    /**
     * Level
     * @description Log level (e.g., INFO, ERROR)
     */
    level: string;
    /**
     * Message
     * @description Log message content
     */
    message: string;
    /**
     * Function
     * @description Function where the log was generated
     */
    function: string;
    /**
     * File
     * @description File where the log was generated
     */
    file: string;
    /**
     * Line
     * @description Line number in the file
     */
    line: number;
    /**
     * Timestamp
     * @description Timestamp of the log entry in ISO 8601 format
     */
    timestamp: string;
}
