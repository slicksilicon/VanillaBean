/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface GoogleCallbackRequest {
    /** @description Authorization code received from Google OAuth2 consent flow */
    code: string;
    /** @description Redirect URI used in the OAuth2 flow - "postmessage" for the popup flow */
    redirect_uri: string;
}
