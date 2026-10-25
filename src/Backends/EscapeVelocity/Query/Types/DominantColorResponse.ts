/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface DominantColorResponse {
    /**
     * R
     * @description Red channel of the dominant colour
     */
    r: number;
    /**
     * G
     * @description Green channel of the dominant colour
     */
    g: number;
    /**
     * B
     * @description Blue channel of the dominant colour
     */
    b: number;
    /**
     * Dominant Pixel Count
     * @description Number of pixels with the dominant colour
     */
    dominant_pixel_count: number;
    /**
     * Total Pixels
     * @description Total number of pixels in the image
     */
    total_pixels: number;
}
