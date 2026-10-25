/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface FileSystemInfo {
    /** Full Path */
    full_path: string;
    /** File Name */
    file_name: string;
    /** Size Bytes */
    size_bytes: number;
    /** Date Created */
    date_created: number | null;
    /** Date Modified */
    date_modified: number;
    /** Is Readonly */
    is_readonly: boolean;
    /** Is Hidden */
    is_hidden: boolean;
    /** Is Directory */
    is_directory: boolean;
}
