import { openApiDocument } from "../app.js";

/* Print the full OpenAPI spec (every route, whatever the features) for ./build-backends.sh App. */
process.stdout.write(JSON.stringify(openApiDocument(), null, 2) + "\n");
