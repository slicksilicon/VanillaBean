/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface UserInfo {
    /**
     * Google Id
     * @description Google account unique identifier
     */
    google_id: string;
    /**
     * Email
     * @description User's email address
     */
    email: string;
    /**
     * Name
     * @description User's display name
     */
    name: string;
    /**
     * Picture Url
     * @description URL to user's profile picture
     * @default
     */
    picture_url: string;
}
