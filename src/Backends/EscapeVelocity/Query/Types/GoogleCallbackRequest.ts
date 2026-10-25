/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface GoogleCallbackRequest {
    /**
     * Code
     * @description Authorization code received from Google OAuth2 consent flow
     */
    code: string;
    /**
     * Redirect Uri
     * @description Redirect URI used in the OAuth2 flow (must match Google Cloud Console configuration)
     */
    redirect_uri: string;
}
