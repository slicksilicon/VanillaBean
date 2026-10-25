import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/*
 * EscapeVelocity's error contract, so the generated fetchers behave identically against this API:
 *
 *     {error, message, detail, details, status_code, path}
 *
 * `detail` is "HTTP <status>: <message>" - the only key the generated fetcher reads, and the reason main.tsx can spot a
 * 401 from the error text alone. Throw one of the typed errors below from routes or tools; app.ts renders them.
 */

export class ApiError extends Error {
    readonly status: ContentfulStatusCode;
    readonly code: string;
    readonly details: unknown;

    constructor(status: ContentfulStatusCode, code: string, message: string, details: unknown = {}) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export class BadRequestError extends ApiError {
    constructor(message: string, details: unknown = {}) {
        super(400, "BadRequestException", message, details);
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message: string) {
        super(401, "Unauthorized", message);
    }
}

export class ForbiddenError extends ApiError {
    constructor(message: string) {
        super(403, "ForbiddenException", message);
    }
}

export class NotFoundError extends ApiError {
    constructor(message: string) {
        super(404, "NotFoundException", message);
    }
}

export class ServiceUnavailableError extends ApiError {
    constructor(message: string) {
        super(503, "ServiceUnavailable", message);
    }
}

export function errorResponse(c: Context, status: ContentfulStatusCode, code: string, message: string, details: unknown = {}) {
    return c.json(
        { error: code, message, detail: `HTTP ${status}: ${message}`, details, status_code: status, path: c.req.url },
        status,
    );
}
