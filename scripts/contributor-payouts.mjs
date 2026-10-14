// Lists contributors whose unpaid balance has reached the payout minimum.
//
//   npm run payouts               -> prints a CSV of who to pay
//   npm run payouts -- --mark-paid -> also records those balances as paid
//
// Needs the production Redis credentials in .env.local
// (KV_REST_API_URL / KV_REST_API_TOKEN, copied from Vercel).
// Keep in sync with src/lib/contributors.ts.

const SHARE = 0.5;
const MINIMUM_GHS = 50;
const START_MONTH = "2026-10";

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error("Set KV_REST_API_URL and KV_REST_API_TOKEN (from Vercel) in .env.local first.");
  process.exit(1);
}
const markPaid = process.argv.includes("--mark-paid");

async function redis(commands) {
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Redis error ${res.status}`);
  return (await res.json()).map((d) => {
    if (d.error) throw new Error(d.error);
    return d.result;
  });
}

function finalMonths() {
  const current = new Date().toISOString().slice(0, 7);
  const months = [];
  let [y, m] = START_MONTH.split("-").map(Number);
  for (let key = START_MONTH; key < current; ) {
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

async function contributorIds() {
  const ids = new Set();
  let cursor = "0";
  do {
    const [[next, keys]] = await redis([["SCAN", cursor, "MATCH", "gl:pool:dl:*:*", "COUNT", 500]]);
    cursor = next;
    for (const key of keys) ids.add(key.split(":")[3]);
  } while (cursor !== "0");
  return [...ids];
}

const csv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const months = finalMonths();
if (!months.length) {
  console.log("No completed months yet.");
  process.exit(0);
}

const totals = await redis(months.flatMap((m) => [["GET", `gl:pool:dl:${m}`], ["GET", `gl:pool:rev:${m}`]]));
const pool = months.map((m, i) => ({
  month: m,
  totalDownloads: Number(totals[i * 2] ?? 0),
  poolGhs: (Number(totals[i * 2 + 1] ?? 0) / 100) * SHARE,
}));

const rows = [];
for (const id of await contributorIds()) {
  const values = await redis([
    ...months.map((m) => ["GET", `gl:pool:dl:${id}:${m}`]),
    ["GET", `gl:pool:paid:${id}`],
    ["GET", `gl:acct:${id}`],
  ]);
  const earned = pool.reduce((sum, p, i) => {
    const downloads = Number(values[i] ?? 0);
    return sum + (p.totalDownloads ? Math.floor(((p.poolGhs * downloads) / p.totalDownloads) * 100) / 100 : 0);
  }, 0);
  const paid = Number(values[months.length] ?? 0) / 100;
  const balance = Math.floor((earned - paid) * 100) / 100;
  if (balance < MINIMUM_GHS) continue;
  const account = values[months.length + 1] ? JSON.parse(values[months.length + 1]) : null;
  rows.push({ id, balance, account });
}

console.log("account_id,name,email,network,momo_number,wallet_name,amount_ghs");
for (const { id, balance, account } of rows) {
  const p = account?.payout;
  console.log(
    [id, account?.name, account?.email, p?.network, p?.number, p?.accountName, balance.toFixed(2)]
      .map(csv)
      .join(",")
  );
}
const missing = rows.filter((r) => !r.account?.payout);
if (missing.length) console.error(`\n${missing.length} contributor(s) have no Mobile Money details and won't be marked paid.`);

if (markPaid) {
  const payable = rows.filter((r) => r.account?.payout);
  if (payable.length) {
    await redis(payable.map((r) => ["INCRBY", `gl:pool:paid:${r.id}`, Math.round(r.balance * 100)]));
  }
  console.error(`\nMarked ${payable.length} payout(s) as paid.`);
} else if (rows.length) {
  console.error("\nAfter sending the Mobile Money payments, run again with --mark-paid.");
} else {
  console.error("\nNobody has reached the payout minimum yet.");
}
