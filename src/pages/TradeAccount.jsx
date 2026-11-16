import React, { useEffect, useMemo, useState } from "react";
import { useT, api } from "./Home";

/* =====================================================================
   src/pages/TradeAccount.jsx — Funds / Options account (কয়েন অনুযায়ী) পেজ
   Props: P (prices), W (wallet), go (navigation), coin ("USDT"...), acc ("funds" | "options")
   URL: /trade-account?coin=USDT&acc=funds

   এই পেজে এক জায়গায় থাকে:
   - ব্যালেন্স (Available / Converted $)
   - Financial records : Transfer, Flash exchange (Convert), Spot trade, Options trade, Deposit, Withdrawal
   - Withdrawal records / Deposit records
   - নিচে Transfer / Deposit / Withdrawal বাটন

   ব্যবহৃত API (সবই আগে থেকেই আছে, নতুন backend লাগে না):
   GET /wallet/accounts · /wallet/transfers · /exchange/history · /spot/orders
   GET /deposit/history · /withdraw/history · /options/records
   ===================================================================== */

const STABLE = ["USDT", "USDC", "PYUSD", "USDD"];
const PAGE = 20;

const num = (v) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return typeof n === "number" && isFinite(n) ? n : 0;
};
const arr = (x) => (Array.isArray(x) ? x : []);

/* সার্ভারের সময় timezone ছাড়া এলে UTC ধরা হয় */
const parseTs = (v) => {
  if (!v) return 0;
  let s = String(v);
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) s = s.replace(" ", "T") + "Z";
  const n = Date.parse(s);
  return isFinite(n) ? n : 0;
};
const z = (x) => String(x).padStart(2, "0");
const fmtTime = (ms) => {
  if (!ms) return "--";
  const d = new Date(ms);
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
};
const fmtQ = (v) => {
  const a = Math.abs(num(v));
  return a === 0 || a >= 0.0001 ? a.toFixed(4) : a.toFixed(8);
};
const tsOf = (o) => parseTs(o && (o.created_at || o.time || o.closed_at || o.end_at));

