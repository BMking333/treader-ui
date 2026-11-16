import React, { useEffect, useState } from "react";
import { useT, api, Coin, Ic, ICON, COINS } from "./Home";

/* =====================================================================
   src/pages/Assets.jsx — Assets (wallet) page
   Props: P (prices), W (wallet), go (page navigation — এখানে ব্যবহার হয় না)
   W = { w: {COIN: available}, fz: {COIN: frozen}, total, reload, guest, needLogin }
   Accounts: GET /wallet/accounts -> { options: {COIN:{available,frozen}}, funds: {COIN:{available,frozen}} }

   আপডেট: এখন সব কয়েন দেখায় (আগে শুধু USDT/USDC/ETH/BTC ছিল)।
   - কয়েন তালিকা = স্টেবল + ট্রান্সফার/এক্সচেঞ্জ কয়েন (SOL, PYUSD, DOGE, XRP...) + স্পটে কেনা সব কয়েন (COINS)
   - backend /wallet/accounts-এ যে অতিরিক্ত কয়েন আসবে সেটাও অটো যোগ হবে
   - মোট ব্যালেন্স এখন সব কয়েনের হিসাবে (আগে শুধু ৪টি কয়েন ধরা হতো)
   - "Hide zero" টগল যোগ হয়েছে
   ===================================================================== */

const ACCOUNTS_PATH = "/wallet/accounts";
const STABLE = ["USDT", "USDC", "PYUSD", "USDD"];

/* backend transfer/exchange/deposit যে কয়েন সাপোর্ট করে + স্পট ট্রেডের কয়েন */
const BASE_COINS = ["USDT", "USDC", "PYUSD", "ETH", "BTC", "DOGE", "XRP", "SOL"];
const KNOWN_COINS = [...BASE_COINS, ...COINS.filter((c) => !BASE_COINS.includes(c))];

const num = (v) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return typeof n === "number" && isFinite(n) ? n : 0;
};

