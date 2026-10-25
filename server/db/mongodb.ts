import { MongoClient, ObjectId, type Collection, type Db, type Document } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";
import { databaseName, projectName, settings } from "../config.js";
import { BadRequestError, ServiceUnavailableError } from "../errors.js";

/*
 * One MongoClient per function instance, shared by every request it serves.
 *
 * Serverless instances come and go, so the pool is deliberately small: Atlas's free M0 tier caps total connections,
 * and every warm instance holds its own pool. attachDatabasePool lets Vercel close idle connections before an
 * instance is suspended instead of leaking them. The client lives on globalThis so `tsx watch` reloads in dev reuse it
 * rather than opening a new pool per edit.
 */

const MAX_POOL_SIZE = 5;

const globalForMongo = globalThis as typeof globalThis & { __vanillabeanMongo?: Promise<MongoClient> };

function connect(): Promise<MongoClient> {
    if (!settings.MONGODB_URI) {
        return Promise.reject(new ServiceUnavailableError("MONGODB_URI is not configured on this server"));
    }
    const client = new MongoClient(settings.MONGODB_URI, {
        appName: projectName,
        maxPoolSize: MAX_POOL_SIZE,
        maxIdleTimeMS: 5_000,
        serverSelectionTimeoutMS: 5_000,
    });
    attachDatabasePool(client);
    return client.connect();
}

export async function getDb(): Promise<Db> {
    // A failed connect is not cached, so the next request retries instead of failing forever.
    globalForMongo.__vanillabeanMongo ??= connect().catch((error: unknown) => {
        globalForMongo.__vanillabeanMongo = undefined;
        throw error;
    });
    return (await globalForMongo.__vanillabeanMongo).db(databaseName());
}

export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
    return (await getDb()).collection<T>(name);
}

/** Turn a client-supplied id into an ObjectId, or a 400 rather than a 500 (EscapeVelocity's parse_object_id). */
export function parseObjectId(value: string, label = "id"): ObjectId {
    if (!ObjectId.isValid(value)) {
        throw new BadRequestError(`Invalid ${label}: ${value}`);
    }
    return new ObjectId(value);
}
