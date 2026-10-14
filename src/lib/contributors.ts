import { kv, storeEnabled } from "./store";
import { sanityClient } from "./sanity.client";
import { monthKey, type MomoNetwork } from "./developer";

/** Share of Premium revenue paid to contributors, split by download share. */
export const CONTRIBUTOR_SHARE = 0.5;
export const PAYOUT_MINIMUM_GHS = 50;
/** First month earnings are counted. */
export const PROGRAM_START_MONTH = "2026-10";

export const MOMO_NETWORKS: Record<MomoNetwork, string> = {
  mtn: "MTN MoMo",
  telecel: "Telecel Cash",
  at: "AT Money",
};

export function isMomoNetwork(value: unknown): value is MomoNetwork {
  return typeof value === "string" && value in MOMO_NETWORKS;
}

const revenueKey = (month: string) => `gl:pool:rev:${month}`;
const revenueRefKey = (reference: string) => `gl:pool:revref:${reference}`;
const totalDownloadsKey = (month: string) => `gl:pool:dl:${month}`;
const contributorDownloadsKey = (id: string, month: string) => `gl:pool:dl:${id}:${month}`;
export const paidOutKey = (id: string) => `gl:pool:paid:${id}`;

/** Counts a Premium payment towards its month's pool, once per reference. */
export async function recordPremiumRevenue(reference: string, pesewas: number, paidAt: string) {
  if (!storeEnabled || !(pesewas > 0)) return;
  try {
    if (await kv.setIfAbsent(revenueRefKey(reference), 1)) {
      await kv.incrBy(revenueKey(monthKey(new Date(paidAt))), pesewas);
    }
  } catch (err) {
    console.error("Couldn't record Premium revenue", err);
  }
}

async function logoContributor(logoId: string): Promise<string | null> {
  if (!sanityClient) return null;
  try {
    return await sanityClient.fetch<string | null>(
      `*[_id == $id][0].contributorId`,
      { id: logoId },
      { next: { revalidate: 300 } }
    );
  } catch {
    return null;
  }
}

/**
 * Counts a website download towards the pool. Each visitor counts once per
 * logo per day, and contributors downloading their own logos don't earn.
 */
export async function recordPoolDownload(opts: {
  slug: string;
  logoId?: string;
  ip: string;
  viewerId?: string;
}) {
  if (!storeEnabled) return;
  try {
    const day = new Date().toISOString().slice(0, 10);
    const fresh = await kv.setIfAbsent(`gl:pool:seen:${opts.slug}:${opts.ip}:${day}`, 1, 26 * 3600);
    if (!fresh) return;
    const month = monthKey();
    await kv.incrBy(totalDownloadsKey(month), 1);
    const contributorId = opts.logoId ? await logoContributor(opts.logoId) : null;
    if (contributorId && contributorId !== opts.viewerId) {
      await kv.incrBy(contributorDownloadsKey(contributorId, month), 1);
    }
  } catch (err) {
    console.error("Couldn't record pool download", err);
  }
}

export interface MonthEarnings {
  month: string;
  downloads: number;
  totalDownloads: number;
  poolGhs: number;
  earningsGhs: number;
  /** False for the current month, which is still an estimate. */
  final: boolean;
}

export function programMonths(now = new Date()): string[] {
  const months: string[] = [];
  const current = monthKey(now);
  let [y, m] = PROGRAM_START_MONTH.split("-").map(Number);
  for (let key = PROGRAM_START_MONTH; key <= current; ) {
    months.push(key);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    key = `${y}-${String(m).padStart(2, "0")}`;
  }
  return months;
}

const round2 = (n: number) => Math.floor(n * 100) / 100;

export async function contributorEarnings(accountId: string): Promise<{
  months: MonthEarnings[];
  earnedGhs: number;
  paidGhs: number;
  balanceGhs: number;
}> {
  const months = programMonths();
  const current = monthKey();
  const keys = months.flatMap((m) => [
    contributorDownloadsKey(accountId, m),
    totalDownloadsKey(m),
    revenueKey(m),
  ]);
  const [values, paidPesewas] = storeEnabled
    ? await Promise.all([kv.counts(keys), kv.count(paidOutKey(accountId))])
    : [keys.map(() => 0), 0];

  const result = months.map((month, i) => {
    const [downloads, totalDownloads, revenuePesewas] = values.slice(i * 3, i * 3 + 3);
    const poolGhs = (revenuePesewas / 100) * CONTRIBUTOR_SHARE;
    return {
      month,
      downloads,
      totalDownloads,
      poolGhs: round2(poolGhs),
      earningsGhs: totalDownloads ? round2((poolGhs * downloads) / totalDownloads) : 0,
      final: month < current,
    };
  });

  const earnedGhs = round2(result.filter((m) => m.final).reduce((s, m) => s + m.earningsGhs, 0));
  const paidGhs = paidPesewas / 100;
  return {
    months: result.reverse(),
    earnedGhs,
    paidGhs,
    balanceGhs: round2(Math.max(0, earnedGhs - paidGhs)),
  };
}
