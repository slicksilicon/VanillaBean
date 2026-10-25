/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface RemoveBackgroundByPathRequest {
    /**
     * File Path
     * @description Absolute path to the JPEG or PNG image
     */
    file_path: string;
    /**
     * R
     * @description Red channel of the target background colour
     */
    r: number;
    /**
     * G
     * @description Green channel of the target background colour
     */
    g: number;
    /**
     * B
     * @description Blue channel of the target background colour
     */
    b: number;
    /**
     * Tolerance
     * @description Per-channel colour tolerance (0 = exact match)
     * @default 0
     */
    tolerance: number;
}