const CSS = `
.as{
  --bg:#f3f5fa;--bar:#ffffff;--card:#ffffff;--tx:#141b29;--mu:#8793a8;--ln:#e6eaf1;--ac:#1a82d6;--sh:0 8px 24px -16px rgba(20,40,80,.3);
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Noto Sans","Noto Sans Bengali","Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;
  background:var(--bg);color:var(--tx);min-height:100vh;
}
.cx.dark .as{--bg:#0d1626;--bar:#12203a;--card:#14233b;--tx:#eaf0f8;--mu:#8795ac;--ln:#1f3050;--sh:none}
.as,.as *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.as button{font-family:inherit;color:inherit;background:none;border:0;cursor:pointer}
.as .num{font-variant-numeric:tabular-nums}

/* tabs */
.as-tabs{display:flex;overflow-x:auto;scrollbar-width:none;background:var(--bar);border-bottom:1px solid var(--ln);padding:0 4px}
.as-tabs::-webkit-scrollbar{display:none}
.as-tabs button{position:relative;flex:1 0 auto;display:flex;align-items:center;justify-content:center;text-align:center;
  height:52px;padding:0 18px;font-size:14.5px;font-weight:500;white-space:nowrap;color:var(--mu);transition:color .2s ease}
.as-tabs button.on{color:var(--tx);font-weight:600}
.as-tabs button::after{content:"";position:absolute;left:50%;bottom:0;width:0;height:3px;margin-left:0;border-radius:3px 3px 0 0;background:var(--ac);
  transition:width .22s ease,margin-left .22s ease}
.as-tabs button.on::after{width:26px;margin-left:-13px}

/* summary cards (Assets tab) */
.as-cards{display:flex;flex-direction:column;gap:12px;padding:16px 14px 24px}
.as-card{background:var(--card);border:1px solid var(--ln);border-radius:16px;padding:18px 18px 16px;box-shadow:var(--sh)}
.as-card h3{margin:0 0 14px;font-size:15px;font-weight:600;color:var(--ac);letter-spacing:.1px}
.as-card small{display:block;font-size:12.5px;color:var(--mu)}
.as-card b{display:block;margin-top:6px;font-size:19px;font-weight:600;letter-spacing:-.1px}

/* sub header */
.as-sum{display:grid;grid-template-columns:1fr auto;align-items:start;gap:2px 10px;padding:20px 18px 24px;background:var(--bar);border-bottom:1px solid var(--ln)}
.as-sum h2{margin:0;font-size:16px;font-weight:600;letter-spacing:-.1px}
.as-sum .lb{grid-column:1;margin-top:4px;font-size:12.5px;color:var(--mu)}
.as-sum .eye{grid-column:2;grid-row:1/3;width:40px;height:40px;display:grid;place-items:center;border-radius:12px;color:var(--tx);opacity:.85}
.as-sum .eye:active{background:var(--bg)}
.as-sum .eye.off{opacity:.45}
.as-sum .big{grid-column:1/-1;margin-top:14px;font-size:22px;font-weight:700;letter-spacing:-.2px}
.as-sum .sub{grid-column:1/-1;margin-top:2px;font-size:13px;color:var(--mu)}

/* hide-zero bar */
.as-bar{display:flex;align-items:center;justify-content:space-between;padding:12px 18px 0;font-size:13px;color:var(--mu)}
.as-bar label{display:flex;align-items:center;gap:8px;cursor:pointer}
.as-bar input{width:16px;height:16px;accent-color:var(--ac)}

/* coin cards */
.as-list{display:flex;flex-direction:column;gap:12px;padding:12px 14px 24px}
.as-c{background:var(--card);border:1px solid var(--ln);border-radius:16px;padding:16px 16px 14px;box-shadow:var(--sh)}
.as-h{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.as-h b{font-size:15.5px;font-weight:700;color:var(--ac);letter-spacing:.2px}
.as-h i{margin-inline-start:auto;font-style:normal;font-size:20px;line-height:1;color:var(--mu)}
.cx[dir=rtl] .as-h i{transform:scaleX(-1)}
.as-g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.as-g span{min-width:0;font-size:13.5px;font-weight:500;word-break:break-all}
.as-g span small{display:block;margin-bottom:5px;font-size:12px;font-weight:400;color:var(--mu)}
.as-g span:nth-child(2){text-align:center}
.as-g span:last-child{text-align:end}
.as-none{text-align:center;color:var(--mu);padding:40px 0;font-size:14px}

.as-guest{margin:30px 16px;padding:30px 20px;background:var(--card);border:1px solid var(--ln);border-radius:16px;text-align:center;box-shadow:var(--sh)}
.as-guest p{margin:0 0 16px;font-size:14px;color:var(--mu)}
.as-guest button{padding:11px 32px;border-radius:12px;background:var(--ac);color:#fff;font-size:14.5px;font-weight:600}
@media(max-width:360px){.as-g span{font-size:12.5px}.as-tabs button{padding:0 14px;font-size:13.5px}}
@media(prefers-reduced-motion:reduce){.as *{transition:none!important}}
`;

