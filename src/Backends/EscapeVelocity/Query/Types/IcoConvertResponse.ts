/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface IcoConvertResponse {
    /**
     * Filename
     * @description Suggested output filename with .ico extension
     */
    filename: string;
    /**
     * Ico Base64
     * @description Base64-encoded ICO file data
     */
    ico_base64: string;
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
}
