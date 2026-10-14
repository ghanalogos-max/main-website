import { kv, storeEnabled } from "./store";
import type { MomoNetwork } from "./developer";

/** Contributors earn REWARD_GHS for every REWARD_BATCH approved logos. */
export const REWARD_GHS = 10;
export const REWARD_BATCH = 20;
/** Payouts are sent once a whole reward has been earned. */
export const PAYOUT_MINIMUM_GHS = REWARD_GHS;

export const MOMO_NETWORKS: Record<MomoNetwork, string> = {
  mtn: "MTN MoMo",
  telecel: "Telecel Cash",
  at: "AT Money",
};

export function isMomoNetwork(value: unknown): value is MomoNetwork {
  return typeof value === "string" && value in MOMO_NETWORKS;
}

/** Total paid to a contributor so far, in pesewas. */
export const paidOutKey = (id: string) => `gl:contrib:paid:${id}`;

export function rewardFor(approved: number): number {
  return Math.floor(approved / REWARD_BATCH) * REWARD_GHS;
}

export async function contributorEarnings(accountId: string, approved: number) {
  const paidGhs = storeEnabled ? (await kv.count(paidOutKey(accountId))) / 100 : 0;
  const earnedGhs = rewardFor(approved);
  return {
    approved,
    earnedGhs,
    paidGhs,
    balanceGhs: Math.max(0, earnedGhs - paidGhs),
    /** Approved logos still needed for the next reward. */
    toNextReward: REWARD_BATCH - (approved % REWARD_BATCH),
  };
}
