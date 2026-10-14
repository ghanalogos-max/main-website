// Lists contributors whose unpaid rewards have reached the payout minimum.
//
//   npm run payouts                -> prints a CSV of who to pay
//   npm run payouts -- --mark-paid -> also records those amounts as paid
//
// Needs in .env.local: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_TOKEN, and the
// production Redis credentials (KV_REST_API_URL / KV_REST_API_TOKEN from Vercel).
// Keep the numbers in sync with src/lib/contributors.ts.
import { createClient } from "@sanity/client";

const REWARD_GHS = 10;
const REWARD_BATCH = 20;
const MINIMUM_GHS = REWARD_GHS;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const sanityToken = process.env.SANITY_API_TOKEN;
if (!redisUrl || !redisToken || !projectId || !sanityToken) {
  console.error(
    "Set KV_REST_API_URL, KV_REST_API_TOKEN, NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local first."
  );
  process.exit(1);
}
const markPaid = process.argv.includes("--mark-paid");

async function redis(commands) {
  const res = await fetch(`${redisUrl}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Redis error ${res.status}`);
  return (await res.json()).map((d) => {
    if (d.error) throw new Error(d.error);
    return d.result;
  });
}

const sanity = createClient({
  projectId,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  token: sanityToken,
  apiVersion: "2024-01-01",
  useCdn: false,
});

const approvedIds = await sanity.fetch(
  `*[_type == "submission" && status == "approved" && defined(contributorId) && !(_id in path("drafts.**"))].contributorId`
);
const approved = new Map();
for (const id of approvedIds) approved.set(id, (approved.get(id) ?? 0) + 1);

const ids = [...approved.keys()];
const values = ids.length
  ? await redis(ids.flatMap((id) => [["GET", `gl:contrib:paid:${id}`], ["GET", `gl:acct:${id}`]]))
  : [];

const rows = [];
ids.forEach((id, i) => {
  const earned = Math.floor(approved.get(id) / REWARD_BATCH) * REWARD_GHS;
  const paid = Number(values[i * 2] ?? 0) / 100;
  const balance = earned - paid;
  if (balance < MINIMUM_GHS) return;
  const account = values[i * 2 + 1] ? JSON.parse(values[i * 2 + 1]) : null;
  const payable = Boolean(account?.phone && account?.phoneVerifiedAt && account?.payout);
  rows.push({ id, approved: approved.get(id), balance, account, payable });
});

const csv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
console.log("account_id,name,email,approved_logos,network,momo_number,wallet_name,amount_ghs");
for (const { id, approved: count, balance, account } of rows) {
  console.log(
    [id, account?.name, account?.email, count, account?.payout?.network, account?.phone, account?.payout?.accountName, balance.toFixed(2)]
      .map(csv)
      .join(",")
  );
}

const blocked = rows.filter((r) => !r.payable);
if (blocked.length) {
  console.error(`\n${blocked.length} contributor(s) have no verified phone or wallet details and won't be marked paid.`);
}

if (markPaid) {
  const payable = rows.filter((r) => r.payable);
  if (payable.length) {
    await redis(payable.map((r) => ["INCRBY", `gl:contrib:paid:${r.id}`, Math.round(r.balance * 100)]));
  }
  console.error(`\nMarked ${payable.length} payout(s) as paid.`);
} else if (rows.length) {
  console.error("\nAfter sending the Mobile Money payments, run again with --mark-paid.");
} else {
  console.error("\nNobody has reached the payout minimum yet.");
}
