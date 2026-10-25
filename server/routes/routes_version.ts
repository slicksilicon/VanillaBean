import { createRoute } from "@hono/zod-openapi";
import { apiVersion } from "../config.js";
import { createRouter } from "../router.js";
import { VersionResponse } from "../schema/VersionResponse.js";

export const router = createRouter();

router.openapi(
    createRoute({
        method: "get",
        path: "/api/version/",
        operationId: "get_version_api_version__get",
        tags: ["Version"],
        summary: "Get Version",
        responses: {
            200: { description: "The API version", content: { "application/json": { schema: VersionResponse } } },
        },
    }),
    c => c.json({ version: apiVersion }, 200),
);
