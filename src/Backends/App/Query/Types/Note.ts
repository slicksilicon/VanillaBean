/**
 * Auto-generated type definition
 * Extracted from OpenAPI schema
 */

export interface Note {
    /** @description Note id (MongoDB ObjectId as hex) */
    id: string;
    /** @description Note text */
    text: string;
    /** @description Email of the user who wrote it, or "anonymous" when sign-in is off */
    owner: string;
    /** @description Creation time, ISO 8601 UTC */
    created_at: string;
}
