import { MongoServerSelectionError } from "mongodb";
import { apiVersion, projectName } from "./config.js";
import { authMiddleware } from "./auth/middleware.js";
import { ApiError, errorResponse } from "./errors.js";
import { createRouter } from "./router.js";
import { ROUTERS } from "./routes/index.js";

/*
 * The app's API: one Hono app serving /api/*, deployed as a single Vercel function (api/index.ts) and run locally by
 * server/dev.ts. Middleware order mirrors EscapeVelocity: auth first, then routes; errors always leave in the shared
 * envelope (errors.ts).
 */

const OPENAPI_CONFIG = {
    openapi: "3.1.0",
    info: { title: projectName, version: apiVersion },
};

/**
 * @param allRoutes mount every router regardless of features - used only to write the OpenAPI spec, so the generated
 *                  hooks cover every endpoint and never change when a feature is toggled.
 */
export function createApp({ allRoutes = false }: { allRoutes?: boolean } = {}) {
    const app = createRouter();

    app.use("/api/*", authMiddleware);
    for (const { router, enabled } of ROUTERS) {
        if (allRoutes || enabled) {
            app.route("/", router);
        }
    }

    app.doc31("/api/openapi.json", OPENAPI_CONFIG);

    app.notFound(c => errorResponse(c, 404, "NotFound", `No endpoint for ${c.req.method} ${c.req.path}`));

    app.onError((error, c) => {
        if (error instanceof ApiError) {
            return errorResponse(c, error.status, error.code, error.message, error.details);
        }
        if (error instanceof MongoServerSelectionError) {
            console.error("MongoDB unreachable:", error.message);
            return errorResponse(c, 503, "ServiceUnavailable", "The database is unreachable");
        }
        // Never echo the raw error to the client - it can leak internals. The log has it.
        console.error(`Unhandled error on ${c.req.method} ${c.req.path}:`, error);
        return errorResponse(c, 500, "InternalServerError", "An unexpected error occurred");
    });

    return app;
}

export function openApiDocument() {
    return createApp({ allRoutes: true }).getOpenAPI31Document(OPENAPI_CONFIG);
}
