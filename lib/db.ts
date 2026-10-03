import { neon } from "@neondatabase/serverless";
import { MongoClient, type Collection } from "mongodb";

// Minimal document store with three interchangeable backends, chosen by environment:
//   1. MongoDB   - when MONGODB_URI is set (database name from MONGODB_DB, default "ladlitoys")
//   2. PostgreSQL - when DATABASE_URL / POSTGRES_URL is set (Neon)
//   3. Memory    - otherwise (demo mode: data is lost on restart / serverless cold start)
export type Doc = Record<string, any>;

const mongoUrl = process.env.MONGODB_URI;
const pgUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = !mongoUrl && pgUrl ? neon(pgUrl) : null;
const g = globalThis as any;
const mem: Map<string, Map<string, Doc>> = (g.__ladliMem ??= new Map());
let ready: Promise<unknown> | null = null;

async function initPg() {
  ready ??= sql!`CREATE TABLE IF NOT EXISTS docs (
    collection text NOT NULL, id text NOT NULL, data jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (collection, id))`;
  await ready;
}
const memCol = (c: string) => mem.get(c) ?? mem.set(c, new Map()).get(c)!;

type MongoDoc = { _id: string; collection: string; id: string; data: Doc; createdAt: Date };
// The client is cached on globalThis so warm serverless invocations reuse the same connection pool.
async function mongo(): Promise<Collection<MongoDoc>> {
  g.__ladliMongo ??= new MongoClient(mongoUrl!, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000, ignoreUndefined: true }).connect().then(async (client) => {
    const col = client.db(process.env.MONGODB_DB || "ladlitoys").collection<MongoDoc>("docs");
    await col.createIndex({ collection: 1, createdAt: 1 });
    return col;
  });
  return g.__ladliMongo;
}

export const db = {
  persistent: !!(mongoUrl || sql),
  backend: mongoUrl ? "mongodb" : sql ? "postgres" : "memory",

  async get<T extends Doc = Doc>(c: string, id: string): Promise<T | null> {
    if (mongoUrl) return ((await (await mongo()).findOne({ _id: `${c}:${id}` }))?.data as T) ?? null;
    if (!sql) return (memCol(c).get(id) as T) ?? null;
    await initPg();
    const r = await sql`SELECT data FROM docs WHERE collection = ${c} AND id = ${id}`;
    return (r[0]?.data as T) ?? null;
  },

  async put(c: string, id: string, data: Doc) {
    if (mongoUrl) {
      await (await mongo()).updateOne(
        { _id: `${c}:${id}` },
        { $set: { collection: c, id, data }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
      );
      return;
    }
    if (!sql) { memCol(c).set(id, data); return; }
    await initPg();
    await sql`INSERT INTO docs (collection, id, data) VALUES (${c}, ${id}, ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (collection, id) DO UPDATE SET data = EXCLUDED.data`;
  },

  async del(c: string, id: string) {
    if (mongoUrl) { await (await mongo()).deleteOne({ _id: `${c}:${id}` }); return; }
    if (!sql) { memCol(c).delete(id); return; }
    await initPg();
    await sql`DELETE FROM docs WHERE collection = ${c} AND id = ${id}`;
  },

  async list<T extends Doc = Doc>(c: string): Promise<T[]> {
    if (mongoUrl) return (await (await mongo()).find({ collection: c }).sort({ createdAt: 1 }).toArray()).map((d) => d.data as T);
    if (!sql) return [...memCol(c).values()] as T[];
    await initPg();
    const r = await sql`SELECT data FROM docs WHERE collection = ${c} ORDER BY created_at`;
    return r.map((x) => x.data as T);
  },
};

export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
