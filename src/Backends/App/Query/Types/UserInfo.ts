/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface UserInfo {
    /** @description Google account unique identifier */
    google_id: string;
    /** @description User's email address */
    email: string;
    /** @description User's display name */
    name: string;
    /**
     * @description URL to user's profile picture
     * @default
     */
    picture_url: string;
}
