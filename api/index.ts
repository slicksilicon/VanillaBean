import { createApp } from "../server/app.js";

/*
 * Vercel function entry. vercel.json rewrites every /api/* path here; the request keeps its original URL, so the Hono
 * app routes it as usual. Created once per instance and reused across requests (and so is its MongoDB pool).
 */

const app = createApp();

const handler = (request: Request): Response | Promise<Response> => app.fetch(request);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
