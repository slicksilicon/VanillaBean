/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface Body_remove_background_api_image_tools_remove_background_post {
    /** File */
    file: string;
    /**
     * Tolerance
     * @description Per-channel colour tolerance (0 = exact match, 255 = full range)
     * @default 0
     */
    tolerance: number;
}
