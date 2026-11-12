import React, { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Home.jsx — Crypto trading platform home page (mobile-first, dark)   */
/*  No extra dependencies. Styles are injected from this file.          */
/*  Live prices: Binance public REST (auto fallback to demo data).      */
/* ------------------------------------------------------------------ */

const PAIRS = [
  { s: "BTC", n: "Bitcoin", c: "#f7931a" },
  { s: "ETH", n: "Ethereum", c: "#627eea" },
  { s: "XRP", n: "Ripple", c: "#23292f" },
  { s: "ADA", n: "Cardano", c: "#0033ad" },
  { s: "DOGE", n: "Dogecoin", c: "#c2a633" },
  { s: "BCH", n: "Bitcoin Cash", c: "#8dc351" },
  { s: "LTC", n: "Litecoin", c: "#345d9d" },
  { s: "TRX", n: "Tron", c: "#eb0029" },
  { s: "ETC", n: "Ethereum Classic", c: "#328332" },
  { s: "SHIB", n: "Shiba Inu", c: "#e42d04" },
  { s: "ICP", n: "Internet Computer", c: "#7b3fe4" },
];

const FALLBACK = {
  BTC: [73977.69, -1.25, 248927176],
  ETH: [2066.48, -2.6, 98200000],
  XRP: [1.05957, -3.65, 21225893],
  ADA: [0.174844, -2.69, 16863316],
  DOGE: [0.068038, -2.97, 14500000],
  BCH: [231.26, -3.28, 3100000],
  LTC: [50.83, -1.55, 5200000],
  TRX: [0.317359, -0.5, 22757328],
  ETC: [6.6867, -2.38, 79059],
  SHIB: [0.00000443, -0.67, 9161333900],
  ICP: [2.54, 5.39, 3857],
};

const BANNERS = [
  {
    t: "Blockchain Universal Traceability",
    d: "Trade 100+ pairs with deep liquidity and instant execution.",
    g: "linear-gradient(120deg,#0b1220 0%,#0f2a43 55%,#10695c 100%)",
  },
  {
    t: "Flash Swap — Zero Fees",
    d: "Convert between assets in one tap at the best available rate.",
    g: "linear-gradient(120deg,#1a1033 0%,#33206b 55%,#6a3df0 100%)",
  },
  {
    t: "Boost Loan",
    d: "Unlock extra buying power against your crypto holdings.",
    g: "linear-gradient(120deg,#2b1405 0%,#6b3a0b 55%,#f7931a 100%)",
  },
];

const ACTIONS = [
  { k: "recharge", l: "Recharge", p: "M12 5v14M5 12h14" },
  { k: "withdraw", l: "Withdraw", p: "M12 19V5M6 11l6-6 6 6" },
  { k: "swap", l: "Flash Swap", p: "M7 7h11l-3-3M17 17H6l3 3" },
  { k: "transfer", l: "Transfer", p: "M4 8h16M16 4l4 4-4 4M20 16H4M8 12l-4 4 4 4" },
  { k: "loan", l: "Boost Loan", p: "M12 3v12M7 11l5 5 5-5M5 21h14" },
  { k: "support", l: "Support", p: "M4 5h16v11H9l-5 4z" },
];

const TABS = ["Hot", "Gainers", "Losers", "Volume"];

const fmtPrice = (p) => {
  if (p >= 1000) return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(4);
  if (p >= 0.01) return p.toFixed(6);
  return p.toFixed(8);
};
const fmtVol = (v) =>
  v >= 1e9 ? (v / 1e9).toFixed(2) + "B" : v >= 1e6 ? (v / 1e6).toFixed(2) + "M" : v >= 1e3 ? (v / 1e3).toFixed(1) + "K" : v.toFixed(0);

/* deterministic pseudo-sparkline so rows look alive without extra API calls */
function spark(seed, up, n = 24) {
  let x = seed * 9301 + 49297;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  const pts = [];
  let v = 50;
  for (let i = 0; i < n; i++) {
    v += (rnd() - 0.5) * 14 + (up ? 1.1 : -1.1);
    pts.push(v);
  }
  const min = Math.min(...pts), max = Math.max(...pts);
  return pts.map((y, i) => `${(i / (n - 1)) * 100},${28 - ((y - min) / (max - min || 1)) * 26 - 1}`).join(" ");
}

function CoinIcon({ s, c }) {
  return (
    <span className="hm-coin" style={{ background: c }}>
      {s.slice(0, 1)}
    </span>
  );
}

function Icon({ d, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function Home({ onNavigate = () => {} }) {
  const [data, setData] = useState(() =>
    Object.fromEntries(Object.entries(FALLBACK).map(([k, v]) => [k, { price: v[0], chg: v[1], vol: v[2] }]))
  );
  const [live, setLive] = useState(false);
  const [tab, setTab] = useState("Hot");
  const [slide, setSlide] = useState(0);
  const [hide, setHide] = useState(false);

  /* live prices */
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const syms = JSON.stringify(PAIRS.map((p) => p.s + "USDT"));
        const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(syms)}`);
        if (!r.ok) throw new Error("bad");
        const j = await r.json();
        if (stop) return;
        const next = {};
        j.forEach((t) => {
          next[t.symbol.replace("USDT", "")] = {
            price: parseFloat(t.lastPrice),
            chg: parseFloat(t.priceChangePercent),
            vol: parseFloat(t.quoteVolume),
          };
        });
        setData((d) => ({ ...d, ...next }));
        setLive(true);
      } catch {
        setLive(false);
      }
    };
    load();
    const id = setInterval(load, 8000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  /* banner autoplay */
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % BANNERS.length), 4500);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo(() => {
    const list = PAIRS.map((p) => ({ ...p, ...data[p.s] }));
    if (tab === "Gainers") return [...list].sort((a, b) => b.chg - a.chg);
    if (tab === "Losers") return [...list].sort((a, b) => a.chg - b.chg);
    if (tab === "Volume") return [...list].sort((a, b) => b.vol - a.vol);
    return list;
  }, [data, tab]);

  const top3 = ["ETH", "DOGE", "BCH"].map((s) => ({ s, ...data[s] }));
  const btc = data.BTC;

  return (
    <div className="hm">
      <style>{CSS}</style>

      {/* Header */}
      <header className="hm-head">
        <div className="hm-logo">
          <span className="hm-logo-mark">T</span>
          <span>
            Trade<b>BD</b>
          </span>
        </div>
        <div className="hm-head-r">
          <span className={`hm-live ${live ? "on" : ""}`}>
            <i /> {live ? "Live" : "Demo"}
          </span>
          <button className="hm-iconbtn" aria-label="Search" onClick={() => onNavigate("market")}>
            <Icon d="M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3" />
          </button>
          <button className="hm-iconbtn" aria-label="Notifications">
            <Icon d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0" />
          </button>
        </div>
      </header>

      <main className="hm-main">
        {/* Balance card */}
        <section className="hm-balance">
          <div className="hm-bal-top">
            <span>Total Assets (USDT)</span>
            <button onClick={() => setHide(!hide)} className="hm-eye" aria-label="Toggle balance">
              <Icon d={hide ? "M3 3l18 18M10 6a9 9 0 0111 6 9 9 0 01-2 3M6 7a9 9 0 00-3 5s3 6 9 6a8 8 0 003-1" : "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z"} size={18} />
            </button>
          </div>
          <div className="hm-bal-amt">{hide ? "••••••" : "0.00"}</div>
          <div className="hm-bal-btns">
            <button className="hm-btn primary" onClick={() => onNavigate("recharge")}>Deposit</button>
            <button className="hm-btn ghost" onClick={() => onNavigate("trade")}>Trade</button>
          </div>
        </section>

        {/* Banner */}
        <section className="hm-banner">
          <div className="hm-slides" style={{ transform: `translateX(-${slide * 100}%)` }}>
            {BANNERS.map((b, i) => (
              <div key={i} className="hm-slide" style={{ background: b.g }}>
                <h2>{b.t}</h2>
                <p>{b.d}</p>
                <button className="hm-btn light" onClick={() => onNavigate("trade")}>Start Trading</button>
                <div className="hm-orb" />
              </div>
            ))}
          </div>
          <div className="hm-dots">
            {BANNERS.map((_, i) => (
              <button key={i} className={i === slide ? "on" : ""} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </section>

        {/* Top tickers */}
        <section className="hm-tickers">
          {[{ s: "BTC", ...btc }, ...top3].map((t) => (
            <button key={t.s} className="hm-ticker" onClick={() => onNavigate("trade", t.s)}>
              <span className="hm-tk-pair">{t.s}/USDT</span>
              <span className={`hm-tk-price ${t.chg >= 0 ? "up" : "dn"}`}>{fmtPrice(t.price)}</span>
              <span className={`hm-chip ${t.chg >= 0 ? "up" : "dn"}`}>
                {t.chg >= 0 ? "+" : ""}
                {t.chg.toFixed(2)}%
              </span>
            </button>
          ))}
        </section>

        {/* Quick actions */}
        <section className="hm-actions">
          {ACTIONS.map((a) => (
            <button key={a.k} className="hm-action" onClick={() => onNavigate(a.k)}>
              <span className="hm-action-ic">
                <Icon d={a.p} size={22} />
              </span>
              <span>{a.l}</span>
            </button>
          ))}
        </section>

        {/* Market list */}
        <section className="hm-market">
          <div className="hm-tabs">
            {TABS.map((t) => (
              <button key={t} className={t === tab ? "on" : ""} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
            <button className="hm-more" onClick={() => onNavigate("market")}>
              More ›
            </button>
          </div>

          <div className="hm-thead">
            <span>Name</span>
            <span>Last price</span>
            <span>24h chg</span>
          </div>

          {rows.map((r, i) => {
            const up = r.chg >= 0;
            return (
              <button key={r.s} className="hm-row" onClick={() => onNavigate("trade", r.s)}>
                <div className="hm-name">
                  <CoinIcon s={r.s} c={r.c} />
                  <div>
                    <div className="hm-sym">
                      {r.s}
                      <small>/USDT</small>
                    </div>
                    <div className="hm-vol">Vol {fmtVol(r.vol)}</div>
                  </div>
                </div>
                <div className="hm-mid">
                  <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="hm-spark">
                    <polyline points={spark(i + 3, up)} fill="none" stroke={up ? "#0ecb81" : "#f6465d"} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <div className="hm-price">{fmtPrice(r.price)}</div>
                </div>
                <span className={`hm-badge ${up ? "up" : "dn"}`}>
                  {up ? "+" : ""}
                  {r.chg.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </section>

        {/* Trust strip */}
        <section className="hm-trust">
          <div><b>24/7</b><span>Support</span></div>
          <div><b>100+</b><span>Trading pairs</span></div>
          <div><b>Secure</b><span>Cold storage</span></div>
        </section>
      </main>

      {/* Bottom navigation */}
      <nav className="hm-nav">
        {[
          ["home", "Home", "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"],
          ["market", "Market", "M4 20V10M10 20V4M16 20v-8M22 20H2"],
          ["trade", "Trade", "M21 12a9 9 0 11-3-6.7M21 4v5h-5"],
          ["options", "Options", "M6 3h9l4 4v14H6zM9 12h7M9 16h7"],
          ["assets", "Assets", "M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 7l2-3h12M16 14h2"],
        ].map(([k, l, d]) => (
          <button key={k} className={k === "home" ? "on" : ""} onClick={() => onNavigate(k)}>
            <Icon d={d} size={22} />
            <span>{l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ------------------------------ styles ------------------------------ */
const CSS = `
.hm{--bg:#0b0e14;--card:#131824;--card2:#1a2132;--line:#232b3d;--tx:#eaecef;--mut:#7c8798;--up:#0ecb81;--dn:#f6465d;--ac:#2dd4a7;
  min-height:100vh;background:var(--bg);color:var(--tx);font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  display:flex;flex-direction:column;align-items:center}
.hm *{box-sizing:border-box}
.hm button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:inherit}
.hm-head,.hm-main{width:100%;max-width:520px}
.hm-head{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;align-items:center;padding:14px 16px;
  background:rgba(11,14,20,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.hm-logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:19px;letter-spacing:.2px}
.hm-logo b{color:var(--ac)}
.hm-logo-mark{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-weight:800;color:#06241c;
  background:linear-gradient(135deg,#2dd4a7,#0ea5e9)}
.hm-head-r{display:flex;align-items:center;gap:6px}
.hm-iconbtn{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;color:var(--tx)!important}
.hm-iconbtn:hover{background:var(--card)}
.hm-live{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--mut);padding:4px 9px;border:1px solid var(--line);border-radius:99px;margin-right:4px}
.hm-live i{width:7px;height:7px;border-radius:50%;background:#e0a100}
.hm-live.on i{background:var(--up);box-shadow:0 0 0 0 rgba(14,203,129,.6);animation:hmp 1.8s infinite}
@keyframes hmp{70%{box-shadow:0 0 0 7px rgba(14,203,129,0)}100%{box-shadow:0 0 0 0 rgba(14,203,129,0)}}

.hm-main{padding:16px 16px 96px;display:flex;flex-direction:column;gap:18px}

.hm-balance{padding:18px;border-radius:18px;background:linear-gradient(160deg,#162036,#101726);border:1px solid var(--line)}
.hm-bal-top{display:flex;justify-content:space-between;align-items:center;color:var(--mut);font-size:13px}
.hm-eye{color:var(--mut)!important;display:grid;place-items:center}
.hm-bal-amt{font-size:34px;font-weight:700;margin:6px 0 14px;letter-spacing:.5px}
.hm-bal-btns{display:flex;gap:10px}
.hm-btn{flex:1;padding:11px 16px;border-radius:11px;font-weight:600;font-size:14px;text-align:center!important;transition:.15s}
.hm-btn.primary{background:var(--ac);color:#04221a!important}
.hm-btn.primary:hover{filter:brightness(1.08)}
.hm-btn.ghost{border:1px solid var(--line);background:var(--card2)}
.hm-btn.ghost:hover{border-color:var(--ac)}
.hm-btn.light{flex:none;background:rgba(255,255,255,.95);color:#0b1220!important;padding:9px 18px;margin-top:14px}

.hm-banner{position:relative;border-radius:18px;overflow:hidden}
.hm-slides{display:flex;transition:transform .6s cubic-bezier(.65,0,.35,1)}
.hm-slide{position:relative;min-width:100%;padding:24px 20px 28px;min-height:170px;overflow:hidden}
.hm-slide h2{margin:0 0 6px;font-size:22px;line-height:1.2;max-width:70%}
.hm-slide p{margin:0;color:rgba(255,255,255,.75);font-size:13px;max-width:62%;line-height:1.45}
.hm-orb{position:absolute;right:-40px;top:-30px;width:190px;height:190px;border-radius:50%;
  background:radial-gradient(circle at 35% 35%,rgba(255,255,255,.35),rgba(255,255,255,.02) 65%);filter:blur(2px)}
.hm-dots{position:absolute;bottom:10px;left:20px;display:flex;gap:6px}
.hm-dots button{width:6px;height:6px;border-radius:99px;background:rgba(255,255,255,.35);padding:0;transition:.25s}
.hm-dots button.on{width:18px;background:#fff}

.hm-tickers{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:0 16px}
.hm-tickers::-webkit-scrollbar{display:none}
.hm-ticker{flex:0 0 auto;min-width:128px;padding:12px 14px;border-radius:14px;background:var(--card);border:1px solid var(--line);
  display:flex;flex-direction:column;gap:4px;transition:.15s}
.hm-ticker:hover{border-color:#34405a;transform:translateY(-1px)}
.hm-tk-pair{font-size:12px;color:var(--mut)}
.hm-tk-price{font-size:17px;font-weight:700}
.up{color:var(--up)} .dn{color:var(--dn)}
.hm-chip{font-size:12px;font-weight:600}

.hm-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.hm-action{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 6px;border-radius:14px;background:var(--card);
  border:1px solid var(--line);font-size:12.5px;font-weight:500;text-align:center!important;transition:.15s}
.hm-action:hover{background:var(--card2);border-color:#34405a}
.hm-action-ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;color:var(--ac);
  background:rgba(45,212,167,.1)}

.hm-market{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:6px 0 4px;overflow:hidden}
.hm-tabs{display:flex;align-items:center;gap:4px;padding:10px 12px 6px}
.hm-tabs button{padding:7px 13px;border-radius:99px;font-size:13.5px;color:var(--mut);font-weight:600}
.hm-tabs button.on{background:var(--card2);color:var(--tx)}
.hm-tabs .hm-more{margin-left:auto;color:var(--ac)}
.hm-thead,.hm-row{display:grid;grid-template-columns:1.25fr 1.3fr .85fr;align-items:center;gap:8px;padding:0 16px}
.hm-thead{font-size:12px;color:var(--mut);padding-top:8px;padding-bottom:6px}
.hm-thead span:last-child{text-align:right}
.hm-row{width:100%;padding-top:12px;padding-bottom:12px;border-top:1px solid rgba(35,43,61,.6);transition:.12s}
.hm-row:hover{background:var(--card2)}
.hm-name{display:flex;align-items:center;gap:10px;min-width:0}
.hm-coin{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:14px;color:#fff;flex:none}
.hm-sym{font-weight:700;font-size:15px}
.hm-sym small{color:var(--mut);font-weight:500;font-size:12px}
.hm-vol{font-size:11px;color:var(--mut);margin-top:2px}
.hm-mid{display:flex;flex-direction:column;gap:3px}
.hm-spark{width:70px;height:20px;opacity:.9}
.hm-price{font-weight:600;font-size:14.5px;font-variant-numeric:tabular-nums}
.hm-badge{justify-self:end;min-width:74px;text-align:center;padding:7px 0;border-radius:8px;font-size:13px;font-weight:700;color:#fff}
.hm-badge.up{background:var(--up)} .hm-badge.dn{background:var(--dn)}

.hm-trust{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center}
.hm-trust div{padding:14px 6px;border-radius:14px;background:var(--card);border:1px solid var(--line);display:flex;flex-direction:column;gap:3px}
.hm-trust b{font-size:16px;color:var(--ac)} .hm-trust span{font-size:11.5px;color:var(--mut)}

.hm-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;z-index:30;display:flex;
  background:rgba(15,19,29,.94);backdrop-filter:blur(14px);border-top:1px solid var(--line);padding:6px 4px calc(6px + env(safe-area-inset-bottom))}
.hm-nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 0;font-size:11px;color:var(--mut);text-align:center!important}
.hm-nav button.on{color:var(--ac)}

@media(min-width:768px){
  .hm-head,.hm-main{max-width:720px}
  .hm-nav{max-width:720px;border-radius:16px 16px 0 0}
  .hm-actions{grid-template-columns:repeat(6,1fr)}
  .hm-slide{min-height:200px;padding:32px 28px}
  .hm-slide h2{font-size:28px}
}
`;
