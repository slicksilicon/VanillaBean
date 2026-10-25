import type { QueryClient } from "@tanstack/react-query";
import { getNotesQueryKey } from "../Backends/App/Query/useGetNotes";

/*
 * Cache-invalidation helpers for this app's own API - EscapeVelocity's invalidation.ts pattern. Group every query that
 * reflects one domain's state, and call the helper from every mutation that writes that domain, rather than each
 * caller invalidating an ad-hoc subset. Called bare, a generated *QueryKey() is a prefix matching every variant cached.
 */

/** Everything reflecting the notes collection - call after any create or delete. */
export function invalidateNotesData(queryClient: QueryClient): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: getNotesQueryKey() });
}
