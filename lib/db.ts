import { neon } from "@neondatabase/serverless";

// Minimal document store. Uses PostgreSQL (Neon) when DATABASE_URL / POSTGRES_URL is set,
// otherwise falls back to in-process memory (data is lost on restart / serverless cold start).
export type Doc = Record<string, any>;

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = url ? neon(url) : null;
const g = globalThis as any;
const mem: Map<string, Map<string, Doc>> = (g.__ladliMem ??= new Map());
let ready: Promise<unknown> | null = null;

async function init() {
  ready ??= sql!`CREATE TABLE IF NOT EXISTS docs (
    collection text NOT NULL, id text NOT NULL, data jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (collection, id))`;
  await ready;
}
const col = (c: string) => mem.get(c) ?? mem.set(c, new Map()).get(c)!;

export const db = {
  persistent: !!sql,
  async get<T extends Doc = Doc>(c: string, id: string): Promise<T | null> {
    if (!sql) return (col(c).get(id) as T) ?? null;
    await init();
    const r = await sql`SELECT data FROM docs WHERE collection = ${c} AND id = ${id}`;
    return (r[0]?.data as T) ?? null;
  },
  async put(c: string, id: string, data: Doc) {
    if (!sql) { col(c).set(id, data); return; }
    await init();
    await sql`INSERT INTO docs (collection, id, data) VALUES (${c}, ${id}, ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (collection, id) DO UPDATE SET data = EXCLUDED.data`;
  },
  async del(c: string, id: string) {
    if (!sql) { col(c).delete(id); return; }
    await init();
    await sql`DELETE FROM docs WHERE collection = ${c} AND id = ${id}`;
  },
  async list<T extends Doc = Doc>(c: string): Promise<T[]> {
    if (!sql) return [...col(c).values()] as T[];
    await init();
    const r = await sql`SELECT data FROM docs WHERE collection = ${c} ORDER BY created_at`;
    return r.map((x) => x.data as T);
  },
};

export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
