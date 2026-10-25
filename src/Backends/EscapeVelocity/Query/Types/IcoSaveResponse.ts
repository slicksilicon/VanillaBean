/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface IcoSaveResponse {
    /**
     * Success
     * @description Whether the file was saved successfully
     */
    success: boolean;
    /**
     * Saved Path
     * @description Absolute path where the file was written
     */
    saved_path: string;
    /**
     * Message
     * @description Human-readable status message
     */
    message: string;
}
