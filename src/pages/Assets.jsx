import React, { useEffect, useRef, useState } from "react";
import { useT, api, Coin, Ic, ICON, COINS } from "./Home";

const ACCOUNTS_PATH = "/wallet/accounts";
const STABLE = ["USDT", "USDC", "PYUSD", "USDD"];

/* backend transfer/exchange/deposit যে কয়েন সাপোর্ট করে + স্পট ট্রেডের কয়েন */
const BASE_COINS = ["USDT", "USDC", "PYUSD", "ETH", "BTC", "DOGE", "XRP", "SOL"];
const KNOWN_COINS = [...BASE_COINS, ...COINS.filter((c) => !BASE_COINS.includes(c))];

/* সোয়াইপ সেটিংস */
const SWIPE_MIN = 50;   /* কমপক্ষে কত px টানলে পেজ বদলাবে */
const SWIPE_RATIO = 1.5; /* আড়াআড়ি টান উল্লম্বের চেয়ে কতগুণ বেশি হতে হবে */

const num = (v) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return typeof n === "number" && isFinite(n) ? n : 0;
};

const CSS = `
.as{
  --bg:#f3f5fa;--bar:#ffffff;--card:#ffffff;--tx:#141b29;--mu:#8793a8;--ln:#e6eaf1;--ac:#1a82d6;--sh:0 8px 24px -16px rgba(20,40,80,.3);
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Noto Sans","Noto Sans Bengali","Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;
  background:var(--bg);color:var(--tx);min-height:100vh;overflow-x:hidden;
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

/* swipe এলাকা: উল্লম্ব স্ক্রল চলবে, আড়াআড়ি টান আমরা ধরব */
.as-body{min-height:calc(100vh - 53px);touch-action:pan-y;overflow-x:hidden}
.as-body.fw{animation:asFw .26s cubic-bezier(.22,.8,.3,1)}
.as-body.bw{animation:asBw .26s cubic-bezier(.22,.8,.3,1)}
.cx[dir=rtl] .as-body.fw{animation-name:asBw}
.cx[dir=rtl] .as-body.bw{animation-name:asFw}
@keyframes asFw{from{opacity:0;transform:translateX(44px)}to{opacity:1;transform:none}}
@keyframes asBw{from{opacity:0;transform:translateX(-44px)}to{opacity:1;transform:none}}

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
.as-c{background:var(--card);border:1px solid var(--ln);border-radius:16px;padding:16px 16px 14px;box-shadow:var(--sh);cursor:pointer;transition:transform .12s ease}
.as-c:active{transform:scale(.985)}
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
@media(prefers-reduced-motion:reduce){.as *{transition:none!important}.as-body{animation:none!important}}
`;

export default function Assets({ P, W, go }) {
  const t = useT();
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };

  const [tab, setTab] = useState("assets"); /* assets | funds | options | quant */
  const [slide, setSlide] = useState("");   /* "" | fw | bw  — অ্যানিমেশনের দিক */
  const [hide, setHide] = useState(false);
  const [hideZero, setHideZero] = useState(false);
  const [accs, setAccs] = useState(null); /* null = এখনো লোড হয়নি */
  const guest = !!(W && W.guest);

  const tabsRef = useRef(null);
  const touch = useRef(null);

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
  const order = tabs.map(([k]) => k);

  /* ট্যাব বদল — দিক ঠিক করে অ্যানিমেশনসহ */
  const goTab = (k) => {
    if (k === tab) return;
    setSlide(order.indexOf(k) > order.indexOf(tab) ? "fw" : "bw");
    setTab(k);
  };

  /* সক্রিয় ট্যাব বারের মাঝখানে নিয়ে আসা */
  useEffect(() => {
    const c = tabsRef.current;
    const el = c && c.querySelector("button.on");
    if (!c || !el) return;
    try {
      c.scrollTo({ left: el.offsetLeft - (c.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
    } catch (_) {}
  }, [tab]);

  /* ---- swipe হ্যান্ডলার ---- */
  const onTouchStart = (e) => {
    if (e.touches.length !== 1) { touch.current = null; return; }
    const p = e.touches[0];
    touch.current = { x: p.clientX, y: p.clientY };
  };
  const onTouchEnd = (e) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - s.x;
    const dy = p.clientY - s.y;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;
    const rtl = !!(e.currentTarget.closest && e.currentTarget.closest("[dir=rtl]"));
    /* LTR: বামে টানলে পরের পেজ | RTL: ডানে টানলে পরের পেজ */
    const next = rtl ? dx > 0 : dx < 0;
    const i = order.indexOf(tab);
    const j = next ? i + 1 : i - 1;
    if (j >= 0 && j < order.length) goTab(order[j]);
  };

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

      <div className="as-tabs" ref={tabsRef}>
        {tabs.map(([k, l]) => (
          <button key={k} type="button" className={tab === k ? "on" : ""} onClick={() => goTab(k)}>{l}</button>
        ))}
      </div>

      {/* key বদলালে অ্যানিমেশন আবার চলে */}
      <div
        key={tab}
        className={"as-body" + (slide ? " " + slide : "")}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => { touch.current = null; }}
      >
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
                  <div
                    key={c}
                    className="as-c"
                    role="button"
                    tabIndex={0}
                    onClick={() => go && go("tradeaccount", c, sub)}
                    onKeyDown={(e) => { if (e.key === "Enter" && go) go("tradeaccount", c, sub); }}
                  >
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
    </div>
  );
}
