import { OpenAPIHono } from "@hono/zod-openapi";
import { errorResponse } from "./errors.js";
import type { AppEnv } from "./types.js";

/**
 * Every router is created here so request validation fails the same way everywhere: a 422 in the shared error
 * envelope, with zod's issues as `details` (FastAPI's RequestValidationError in EscapeVelocity).
 */
export function createRouter() {
    return new OpenAPIHono<AppEnv>({
        defaultHook: (result, c) => {
            if (!result.success) {
                return errorResponse(c, 422, "RequestValidationError", "Request validation failed", result.error.issues);
            }
        },
    });
}
