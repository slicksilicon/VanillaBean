/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface LoadImageByPathResponse {
    /**
     * Image Base64
     * @description Base64-encoded raw image bytes (original format)
     */
    image_base64: string;
    /**
     * Mime Type
     * @description MIME type of the image (image/jpeg or image/png)
     */
    mime_type: string;
    /**
     * Filename
     * @description Filename of the loaded image
     */
    filename: string;
    /**
     * R
     * @description Red channel of the dominant background colour
     */
    r: number;
    /**
     * G
     * @description Green channel of the dominant background colour
     */
    g: number;
    /**
     * B
     * @description Blue channel of the dominant background colour
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