const CSS = `
.ta{
  --bg:#f3f5fa;--bar:#ffffff;--card:#ffffff;--tx:#141b29;--mu:#8793a8;--ln:#e6eaf1;--ac:#1a82d6;--up:#0ecb81;--dn:#f6465d;--sh:0 8px 24px -16px rgba(20,40,80,.3);
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Noto Sans","Noto Sans Bengali","Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
  background:var(--bg);color:var(--tx);min-height:100vh;padding-bottom:96px;
}
.cx.dark .ta{--bg:#0d1626;--bar:#12203a;--card:#0b1424;--tx:#eaf0f8;--mu:#8795ac;--ln:#22304a;--sh:none}
.ta,.ta *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.ta button{font-family:inherit;color:inherit;background:none;border:0;cursor:pointer}
.ta .num{font-variant-numeric:tabular-nums}

.ta-top{display:grid;grid-template-columns:48px 1fr 48px;align-items:center;height:56px;padding:0 8px;background:var(--bar);border-bottom:1px solid var(--ln)}
.ta-top h1{margin:0;font-size:17px;font-weight:500;text-align:center}
.ta-top button{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;font-size:28px;line-height:1;text-align:center}
.ta-top button:active{background:var(--bg)}
.cx[dir=rtl] .ta-top button{transform:scaleX(-1)}

.ta-hd{padding:18px 18px 20px;background:var(--bar)}
.ta-hd h2{margin:0 0 16px;font-size:26px;font-weight:700;color:var(--ac);letter-spacing:.2px}
.ta-hd .r{display:grid;grid-template-columns:1fr auto;gap:6px 12px;align-items:end}
.ta-hd small{display:block;font-size:14px;color:var(--mu)}
.ta-hd b{display:block;margin-top:6px;font-size:20px;font-weight:500}
.ta-hd .r>div:last-child{text-align:end}
.ta-gap{height:12px;background:var(--bg)}

.ta-tabs{display:flex;background:var(--bar);padding:0 6px;border-bottom:1px solid var(--ln)}
.ta-tabs button{position:relative;flex:1;height:52px;font-size:14.5px;font-weight:500;color:var(--mu);white-space:nowrap;padding:0 6px;
  display:flex;align-items:center;justify-content:center;text-align:center;transition:color .2s ease}
.ta-tabs button.on{color:var(--tx);font-weight:600}
.ta-tabs button::after{content:"";position:absolute;left:50%;bottom:0;width:0;height:3px;border-radius:3px 3px 0 0;background:var(--ac);transition:width .22s ease,margin-left .22s ease}
.ta-tabs button.on::after{width:30px;margin-left:-15px}

.ta-list{display:flex;flex-direction:column;gap:12px;padding:16px 14px 8px}
.ta-c{background:var(--card);border:1px solid var(--ln);border-radius:16px;padding:14px 16px;box-shadow:var(--sh)}
.ta-c p{margin:0;display:grid;grid-template-columns:38% 1fr;gap:8px;align-items:baseline;line-height:2;font-size:15px}
.ta-c p span{color:var(--tx)}
.ta-c p b{font-weight:500;word-break:break-word}
.ta-c p b.up{color:var(--up)}
.ta-c p b.dn{color:var(--dn)}
.ta-c p b small{display:inline;margin-inline-start:6px;font-size:12px;color:var(--mu)}
.ta-end{text-align:center;color:var(--mu);font-size:15px;padding:18px 0 8px}
.ta-more{display:block;margin:10px auto 0;padding:10px 28px;border-radius:12px;border:1px solid var(--ln)!important;color:var(--ac);font-size:14px;font-weight:600}
.ta-nr{display:flex;flex-direction:column;align-items:center;gap:18px;padding:70px 20px 30px;color:var(--mu);font-size:17px}
.ta-nr svg{width:190px;height:auto;opacity:.9}

.ta-ft{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;z-index:30;display:grid;grid-template-columns:repeat(3,1fr);
  background:var(--bar);border-top:1px solid var(--ln);padding:10px 0 calc(8px + env(safe-area-inset-bottom))}
.ta-ft button{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:14px;color:var(--tx);text-align:center;transition:opacity .15s ease}
.ta-ft button:active{opacity:.6}
.ta-ft svg{width:30px;height:30px;color:#1fb6f0}

.ta-guest{margin:30px 16px;padding:30px 20px;background:var(--card);border:1px solid var(--ln);border-radius:16px;text-align:center}
.ta-guest p{margin:0 0 16px;font-size:14px;color:var(--mu)}
.ta-guest button{padding:11px 32px;border-radius:12px;background:var(--ac);color:#fff;font-size:14.5px;font-weight:600}
@media(min-width:768px){.ta-ft{max-width:900px}}
@media(prefers-reduced-motion:reduce){.ta *{transition:none!important}}
`;

/* ---- আইকন ---- */
const IcTransfer = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="26" height="20" rx="3" />
    <path d="M3 12h10M18 17h8M23 14l3 3-3 3M14 22H8M11 19l-3 3 3 3" />
  </svg>
);
const IcDeposit = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="26" height="20" rx="3" />
    <path d="M3 12h8M13 20h11M20 16l4 4-4 4" />
  </svg>
);
const IcWithdraw = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="26" height="20" rx="3" />
    <path d="M3 12h8M24 20H13M17 16l-4 4 4 4" />
  </svg>
);
const Empty = () => (
  <svg viewBox="0 0 150 120">
    <rect x="38" y="20" width="74" height="70" rx="4" fill="#9aa3b2" opacity=".35" />
    <rect x="46" y="28" width="58" height="44" fill="#e9ecf2" />
    <rect x="54" y="38" width="42" height="5" fill="#c9ced9" />
    <rect x="54" y="49" width="42" height="5" fill="#c9ced9" />
    <rect x="54" y="60" width="42" height="5" fill="#c9ced9" />
    <rect x="34" y="72" width="82" height="22" rx="3" fill="#dfe3ea" />
    <rect x="62" y="81" width="26" height="4" rx="2" fill="#fff" />
  </svg>
);

