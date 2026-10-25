/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface RemoveBackgroundByPathResponse {
    /**
     * Png Base64
     * @description Base64-encoded PNG with background removed
     */
    png_base64: string;
    /**
     * Removed Pixel Count
     * @description Number of pixels made transparent
     */
    removed_pixel_count: number;
    /**
     * Original Width
     * @description Width of the source image in pixels
     */
    original_width: number;
    /**
     * Original Height
     * @description Height of the source image in pixels
     */
    original_height: number;
}
