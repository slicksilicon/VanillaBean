import type { UserInfo } from "./schema/UserInfo.js";

/** Hono environment shared by every router: the auth middleware sets `user` on authenticated requests. */
export interface AppEnv {
    Variables: {
        user?: UserInfo;
    };
}