export default function TradeAccount({ P, W, go, coin = "USDT", acc = "funds" }) {
  const t = useT();
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };

  const C = String(coin || "USDT").toUpperCase();
  const A = acc === "options" ? "options" : "funds";
  const guest = !!(W && W.guest);

  const [tab, setTab] = useState("fin"); /* fin | wd | dep */
  const [shown, setShown] = useState(PAGE);
  const [accs, setAccs] = useState(null);
  const [data, setData] = useState({ tr: [], ex: [], sp: [], dp: [], wd: [], op: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const g = (p) => api(p).then(arr).catch(() => []);
    const [tr, ex, sp, dp, wd, op] = await Promise.all([
      g("/wallet/transfers"),
      g("/exchange/history"),
      g("/spot/orders"),
      g("/deposit/history"),
      g("/withdraw/history"),
      g("/options/records"),
    ]);
    setData({ tr, ex, sp, dp, wd, op });
    try {
      const r = await api("/wallet/accounts");
      setAccs({ options: (r && r.options) || {}, funds: (r && r.funds) || {} });
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    if (guest) { setLoading(false); return; }
    setLoading(true);
    load();
    // eslint-disable-next-line
  }, [guest, C, A]);

  useEffect(() => { setShown(PAGE); }, [tab, C, A]);

  /* ---- ব্যালেন্স ---- */
  const side = accs ? accs[A] : null;
  const avail = num(side && side[C] && side[C].available);
  const frozen = num(side && side[C] && side[C].frozen);
  const price = STABLE.includes(C) ? 1 : num(P && P[C] && P[C].price);
  const conv = (avail + frozen) * price;

  /* ---- রেকর্ড তৈরি ---- */
  const L = {
    trIn: tt("recTrIn", "Transfer-in"),
    trOut: tt("recTrOut", "Transfer-out"),
    exOut: tt("recExOut", "Flash exchange-expenditure"),
    exIn: tt("recExIn", "Flash exchange-income"),
    spBuy: tt("recSpBuy", "Spot buy"),
    spSell: tt("recSpSell", "Spot sell"),
    opWin: tt("recOpWin", "Options-profit"),
    opLoss: tt("recOpLoss", "Options-loss"),
    dep: tt("recDep", "Deposit"),
    wd: tt("recWd", "Withdrawal"),
  };

  const statusText = (s) => {
    const v = String(s || "").toLowerCase();
    if (/approved|done|success|complete|paid/.test(v)) return tt("done", "Completed");
    if (/reject|fail|cancel/.test(v)) return tt("rejected", "Rejected");
    return tt("proc", "Processing");
  };

  const depRows = useMemo(
    () =>
      data.dp
        .filter((x) => String(x.coin || "").toUpperCase() === C)
        .map((x) => {
          const ok = /approved|done|success|complete|paid/i.test(x.status || "");
          return {
            id: "d" + x.id,
            q: num(x.credit_amount != null ? x.credit_amount : x.amount),
            label: L.dep,
            st: statusText(x.status),
            ok,
            ts: tsOf(x),
          };
        })
        .sort((a, b) => b.ts - a.ts),
    // eslint-disable-next-line
    [data.dp, C]
  );

  const wdRows = useMemo(
    () =>
      data.wd
        .filter((x) => String(x.coin || "").toUpperCase() === C)
        .map((x) => ({
          id: "w" + x.id,
          q: -num(x.amount),
          label: L.wd,
          st: statusText(x.status),
          net: x.net,
          ts: tsOf(x),
        }))
        .sort((a, b) => b.ts - a.ts),
    // eslint-disable-next-line
    [data.wd, C]
  );

  const finRows = useMemo(() => {
    const out = [];

    /* Transfer (Options <-> Funds) */
    data.tr.forEach((x) => {
      if (String(x.coin || "").toUpperCase() !== C) return;
      const a = num(x.amount);
      if (x.to_account === A) out.push({ id: "ti" + x.id, q: a, label: L.trIn, ts: tsOf(x) });
      if (x.from_account === A) out.push({ id: "to" + x.id, q: -a, label: L.trOut, ts: tsOf(x) });
    });

    /* Flash exchange (Convert) */
    data.ex.forEach((x) => {
      if ((x.account || "options") !== A) return;
      if (String(x.from_coin || "").toUpperCase() === C) out.push({ id: "xo" + x.id, q: -num(x.from_amount), label: L.exOut, ts: tsOf(x) });
      if (String(x.to_coin || "").toUpperCase() === C) out.push({ id: "xi" + x.id, q: num(x.to_amount), label: L.exIn, ts: tsOf(x) });
    });

    /* Options account: spot, options trade, deposit, withdraw */
    if (A === "options") {
      data.sp.forEach((x) => {
        const sym = String(x.sym || "").toUpperCase();
        const buy = x.side === "buy";
        if (sym === C) out.push({ id: "sc" + x.id, q: buy ? num(x.qty) : -num(x.qty), label: buy ? L.spBuy : L.spSell, ts: tsOf(x) });
        if (C === "USDT") out.push({ id: "su" + x.id, q: buy ? -num(x.amount) : num(x.amount), label: buy ? L.spBuy : L.spSell, ts: tsOf(x) });
      });

      if (C === "USDT") {
        data.op.forEach((x) => {
          const p = num(x.pnl);
          if (!p) return;
          out.push({ id: "o" + x.id, q: p, label: p > 0 ? L.opWin : L.opLoss, ts: tsOf(x) });
        });
      }

      depRows.filter((r) => r.ok).forEach((r) => out.push({ id: r.id, q: r.q, label: r.label, ts: r.ts }));
      wdRows.forEach((r) => out.push({ id: r.id, q: r.q, label: r.label, ts: r.ts }));
    }

    return out.sort((a, b) => b.ts - a.ts);
    // eslint-disable-next-line
  }, [data, C, A, depRows, wdRows]);

  const rows = tab === "wd" ? wdRows : tab === "dep" ? depRows : finRows;
  const vis = rows.slice(0, shown);

  const tabs = [
    ["fin", tt("finRec", "Financial records")],
    ["wd", tt("wdRec", "Withdrawal records")],
    ["dep", tt("depRec", "Deposit records")],
  ];

  const title = A === "funds" ? tt("fundsAcct", "Funds account") : tt("optionsAcct", "Options account");

  return (
    <div className="ta">
      <style>{CSS}</style>

      <div className="ta-top">
        <button type="button" onClick={() => go("assets")} aria-label="back">‹</button>
        <h1>{title}</h1>
        <span />
      </div>

      {guest ? (
        <div className="ta-guest">
          <p>{tt("needLogin", "Please log in to view your assets")}</p>
          <button type="button" onClick={() => W.needLogin()}>{tt("login", "Login")}</button>
        </div>
      ) : (
        <>
          <div className="ta-hd">
            <h2>{C}</h2>
            <div className="r num">
              <div><small>{tt("avail", "Available")}</small><b>{avail.toFixed(8)}</b></div>
              <div><small>{tt("cv", "Converted($)")}</small><b>{conv.toFixed(2)}</b></div>
            </div>
          </div>
          <div className="ta-gap" />

          <div className="ta-tabs">
            {tabs.map(([k, l]) => (
              <button key={k} type="button" className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {!loading && rows.length === 0 ? (
            <div className="ta-nr">
              <Empty />
              <span>{tt("norec", "No records for now")}</span>
            </div>
          ) : (
            <div className="ta-list">
              {vis.map((r) => (
                <div key={r.id} className="ta-c">
                  <p className="num"><span>{tt("qty", "Quantity")}</span><b className={r.q >= 0 ? "up" : "dn"}>{r.q >= 0 ? "+" : "-"} {fmtQ(r.q)}</b></p>
                  <p><span>{tt("record", "Record")}</span><b>{r.label}{r.st ? <small>{r.st}</small> : null}</b></p>
                  {tab === "wd" && r.net ? <p><span>{tt("net", "Network")}</span><b>{r.net}</b></p> : null}
                  <p className="num"><span>{tt("time", "Time")}</span><b>{fmtTime(r.ts)}</b></p>
                </div>
              ))}
              {rows.length > shown ? (
                <button type="button" className="ta-more" onClick={() => setShown(shown + PAGE)}>{tt("more", "More")}</button>
              ) : (
                rows.length > 0 && <div className="ta-end">{tt("allRec", "All records")}</div>
              )}
            </div>
          )}
        </>
      )}

      <div className="ta-ft">
        <button type="button" onClick={() => go("changemoney")}><IcTransfer />{tt("transfer", "Transfer")}</button>
        <button type="button" onClick={() => go("deposit")}><IcDeposit />{tt("deposit", "Deposit")}</button>
        <button type="button" onClick={() => go("withdraw")}><IcWithdraw />{tt("withdrawal", "Withdrawal")}</button>
      </div>
    </div>
  );
}
