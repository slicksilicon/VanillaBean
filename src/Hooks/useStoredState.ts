import { useCallback, useState } from "react";

/*
 * useState backed by localStorage - the template's building block for data that should survive a reload.
 *
 * Storage is per browser and per origin, and can be unavailable (private windows, blocked site data), so every read
 * and write is guarded: a failed read falls back to `initialValue`, and a failed write keeps the in-memory value so
 * the UI still works for the rest of the session. Values are stored as JSON under `vanillabean:<key>`.
 */

const STORAGE_PREFIX = "vanillabean:";

function readStored<T>(key: string, initialValue: T): T {
    try {
        const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
        return raw === null ? initialValue : (JSON.parse(raw) as T);
    } catch {
        return initialValue;
    }
}

export function useStoredState<T>(key: string, initialValue: T): [T, (value: T | ((previous: T) => T)) => void] {
    const [value, setValue] = useState<T>(() => readStored(key, initialValue));

    const setStoredValue = useCallback((next: T | ((previous: T) => T)) => {
        setValue(previous => {
            const resolved = next instanceof Function ? next(previous) : next;
            try {
                window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(resolved));
            } catch (error) {
                console.warn(`useStoredState: could not persist "${key}"`, error);
            }
            return resolved;
        });
    }, [key]);

    return [value, setStoredValue];
}
