/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface BgRemoveResponse {
    /**
     * Filename
     * @description Suggested output filename with .png extension
     */
    filename: string;
    /**
     * Png Base64
     * @description Base64-encoded PNG with background removed
     */
    png_base64: string;
    /**
     * Original Filename
     * @description Name of the uploaded source file
     */
    original_filename: string;
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
    /**
     * Removed Color R
     * @description Red channel of the removed background colour (0-255)
     */
    removed_color_r: number;
    /**
     * Removed Color G
     * @description Green channel of the removed background colour (0-255)
     */
    removed_color_g: number;
    /**
     * Removed Color B
     * @description Blue channel of the removed background colour (0-255)
     */
    removed_color_b: number;
    /**
     * Removed Pixel Count
     * @description Number of pixels made transparent
     */
    removed_pixel_count: number;
}
