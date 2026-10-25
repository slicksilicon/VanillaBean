/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface VideoFilesResponse {
    /**
     * Folder
     * @description Root folder that was scanned
     */
    folder: string;
    /**
     * Files
     * @description List of absolute paths to video files found recursively
     */
    files: string[];
}
