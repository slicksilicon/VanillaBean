/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface ChildStorageResponse {
    /**
     * Path
     * @description Parent path
     */
    path: string;
    /**
     * Folders
     * @description List of child folder names
     */
    folders: string[];
    /**
     * Files
     * @description List of file names
     */
    files: string[];
}
