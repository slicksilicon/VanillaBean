/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface PngSaveRequest {
    /**
     * Destination Path
     * @description Absolute destination path including the target .png filename
     */
    destination_path: string;
    /**
     * Png Base64
     * @description Base64-encoded PNG data to save
     */
    png_base64: string;
}
