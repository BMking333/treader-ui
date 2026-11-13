import React, { useEffect, useMemo, useState } from "react";
import { GREEN, RED, COINS, useT, fmt, fmtV, Ic, ICON, Coin, LangPicker } from "../lib/cex";
import img1 from "../assets/Image1.png";
import img2 from "../assets/Image2.png";
import img3 from "../assets/Image3.png";

const BRAND = "CexDemo"; // ← এখানে নিজের ব্র্যান্ড নাম বদলান
const BANNERS = [img1, img2, img3];

/* ---------------- Coin list (Market পেজে ব্যবহার হয়) ---------------- */
export function List({ P, go, names }) {
  const t = useT();
  return (
    <>
      <div className="cx-th"><span>{t("name")}</span><span>{t("lp")}</span><span>{t("chg")}</span></div>
      {COINS.map((s) => (
        <button key={s} className="cx-row" onClick={() => go("exchange", s)}>
          <span className="cx-nm">
            <Coin s={s} size={names ? 38 : 42} />
            {names
              ? <span><b>{s}<small>/USDT</small></b><small>24H {fmtV(P[s].vol)}</small></span>
              : <b>{s}<small>/USDT</small></b>}
          </span>
          <span className="cx-pr">{names ? <><b>{fmt(P[s].price)}</b><small>$ {P[s].price.toFixed(2)}</small></> : <b>{fmt(P[s].price)}</b>}</span>
          <span className="cx-pill" style={{ background: P[s].chg >= 0 ? GREEN : RED }}>{P[s].chg >= 0 ? "+" : ""}{Math.abs(P[s].chg) < 0.005 ? "0" : P[s].chg.toFixed(2)}%</span>
        </button>
      ))}
    </>
  );
}

const PROMOS = [
  ["📈", "Trade spot markets", "Buy and sell 12+ coins against USDT with a live order book.", "exchange"],
  ["⏱", "Quick options", "Pick long or short, choose 20–180 seconds, and see the result fast.", "options"],
  ["🎁", "Demo balance", "Top up a practice balance and learn the platform risk-free.", "assets"],
  ["🔁", "Instant swap", "Convert between assets in a few taps from your wallet.", "exchange"],
];
const PRODUCTS = [
  ["market", "Live markets", "Watch prices, 24h change and volume across all pairs.", "market"],
  ["trade", "Spot trading", "Market-style trading with percentage shortcuts.", "exchange"],
  ["options", "Options", "Short-term long / short positions with candle charts.", "options"],
  ["assets", "Wallet", "Check balances, deposit and withdraw in demo mode.", "assets"],
  ["card", "Deposit", "Add demo funds to start practising right away.", "deposit"],
];
const STEPS = [
  ["Create account", "Register with your email in under a minute."],
  ["Add demo funds", "Top up a practice balance, no real money involved."],
  ["Pick a market", "Choose a coin and open a spot or options trade."],
  ["Track results", "Follow positions and order records in your wallet."],
];
const TABS = [["gain", "Top gainers"], ["lose", "Top decliners"], ["vol", "Top by volume"]];

/* ---------------- Home / Landing ----------------
   guest=true  → লগইনের আগের পাবলিক পেজ (Sign In / Sign Up বাটন দেখায়)
   guest=false → ড্যাশবোর্ডের ভেতরের Home (C বাটন সাইড মেনু খোলে) */