export default function Assets({ P, W }) {
  const t = useT();
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };

  const [tab, setTab] = useState("assets"); /* assets | funds | options | quant */
  const [hide, setHide] = useState(false);
  const [hideZero, setHideZero] = useState(false);
  const [accs, setAccs] = useState(null); /* null = এখনো লোড হয়নি */
  const guest = !!(W && W.guest);

  const loadAccs = async () => {
    try {
      const r = await api(ACCOUNTS_PATH);
      setAccs({ options: (r && r.options) || {}, funds: (r && r.funds) || {} });
    } catch (_) {}
  };

  /* প্রথমবার এবং W.w বদলালে (ট্রেড/ট্রান্সফারের পর) আবার আনা */
  useEffect(() => {
    if (!guest) loadAccs();
    // eslint-disable-next-line
  }, [guest, W && W.w]);

  const priceOf = (c) => (STABLE.includes(c) ? 1 : num(P && P[c] && P[c].price));

  /* সব কয়েন: নির্ধারিত তালিকা + backend/ওয়ালেট থেকে আসা বাড়তি কয়েন */
  const allCoins = (() => {
    const set = [...KNOWN_COINS];
    const add = (o) => Object.keys(o || {}).forEach((c) => { if (!set.includes(c)) set.push(c); });
    add(accs && accs.options);
    add(accs && accs.funds);
    add(W && W.w);
    return set;
  })();

  /* অ্যাকাউন্ট অনুযায়ী Available / Frozen। Options: accs না এলে W থেকে। Quant: এখনো নেই */
  const availOf = (acc, c) => {
    if (acc === "options") return num(accs ? accs.options[c] && accs.options[c].available : W && W.w && W.w[c]);
    if (acc === "funds") return num(accs && accs.funds[c] && accs.funds[c].available);
    return 0;
  };
  const frozenOf = (acc, c) => {
    if (acc === "options") return num(accs ? accs.options[c] && accs.options[c].frozen : W && W.fz && W.fz[c]);
    if (acc === "funds") return num(accs && accs.funds[c] && accs.funds[c].frozen);
    return 0;
  };
  const totalOf = (acc) => allCoins.reduce((s, c) => s + (availOf(acc, c) + frozenOf(acc, c)) * priceOf(c), 0);

  const totOptions = totalOf("options");
  const totFunds = totalOf("funds");
  const totQuant = 0;
  const totAll = totOptions + totFunds + totQuant;

  const tabs = [
    ["assets", tt("assets", "Assets")],
    ["funds", tt("funds", "Funds")],
    ["options", tt("options", "Options")],
    ["quant", tt("quant", "Quant trading")],
  ];
  const conv = tt("conv", "converted");
  const titleOf = (k) => (k === "ta" ? tt("ta", "Total assets") : k === "funds" ? tt("funds", "Funds") : k === "options" ? tt("options", "Options") : tt("quant", "Quant trading"));

  const mask = (s) => (hide ? "••••••" : s);
  const sub = tab === "assets" ? null : tab;
  const subTotal = sub === "funds" ? totFunds : sub === "options" ? totOptions : totQuant;

  const summary = [["ta", totAll], ["funds", totFunds], ["options", totOptions], ["quant", totQuant]];

  const rows = sub
    ? allCoins.filter((c) => !hideZero || availOf(sub, c) + frozenOf(sub, c) > 0)
    : [];

  return (
    <div className="as">
      <style>{CSS}</style>

      <div className="as-tabs">
        {tabs.map(([k, l]) => (
          <button key={k} type="button" className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {guest ? (
        <div className="as-guest">
          <p>{tt("needLogin", "Please log in to view your assets")}</p>
          <button type="button" onClick={() => W.needLogin()}>{tt("login", "Login")}</button>
        </div>
      ) : !sub ? (
        <div className="as-cards">
          {summary.map(([k, v]) => (
            <div key={k} className="as-card">
              <h3>{titleOf(k)} {conv}</h3>
              <small>{tt("avail", "Available")}</small>
              <b className="num">{v.toFixed(2)}</b>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="as-sum">
            <h2>{titleOf(sub)} {conv}</h2>
            <span className="lb">{tt("ta", "Total assets")} {conv}($)</span>
            <button type="button" className={"eye" + (hide ? " off" : "")} onClick={() => setHide(!hide)} aria-label="toggle">
              <Ic d={ICON.eye} s={24} />
            </button>
            <div className="big num">$ {mask(subTotal.toFixed(8))}</div>
            <div className="sub num">≈ $ {mask(subTotal.toFixed(2))}</div>
          </div>

          <div className="as-bar">
            <span>{tt("coins", "Coins")} ({rows.length})</span>
            <label>
              <input type="checkbox" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} />
              {tt("hideZero", "Hide zero balances")}
            </label>
          </div>

          <div className="as-list">
            {rows.length === 0 && <div className="as-none">{tt("norec", "No records")}</div>}
            {rows.map((c) => {
              const a = availOf(sub, c);
              const f = frozenOf(sub, c);
              const usd = (a + f) * priceOf(c);
              return (
                <div key={c} className="as-c">
                  <div className="as-h">
                    <Coin s={c} size={28} />
                    <b>{c}</b>
                    <i>›</i>
                  </div>
                  <div className="as-g num">
                    <span><small>{tt("avail", "Available")}</small>{mask(a.toFixed(8))}</span>
                    <span><small>{tt("frozen", "Frozen")}</small>{mask(f.toFixed(8))}</span>
                    <span><small>{tt("cv", "Converted($)")}</small>{mask("$ " + usd.toFixed(2))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
