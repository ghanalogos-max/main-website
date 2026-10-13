// Key-value storage on Upstash Redis (REST). In development, or when
// API_STORE=memory, an in-process map is used instead — it is lost on every
// restart, so it must never back real customer accounts.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redisEnabled = Boolean(redisUrl && redisToken);
const memoryEnabled =
  !redisEnabled &&
  (process.env.NODE_ENV !== "production" || process.env.API_STORE === "memory");

export const storeEnabled = redisEnabled || memoryEnabled;

type Command = (string | number)[];

export async function redis(commands: Command[]): Promise<unknown[]> {
  const res = await fetch(`${redisUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis error ${res.status}`);
  const data = (await res.json()) as { result: unknown; error?: string }[];
  return data.map((d) => {
    if (d.error) throw new Error(d.error);
    return d.result;
  });
}

interface Entry {
  value: string;
  expiresAt?: number;
}

const memory: Map<string, Entry> = ((globalThis as { __glStore?: Map<string, Entry> })
  .__glStore ??= new Map());

function memoryGet(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string, ttlSeconds?: number) {
  memory.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
  });
}

function assertEnabled() {
  if (!storeEnabled) throw new Error("Storage is not configured.");
}

export const kv = {
  async get<T>(key: string): Promise<T | null> {
    assertEnabled();
    const raw = redisEnabled
      ? ((await redis([["GET", key]]))[0] as string | null)
      : memoryGet(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    assertEnabled();
    const raw = JSON.stringify(value);
    if (!redisEnabled) return memorySet(key, raw, ttlSeconds);
    await redis([
      ttlSeconds ? ["SET", key, raw, "EX", ttlSeconds] : ["SET", key, raw],
    ]);
  },

  /** Sets the key only if it doesn't exist. Returns true when it was set. */
  async setIfAbsent(key: string, value: unknown): Promise<boolean> {
    assertEnabled();
    const raw = JSON.stringify(value);
    if (!redisEnabled) {
      if (memoryGet(key) !== null) return false;
      memorySet(key, raw);
      return true;
    }
    const [result] = await redis([["SET", key, raw, "NX"]]);
    return result === "OK";
  },

  async del(key: string): Promise<void> {
    assertEnabled();
    if (!redisEnabled) {
      memory.delete(key);
      return;
    }
    await redis([["DEL", key]]);
  },

  /** Increments a counter, setting its expiry when first created. */
  async incr(key: string, ttlSeconds: number): Promise<number> {
    assertEnabled();
    if (!redisEnabled) {
      const next = Number(memoryGet(key) ?? 0) + 1;
      const existing = memory.get(key);
      memory.set(key, {
        value: String(next),
        expiresAt: existing?.expiresAt ?? Date.now() + ttlSeconds * 1000,
      });
      return next;
    }
    const [value] = await redis([
      ["INCR", key],
      ["EXPIRE", key, ttlSeconds, "NX"],
    ]);
    return Number(value);
  },

  async count(key: string): Promise<number> {
    assertEnabled();
    const raw = redisEnabled
      ? ((await redis([["GET", key]]))[0] as string | null)
      : memoryGet(key);
    return Number(raw ?? 0);
  },
};