export default function Home({ P, go, lang, setLang, onMenu, guest = false }) {
  const [i, setI] = useState(0);
  const [tab, setTab] = useState("gain");
  const [pay, setPay] = useState("550");
  const [coin, setCoin] = useState("BTC");

  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % BANNERS.length), 3500); return () => clearInterval(id); }, []);

  const get = (parseFloat(pay) || 0) / (P[coin]?.price || 1);
  const list = useMemo(() => {
    const a = COINS.map((s) => ({ s, ...P[s] }));
    if (tab === "gain") a.sort((x, y) => y.chg - x.chg);
    else if (tab === "lose") a.sort((x, y) => x.chg - y.chg);
    else a.sort((x, y) => y.vol * y.price - x.vol * x.price);
    return a.slice(0, 8);
  }, [P, tab]);

  const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth" }); };

  return (
    <div className="hp">
      <style>{HCSS}</style>

      {/* ---- Header ---- */}
      <header className="hp-head">
        <div className="hp-hin">
          <button className="hp-brand" onClick={guest ? () => go("home") : onMenu} aria-label="menu">
            <i>C</i><span>{BRAND}</span>
          </button>
          <nav className="hp-nav">
            <button onClick={() => scrollTo("hp-markets")}>Prices</button>
            <button onClick={() => scrollTo("hp-products")}>Products</button>
            <button onClick={() => scrollTo("hp-start")}>Get started</button>
          </nav>
          <div className="hp-hr">
            <LangPicker lang={lang} setLang={setLang} />
            {guest && (
              <>
                <button className="hp-btn ghost" onClick={() => go("login")}>Sign In</button>
                <button className="hp-btn" onClick={() => go("register")}>Sign Up</button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="hp-notice">Demo platform · no real funds are used or moved.</div>

      {/* ---- Hero ---- */}
      <section className="hp-hero">
        <div className="hp-hin hp-herogrid">
          <div className="hp-copy">
            <h1>Trade crypto in one simple, fast platform</h1>
            <p>Follow live prices, place spot and options trades, and manage your wallet from a single clean dashboard.</p>
            <div className="hp-banner">
              <div className="hp-slides" style={{ transform: `translateX(-${i * 100}%)` }}>
                {BANNERS.map((b, k) => <img key={k} src={b} alt="" draggable="false" />)}
              </div>
              <div className="hp-dots">{BANNERS.map((_, d) => <i key={d} className={d === i ? "on" : ""} onClick={() => setI(d)} />)}</div>
            </div>
          </div>

          <div className="hp-buy">
            <h2>Buy cryptocurrency</h2>
            <label>You pay</label>
            <div className="hp-field">
              <span className="hp-cur"><b className="hp-usd">$</b>USD</span>
              <input value={pay} inputMode="decimal" onChange={(e) => setPay(e.target.value.replace(/[^0-9.]/g, ""))} />
            </div>
            <label>You get</label>
            <div className="hp-field">
              <span className="hp-cur">
                <Coin s={coin} size={26} />
                <select value={coin} onChange={(e) => setCoin(e.target.value)}>
                  {COINS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </span>
              <input readOnly value={get ? get.toFixed(get < 1 ? 6 : 4) : "0"} />
            </div>
            <div className="hp-rate">1 {coin} ≈ $ {P[coin] ? P[coin].price.toFixed(P[coin].price < 1 ? 6 : 2) : "-"} · live price</div>
            <button className="hp-btn big" onClick={() => go("exchange", coin)}>Buy now</button>
          </div>
        </div>
      </section>

      {/* ---- Promo cards ---- */}
      <section className="hp-sec hp-promos">
        <div className="hp-hin hp-cards4">
          {PROMOS.map(([ic, h, p, to]) => (
            <button key={h} className="hp-pc" onClick={() => go(to)}>
              <b><span>{ic}</span>{h}</b>
              <small>{p}</small>
              <i>→</i>
            </button>
          ))}
        </div>
      </section>

      {/* ---- Markets ---- */}
      <section className="hp-sec" id="hp-markets">
        <div className="hp-hin">
          <div className="hp-title"><h2>Markets</h2><button onClick={() => go("market")}>More markets ›</button></div>
          <div className="hp-tabs">
            {TABS.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}
          </div>
          <div className="hp-mk">
            {list.map((c) => (
              <button key={c.s} className="hp-mc" onClick={() => go("exchange", c.s)}>
                <Coin s={c.s} size={52} />
                <b>{c.s}</b>
                <small>{c.s}/USDT</small>
                <strong>${fmt(c.price)}</strong>
                <em style={{ color: c.chg >= 0 ? GREEN : RED }}>{c.chg >= 0 ? "▲" : "▼"} {Math.abs(c.chg).toFixed(2)}%</em>
              </button>
            ))}
          </div>
          <p className="hp-src">24h change · prices refresh automatically · informational purposes only.</p>
        </div>
      </section>

      {/* ---- Products ---- */}
      <section className="hp-sec" id="hp-products">
        <div className="hp-hin">
          <div className="hp-title"><h2>Find your next opportunity</h2></div>
          <div className="hp-prod">
            {PRODUCTS.map(([ic, h, p, to]) => (
              <button key={h} className="hp-pr" onClick={() => go(to)}>
                <b>{h}</b>
                <small>{p}</small>
                <span className="hp-ico"><Ic d={ICON[ic]} s={44} /></span>
                <i>+</i>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Get started ---- */}
      <section className="hp-sec" id="hp-start">
        <div className="hp-hin">
          <div className="hp-title"><h2>How to get started</h2></div>
          <div className="hp-steps">
            {STEPS.map(([h, p], k) => (
              <div key={h} className={"hp-st" + (k === 0 ? " on" : "")}>
                <span className="hp-n">{k + 1}</span>
                <b>{h}</b>
                <small>{p}</small>
                {k === 0 && guest && <button className="hp-btn" onClick={() => go("register")}>Register now</button>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="hp-foot">
        <div className="hp-hin">© {new Date().getFullYear()} {BRAND}. Demo trading platform — for practice and informational purposes only.</div>
      </footer>
    </div>
  );
}

const HCSS = `
.hp{--bg:#0a161c;--card:#15232b;--teal:#0c4a55;--accent:#ee7f66;--mut:#9fb0b8;background:var(--bg);color:#fff;width:100%;min-height:100vh;font-family:Roboto,system-ui,-apple-system,"Segoe UI",sans-serif;padding-bottom:90px;overflow-x:hidden}
.hp *{box-sizing:border-box}
.hp button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:start}
.hp small{color:var(--mut);font-size:13px;display:block}
.hp-hin{width:100%;max-width:1160px;margin:0 auto;padding:0 18px}
.hp-head{background:#08121a;position:sticky;top:0;z-index:40;border-bottom:1px solid #16262f}
.hp-head .hp-hin{display:flex;align-items:center;justify-content:space-between;gap:12px;height:68px}
.hp-brand{display:flex;align-items:center;gap:10px;font-size:22px;font-weight:700}
.hp-brand i{width:38px;height:38px;border-radius:11px;border:4px solid #17c3c9;color:#17c3c9;display:grid;place-items:center;font-style:normal;font-weight:900;font-size:17px}
.hp-nav{display:none;gap:26px;margin-inline-end:auto;margin-inline-start:30px}
.hp-nav button{font-weight:600;font-size:15px}.hp-nav button:hover{color:#17c3c9}
.hp-hr{display:flex;align-items:center;gap:10px}
.hp-head .cx-lgm{color:#111}
.hp-head .cx-lang{color:#fff;font-size:15px}
.hp-btn{background:var(--accent);color:#fff!important;font-weight:700;padding:10px 20px;border-radius:999px;text-align:center!important;font-size:14px;white-space:nowrap}
.hp-btn.ghost{background:transparent;border:1px solid #2b3d47!important}
.hp-btn.big{width:100%;padding:16px;font-size:18px;margin-top:18px;border-radius:14px}
.hp-btn:active{opacity:.85}
.hp-notice{background:#1fb5c2;color:#06232a;text-align:center;font-size:13px;padding:10px 14px}
.hp-hero{background:linear-gradient(160deg,#0c4a55 0%,#0a3641 55%,#0a2630 100%);padding:44px 0 56px}
.hp-herogrid{display:grid;grid-template-columns:1fr;gap:32px;align-items:center}
.hp-copy h1{margin:0 0 14px;font-size:34px;line-height:1.15}
.hp-copy p{margin:0 0 22px;color:#b9cdd3;font-size:17px;line-height:1.5;max-width:520px}
.hp-banner{position:relative;overflow:hidden;border-radius:18px;aspect-ratio:15/6;background:#0f2230;max-width:560px}
.hp-slides{display:flex;height:100%;transition:transform .6s ease;direction:ltr}
.hp-slides img{flex:none;width:100%;height:100%;object-fit:cover;user-select:none}
.hp-dots{position:absolute;bottom:10px;left:50%;display:flex;gap:8px;transform:translateX(-50%)}
.hp-dots i{width:9px;height:9px;border-radius:50%;background:#7a8a92;cursor:pointer}.hp-dots i.on{background:#fff}
.hp-buy{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(6px);border-radius:26px;padding:26px}
.hp-buy h2{margin:0 0 20px;font-size:24px}
.hp-buy label{display:block;font-size:13px;font-weight:600;margin:14px 0 8px;color:#dbe7eb}
.hp-field{display:flex;align-items:center;background:#0d1d25;border-radius:14px;height:58px;overflow:hidden}
.hp-cur{display:flex;align-items:center;gap:10px;padding:0 14px;min-width:132px;height:100%;border-inline-end:1px solid #1a2d37;font-size:16px}
.hp-usd{width:28px;height:28px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;font-size:15px}
.hp-cur select{background:transparent;color:#fff;border:0;font-size:16px;outline:0;cursor:pointer}
.hp-cur select option{color:#111}
.hp-field input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#fff;font-size:22px;padding:0 16px;height:100%}
.hp-rate{margin-top:16px;padding:14px;border-radius:12px;background:rgba(255,255,255,.05);font-size:13px;text-align:center;color:#dbe7eb}
.hp-sec{padding:56px 0 0}
.hp-promos{padding-top:0;margin-top:-26px;position:relative;z-index:2}
.hp-cards4{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
.hp-pc{position:relative;background:var(--card);border-radius:20px;padding:22px 22px 70px;min-height:170px;display:block;transition:transform .2s}
.hp-pc:hover,.hp-pr:hover,.hp-mc:hover{transform:translateY(-3px)}
.hp-pc b{display:flex;align-items:center;gap:8px;font-size:17px;margin-bottom:10px}
.hp-pc i{position:absolute;bottom:18px;inset-inline-start:22px;width:38px;height:38px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;font-style:normal;font-size:18px}
.hp-title{display:flex;align-items:baseline;gap:18px;flex-wrap:wrap;margin-bottom:20px}
.hp-title h2{margin:0;font-size:32px}
.hp-title button{color:var(--accent);font-weight:600;font-size:15px}
.hp-tabs{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin-bottom:20px}
.hp-tabs button{padding:12px 22px;border-radius:999px;border:1px solid #2b3d47!important;font-weight:600;white-space:nowrap;font-size:15px}
.hp-tabs button.on{background:#fff;color:#0a161c!important;border-color:#fff!important}
.hp-mk{display:flex;gap:16px;overflow-x:auto;scrollbar-width:none;padding-bottom:6px}
.hp-mc{flex:none;width:190px;background:var(--card);border-radius:20px;padding:22px 14px;text-align:center!important;display:flex;flex-direction:column;align-items:center;gap:6px;transition:transform .2s}
.hp-mc .cx-coin.img{background:#fff;padding:6px}
.hp-mc b{font-size:17px;margin-top:8px}
.hp-mc strong{font-size:16px;margin-top:10px}
.hp-mc em{font-style:normal;font-size:15px}
.hp-src{color:var(--mut);font-size:12px;margin:16px 0 0}
.hp-prod{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}
.hp-pr{position:relative;background:var(--card);border-radius:22px;padding:24px 24px 100px;min-height:230px;display:block;transition:transform .2s}
.hp-pr b{font-size:22px;display:block;margin-bottom:8px}
.hp-ico{position:absolute;bottom:20px;inset-inline-start:24px;color:#17c3c9;opacity:.9}
.hp-pr i{position:absolute;bottom:20px;inset-inline-end:20px;width:48px;height:48px;border-radius:50%;background:var(--accent);display:grid;place-items:center;font-style:normal;font-size:26px}
.hp-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0;border-radius:22px;overflow:hidden;background:var(--card)}
.hp-st{padding:30px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px}
.hp-st.on{background:#0f4a55}
.hp-n{width:44px;height:44px;border-radius:50%;background:#22333c;display:grid;place-items:center;color:#9fb0b8;margin-bottom:8px}
.hp-st.on .hp-n{background:#fff;color:#0a161c;font-weight:700}
.hp-st b{font-size:17px}
.hp-st .hp-btn{margin-top:14px}
.hp-foot{margin-top:64px;border-top:1px solid #16262f;padding:24px 0;color:var(--mut);font-size:13px}
@media(min-width:900px){
.hp-nav{display:flex}
.hp-herogrid{grid-template-columns:1.1fr .9fr;gap:60px}
.hp-copy h1{font-size:50px}
.hp-hin{padding:0 28px}
}
`;
