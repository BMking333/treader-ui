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

/* ---------------- Landing-এর কনটেন্ট (এখান থেকে লেখা বদলান) ---------------- */
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

/* Earn calculator — শুধু উদাহরণ (illustrative) রেট, আসল রিটার্ন নয় */
const EARN = { ETH: 4.2, ADA: 3.5, TRX: 5.1, XRP: 2.8, LTC: 3.2 };

const ECO = {
  traders: [
    { h: "Spot trading", p: "Live order book, limit-style inputs and one-tap percentage buttons in a single screen.", to: "exchange", v: "big", art: "candles" },
    { h: "Options", p: "Open a long or short position for 20–180 seconds and follow it on a candle chart.", to: "options", v: "coral", art: "clock" },
    { h: "Wallet", p: "See balances, frozen funds and converted values at a glance.", to: "assets", v: "teal", art: "wallet" },
  ],
  everyone: [
    { h: "Instant buy", p: "Type an amount in USD and see how much of a coin you get at the live price.", to: "exchange", v: "big", art: "cart" },
    { h: "Demo deposit", p: "Top up practice funds in seconds. Nothing real is moved.", to: "deposit", v: "coral", art: "wallet" },
    { h: "Live markets", p: "Browse every pair with 24h volume and change.", to: "market", v: "teal", art: "candles" },
  ],
};
const LEARN = [
  ["How candlestick charts work", "5 min read"],
  ["Long vs short, explained simply", "4 min read"],
  ["Reading an order book", "6 min read"],
  ["Managing risk with demo trades", "3 min read"],
];
const FOOT = [
  ["Trade", [["Spot trading", "exchange"], ["Options", "options"], ["Markets", "market"]]],
  ["Wallet", [["Assets", "assets"], ["Deposit", "deposit"], ["Withdraw", "withdraw"]]],
  ["Account", [["Sign In", "login"], ["Sign Up", "register"], ["Support", "home"]]],
];

/* ছোট ইলাস্ট্রেশন (SVG) — কার্ডের নিচে বসে */
function Art({ k }) {
  if (k === "candles")
    return (
      <svg viewBox="0 0 200 120" className="hp-art" aria-hidden="true">
        {[[20, 60, 40], [55, 40, 50], [90, 70, 30], [125, 30, 60], [160, 50, 45]].map(([x, y, h], n) => (
          <g key={n}><line x1={x + 10} x2={x + 10} y1={y - 10} y2={y + h + 10} stroke="#17c3c9" strokeWidth="2" /><rect x={x} y={y} width="20" height={h} rx="4" fill={n % 2 ? "#e8eef0" : "#17c3c9"} /></g>
        ))}
      </svg>
    );
  if (k === "clock")
    return (
      <svg viewBox="0 0 200 120" className="hp-art" aria-hidden="true">
        <circle cx="100" cy="62" r="46" fill="none" stroke="#fff" strokeWidth="8" opacity=".9" />
        <path d="M100 34v30l20 12" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
      </svg>
    );
  if (k === "wallet")
    return (
      <svg viewBox="0 0 200 120" className="hp-art" aria-hidden="true">
        <rect x="40" y="26" width="120" height="76" rx="14" fill="#fff" opacity=".92" />
        <rect x="110" y="52" width="56" height="26" rx="10" fill="#17c3c9" />
        <circle cx="127" cy="65" r="5" fill="#fff" />
      </svg>
    );
  return (
    <svg viewBox="0 0 200 120" className="hp-art" aria-hidden="true">
      <path d="M40 30h24l14 50h60l12-36H70" fill="none" stroke="#17c3c9" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="84" cy="98" r="8" fill="#fff" /><circle cx="140" cy="98" r="8" fill="#fff" />
    </svg>
  );
}

/* ---------------- Home / Landing ----------------
   guest=true  → লগইনের আগের পাবলিক পেজ (Sign In / Sign Up বাটন দেখায়)
   guest=false → ড্যাশবোর্ডের ভেতরের Home (C বাটন সাইড মেনু খোলে)
   রেসপন্সিভ: মোবাইল (<600px) · ট্যাবলেট (600–899px) · ডেস্কটপ (900px+) */
export default function Home({ P, go, lang, setLang, onMenu, guest = false }) {
  const [i, setI] = useState(0);
  const [tab, setTab] = useState("gain");
  const [pay, setPay] = useState("550");
  const [coin, setCoin] = useState("BTC");
  const [eco, setEco] = useState("traders");
  const [eCoin, setECoin] = useState("ETH");
  const [eAmt, setEAmt] = useState(100);
  const [burger, setBurger] = useState(false);
  const [mail, setMail] = useState("");
  const [subd, setSubd] = useState(false);

  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % BANNERS.length), 3500); return () => clearInterval(id); }, []);

  const get = (parseFloat(pay) || 0) / (P[coin]?.price || 1);
  const list = useMemo(() => {
    const a = COINS.map((s) => ({ s, ...P[s] }));
    if (tab === "gain") a.sort((x, y) => y.chg - x.chg);
    else if (tab === "lose") a.sort((x, y) => x.chg - y.chg);
    else a.sort((x, y) => y.vol * y.price - x.vol * x.price);
    return a.slice(0, 8);
  }, [P, tab]);

  const apr = EARN[eCoin];
  const yr = eAmt * (apr / 100), mo = yr / 12, dy = yr / 365;
  const ePrice = P[eCoin]?.price || 0;

  const scrollTo = (id) => { setBurger(false); const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth" }); };
  const links = [["Prices", "hp-markets"], ["Products", "hp-products"], ["Earn", "hp-earn"], ["Learn", "hp-learn"]];
  const open = (to) => go(to);

  return (
    <div className="hp">
      <style>{HCSS}</style>

      {/* ---- Header ---- */}
      <header className="hp-head">
        <div className="hp-hin hp-hbar">
          <button className="hp-brand" onClick={guest ? () => go("home") : onMenu} aria-label="menu">
            <i>C</i><span>{BRAND}</span>
          </button>
          <nav className="hp-nav">
            {links.map(([l, id]) => <button key={id} onClick={() => scrollTo(id)}>{l}</button>)}
          </nav>
          <div className="hp-hr">
            <LangPicker lang={lang} setLang={setLang} />
            {guest && (
              <>
                <button className="hp-btn ghost hp-hide-s" onClick={() => go("login")}>Sign In</button>
                <button className="hp-btn" onClick={() => go("register")}>Sign Up</button>
              </>
            )}
            <button className="hp-burger" onClick={() => setBurger(!burger)} aria-label="navigation">{burger ? "✕" : "☰"}</button>
          </div>
        </div>
        {burger && (
          <div className="hp-drop">
            {links.map(([l, id]) => <button key={id} onClick={() => scrollTo(id)}>{l}</button>)}
            {guest && <button onClick={() => go("login")}>Sign In</button>}
          </div>
        )}
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
            <button key={h} className="hp-pc" onClick={() => open(to)}>
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
              <button key={h} className="hp-pr" onClick={() => open(to)}>
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

      {/* ---- Earn calculator (illustrative) ---- */}
      <section className="hp-sec" id="hp-earn">
        <div className="hp-hin">
          <div className="hp-title"><h2>Earn calculator</h2></div>
          <div className="hp-earn">
            <div className="hp-ec">
              <div className="hp-ehead"><b>Staking estimate</b>
                <span className="hp-cur hp-mini"><Coin s={eCoin} size={22} />
                  <select value={eCoin} onChange={(e) => setECoin(e.target.value)}>{Object.keys(EARN).map((s) => <option key={s} value={s}>{s}</option>)}</select>
                </span>
              </div>
              <div className="hp-erow"><small>How many coins do you want to stake?</small><small>Illustrative yearly rate</small></div>
              <div className="hp-erow big"><b>{eAmt} {eCoin}</b><b className="g">{apr.toFixed(2)}%</b></div>
              <input className="hp-range" type="range" min="10" max="5000" step="10" value={eAmt} onChange={(e) => setEAmt(+e.target.value)} />
              <div className="hp-kv"><span>Daily earnings</span><b>{dy.toFixed(6)} {eCoin}</b></div>
              <div className="hp-kv"><span>Monthly earnings</span><b>{mo.toFixed(6)} {eCoin}</b></div>
              <div className="hp-kv"><span>Yearly earnings</span><b>{yr.toFixed(4)} {eCoin} <i>≈ ${(yr * ePrice).toFixed(2)}</i></b></div>
              <button className="hp-btn big" onClick={() => go("assets")}>Start earning</button>
            </div>
            <div className="hp-ec side">
              <b>How it works</b>
              <p>Pick a coin, choose how much you want to hold and see an estimate of what it could earn per day, month and year.</p>
              <p className="hp-warn">Rates shown here are illustrative demo values, not a promise of returns. No real funds are staked.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Ecosystem tabs ---- */}
      <section className="hp-sec" id="hp-eco">
        <div className="hp-hin">
          <div className="hp-title"><h2>{BRAND} ecosystem</h2></div>
          <div className="hp-tabs">
            {[["traders", "For traders"], ["everyone", "For everyone"]].map(([k, l]) => (
              <button key={k} className={eco === k ? "on" : ""} onClick={() => setEco(k)}>{l}</button>
            ))}
          </div>
          <div className="hp-eco">
            {ECO[eco].map((c) => (
              <button key={c.h} className={"hp-ecc " + c.v} onClick={() => open(c.to)}>
                <b>{c.h}</b>
                <small>{c.p}</small>
                <Art k={c.art} />
                <i>+</i>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Community banner ---- */}
      <section className="hp-sec" id="hp-join">
        <div className="hp-hin">
          <div className="hp-join">
            <h2>Practice trading with a clean, simple toolset</h2>
            <div className="hp-stats">
              <div><b>{COINS.length}</b><small>Markets</small></div>
              <div><b>20–180s</b><small>Options timers</small></div>
              <div><b>24/7</b><small>Live prices</small></div>
            </div>
            <button className="hp-btn big hp-auto" onClick={() => go(guest ? "register" : "exchange")}>{guest ? "Join " + BRAND : "Start trading"}</button>
          </div>
        </div>
      </section>

      {/* ---- Learn ---- */}
      <section className="hp-sec" id="hp-learn">
        <div className="hp-hin">
          <div className="hp-title"><h2>Learn</h2></div>
          <div className="hp-learn">
            <div className="hp-lbig">
              <h3>Study crypto. Master the basics.</h3>
              <p>Short guides on charts, orders and risk, written for people who are just getting started.</p>
              <span className="hp-ico2"><Ic d={ICON.doc} s={64} /></span>
            </div>
            <div className="hp-llist">
              {LEARN.map(([h, m]) => (
                <div key={h} className="hp-li">
                  <span className="hp-th"><Ic d={ICON.candle} s={26} /></span>
                  <span><b>{h}</b><small>{m}</small></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Newsletter ---- */}
      <section className="hp-sec">
        <div className="hp-hin">
          <div className="hp-news">
            <div>
              <h2>Sign up for updates</h2>
              <p>Stay aware of news and product updates.</p>
              {subd ? (
                <p className="hp-thx">Thanks! (demo — nothing was sent or stored)</p>
              ) : (
                <div className="hp-nf">
                  <input type="email" placeholder="Email address" value={mail} onChange={(e) => setMail(e.target.value)} />
                  <button className="hp-btn" onClick={() => mail.includes("@") && setSubd(true)}>Subscribe</button>
                </div>
              )}
            </div>
            <span className="hp-ico3"><Ic d={ICON.bell} s={90} /></span>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="hp-foot">
        <div className="hp-hin">
          <div className="hp-fgrid">
            <div className="hp-fb">
              <span className="hp-brand"><i>C</i><span>{BRAND}</span></span>
              <p>A demo trading platform for learning and practice.</p>
            </div>
            {FOOT.map(([h, items]) => (
              <div key={h} className="hp-fc">
                <b>{h}</b>
                {items.map(([l, to]) => (
                  <button key={l} onClick={() => go(to)}>{l}</button>
                ))}
              </div>
            ))}
          </div>
          <p className="hp-risk">Risk warning: this is a demonstration environment. Prices are for informational purposes only, balances are virtual, and nothing here is financial advice. Real cryptocurrency trading carries a high level of risk.</p>
          <div className="hp-copy2">© {new Date().getFullYear()} {BRAND}. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

const HCSS = `
.hp{--bg:#0a161c;--card:#15232b;--teal:#0c4a55;--accent:#ee7f66;--mut:#9fb0b8;background:var(--bg);color:#fff;width:100%;min-height:100vh;font-family:Roboto,system-ui,-apple-system,"Segoe UI",sans-serif;padding-bottom:90px;overflow-x:hidden}
.hp *{box-sizing:border-box}
.hp button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:start}
.hp small{color:var(--mut);font-size:13px;display:block;line-height:1.45}
.hp h1,.hp h2,.hp h3,.hp p{overflow-wrap:anywhere}
.hp-hin{width:100%;max-width:1160px;margin:0 auto;padding:0 16px}

/* header */
.hp-head{background:#08121a;position:sticky;top:0;z-index:40;border-bottom:1px solid #16262f}
.hp-hbar{display:flex;align-items:center;justify-content:space-between;gap:10px;height:62px}
.hp-brand{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:700;flex:none}
.hp-brand i{width:36px;height:36px;border-radius:11px;border:4px solid #17c3c9;color:#17c3c9;display:grid;place-items:center;font-style:normal;font-weight:900;font-size:16px}
.hp-nav{display:none;gap:26px;margin-inline-end:auto;margin-inline-start:30px}
.hp-nav button{font-weight:600;font-size:15px}.hp-nav button:hover{color:#17c3c9}
.hp-hr{display:flex;align-items:center;gap:8px}
.hp-head .cx-lgm{color:#111}
.hp-head .cx-lang{color:#fff;font-size:14px;gap:6px}
.hp-head .cx-fl{font-size:18px}
.hp-btn{background:var(--accent);color:#fff!important;font-weight:700;padding:10px 18px;border-radius:999px;text-align:center!important;font-size:14px;white-space:nowrap}
.hp-btn.ghost{background:transparent;border:1px solid #2b3d47!important}
.hp-btn.big{width:100%;padding:15px;font-size:17px;margin-top:18px;border-radius:14px}
.hp-btn.hp-auto{max-width:360px;margin-inline:auto;display:block}
.hp-btn:active{opacity:.85}
.hp-burger{font-size:24px;width:40px;height:40px;text-align:center!important;border:1px solid #2b3d47!important;border-radius:10px}
.hp-drop{background:#0c1a22;border-top:1px solid #16262f;padding:6px 16px 14px}
.hp-drop button{display:block;width:100%;padding:14px 4px;font-size:17px;border-bottom:1px solid #16262f}
.hp-hide-s{display:none}
.hp-notice{background:#1fb5c2;color:#06232a;text-align:center;font-size:12.5px;padding:9px 14px}

/* hero */
.hp-hero{background:linear-gradient(160deg,#0c4a55 0%,#0a3641 55%,#0a2630 100%);padding:34px 0 52px}
.hp-herogrid{display:grid;grid-template-columns:minmax(0,1fr);gap:28px;align-items:center}
.hp-copy h1{margin:0 0 12px;font-size:30px;line-height:1.15}
.hp-copy p{margin:0 0 20px;color:#b9cdd3;font-size:16px;line-height:1.5;max-width:520px}
.hp-banner{position:relative;overflow:hidden;border-radius:16px;aspect-ratio:15/6;background:#0f2230;max-width:560px}
.hp-slides{display:flex;height:100%;transition:transform .6s ease;direction:ltr}
.hp-slides img{flex:none;width:100%;height:100%;object-fit:cover;user-select:none}
.hp-dots{position:absolute;bottom:10px;left:50%;display:flex;gap:8px;transform:translateX(-50%)}
.hp-dots i{width:9px;height:9px;border-radius:50%;background:#7a8a92;cursor:pointer}.hp-dots i.on{background:#fff}
.hp-buy{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(6px);border-radius:24px;padding:22px}
.hp-buy h2{margin:0 0 16px;font-size:22px}
.hp-buy label{display:block;font-size:13px;font-weight:600;margin:12px 0 8px;color:#dbe7eb}
.hp-field{display:flex;align-items:center;background:#0d1d25;border-radius:14px;height:56px;overflow:hidden}
.hp-cur{display:flex;align-items:center;gap:10px;padding:0 12px;min-width:122px;height:100%;border-inline-end:1px solid #1a2d37;font-size:16px}
.hp-usd{width:28px;height:28px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;font-size:15px}
.hp-cur select{background:transparent;color:#fff;border:0;font-size:16px;outline:0;cursor:pointer}
.hp-cur select option{color:#111}
.hp-field input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#fff;font-size:21px;padding:0 14px;height:100%}
.hp-rate{margin-top:14px;padding:12px;border-radius:12px;background:rgba(255,255,255,.05);font-size:13px;text-align:center;color:#dbe7eb}

/* sections */
.hp-sec{padding:48px 0 0}
.hp-promos{padding-top:0;margin-top:-24px;position:relative;z-index:2}
.hp-cards4{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.hp-pc{position:relative;background:var(--card);border-radius:20px;padding:20px 20px 68px;min-height:160px;display:block;transition:transform .2s}
.hp-pc:hover,.hp-pr:hover,.hp-mc:hover,.hp-ecc:hover{transform:translateY(-3px)}
.hp-pc b{display:flex;align-items:center;gap:8px;font-size:17px;margin-bottom:10px}
.hp-pc i{position:absolute;bottom:16px;inset-inline-start:20px;width:38px;height:38px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;font-style:normal;font-size:18px}
.hp-title{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;margin-bottom:18px}
.hp-title h2{margin:0;font-size:26px}
.hp-title button{color:var(--accent);font-weight:600;font-size:15px}
.hp-tabs{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin-bottom:18px}
.hp-tabs button{padding:11px 20px;border-radius:999px;border:1px solid #2b3d47!important;font-weight:600;white-space:nowrap;font-size:14.5px}
.hp-tabs button.on{background:#fff;color:#0a161c!important;border-color:#fff!important}
.hp-mk{display:flex;gap:14px;overflow-x:auto;scrollbar-width:none;padding-bottom:6px;scroll-snap-type:x proximity}
.hp-mc{flex:none;width:170px;scroll-snap-align:start;background:var(--card);border-radius:20px;padding:20px 12px;text-align:center!important;display:flex;flex-direction:column;align-items:center;gap:6px;transition:transform .2s}
.hp-mc .cx-coin.img{background:#fff;padding:6px}
.hp-mc b{font-size:17px;margin-top:8px}
.hp-mc strong{font-size:16px;margin-top:10px}
.hp-mc em{font-style:normal;font-size:15px}
.hp-src{color:var(--mut);font-size:12px;margin:14px 0 0}
.hp-prod{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.hp-pr{position:relative;background:var(--card);border-radius:22px;padding:22px 22px 96px;min-height:210px;display:block;transition:transform .2s}
.hp-pr b{font-size:21px;display:block;margin-bottom:8px}
.hp-ico{position:absolute;bottom:18px;inset-inline-start:22px;color:#17c3c9;opacity:.9}
.hp-pr i{position:absolute;bottom:18px;inset-inline-end:18px;width:46px;height:46px;border-radius:50%;background:var(--accent);display:grid;place-items:center;font-style:normal;font-size:26px}
.hp-steps{display:grid;grid-template-columns:minmax(0,1fr);border-radius:22px;overflow:hidden;background:var(--card)}
.hp-st{padding:26px 22px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px}
.hp-st.on{background:#0f4a55}
.hp-n{width:42px;height:42px;border-radius:50%;background:#22333c;display:grid;place-items:center;color:#9fb0b8;margin-bottom:6px}
.hp-st.on .hp-n{background:#fff;color:#0a161c;font-weight:700}
.hp-st b{font-size:17px}
.hp-st .hp-btn{margin-top:12px}

/* earn */
.hp-earn{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.hp-ec{background:var(--card);border-radius:22px;padding:22px}
.hp-ec.side p{color:#c3d1d7;line-height:1.55;font-size:15px}
.hp-warn{background:rgba(238,127,102,.12);border:1px solid rgba(238,127,102,.35);border-radius:12px;padding:12px;font-size:13px!important;color:#f4b3a3!important}
.hp-ehead{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:18px;font-size:20px}
.hp-mini{min-width:0;height:44px;border:1px solid #2b3d47;border-radius:12px;padding:0 10px}
.hp-erow{display:flex;justify-content:space-between;gap:10px;align-items:flex-end}
.hp-erow.big{margin-top:4px;font-size:30px}
.hp-erow b.g{color:${GREEN}}
.hp-range{width:100%;margin:16px 0 20px;accent-color:#17c3c9}
.hp-kv{display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-top:1px solid #1d2f39;font-size:14.5px;color:#c3d1d7}
.hp-kv b{color:#fff;text-align:end;font-weight:600}
.hp-kv i{font-style:normal;color:var(--mut);font-weight:400}

/* ecosystem */
.hp-eco{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.hp-ecc{position:relative;border-radius:24px;padding:24px;min-height:240px;overflow:hidden;background:var(--card);display:block;transition:transform .2s}
.hp-ecc b{font-size:24px;display:block;margin-bottom:8px}
.hp-ecc small{color:#c3d1d7;max-width:420px}
.hp-ecc.coral{background:#e98a74}.hp-ecc.coral small{color:#3a1a12}
.hp-ecc.teal{background:#0f7f8a}.hp-ecc.teal small{color:#d7f1f3}
.hp-art{position:absolute;inset-inline-end:14px;bottom:10px;width:56%;max-width:260px;pointer-events:none}
.hp-ecc i{position:absolute;bottom:18px;inset-inline-start:22px;width:42px;height:42px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;font-style:normal;font-size:22px}
.hp-ecc.big{background:#111f29}

/* join */
.hp-join{background:linear-gradient(160deg,#0c4a55,#0a2630);border-radius:26px;padding:34px 22px;text-align:center}
.hp-join h2{margin:0 auto 26px;font-size:26px;max-width:640px}
.hp-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:26px}
.hp-stats b{font-size:26px;display:block}
.hp-stats small{text-align:center}

/* learn */
.hp-learn{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.hp-lbig{position:relative;background:#111f29;border-radius:24px;padding:26px 22px 110px;min-height:260px}
.hp-lbig h3{margin:0 0 10px;font-size:24px;line-height:1.25}
.hp-lbig p{margin:0;color:#c3d1d7;line-height:1.5}
.hp-ico2{position:absolute;bottom:20px;inset-inline-start:22px;color:#17c3c9}
.hp-llist{display:flex;flex-direction:column;gap:12px}
.hp-li{display:flex;gap:14px;align-items:center;background:var(--card);border-radius:18px;padding:14px}
.hp-th{width:56px;height:56px;border-radius:14px;background:#0f4a55;color:#17c3c9;display:grid;place-items:center;flex:none}
.hp-li b{font-size:15.5px;display:block;margin-bottom:3px}

/* newsletter */
.hp-news{position:relative;background:linear-gradient(120deg,#0f7f8a,#0c4a55);border-radius:26px;padding:28px 22px;overflow:hidden}
.hp-news h2{margin:0 0 8px;font-size:28px}
.hp-news p{margin:0 0 18px;color:#d7f1f3}
.hp-nf{display:flex;flex-direction:column;gap:10px;max-width:480px}
.hp-nf input{background:#0d1d25;border:0;outline:0;color:#fff;border-radius:14px;padding:15px 16px;font-size:16px;min-width:0}
.hp-thx{font-weight:600}
.hp-ico3{position:absolute;inset-inline-end:22px;top:22px;color:rgba(255,255,255,.25);display:none}

/* footer */
.hp-foot{margin-top:56px;border-top:1px solid #16262f;padding:34px 0 20px;color:var(--mut);font-size:13px}
.hp-fgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 16px}
.hp-fb{grid-column:1/-1}
.hp-fb .hp-brand{color:#fff;margin-bottom:10px}
.hp-fb p{margin:0;max-width:340px;line-height:1.5}
.hp-fc b{display:block;color:#fff;font-size:15px;margin-bottom:10px}
.hp-fc button{display:block;padding:6px 0;color:var(--mut);font-size:14px}
.hp-fc button:hover{color:#17c3c9}
.hp-risk{margin:28px 0 14px;line-height:1.55;border-top:1px solid #16262f;padding-top:18px}
.hp-copy2{font-size:12px}

/* ---------- Tablet 600px+ ---------- */
@media(min-width:600px){
.hp-hin{padding:0 24px}
.hp-hide-s{display:inline-block}
.hp-copy h1{font-size:38px}
.hp-cards4{grid-template-columns:repeat(2,minmax(0,1fr))}
.hp-prod{grid-template-columns:repeat(2,minmax(0,1fr))}
.hp-steps{grid-template-columns:repeat(2,minmax(0,1fr))}
.hp-title h2{font-size:30px}
.hp-mc{width:190px}
.hp-eco{grid-template-columns:repeat(2,minmax(0,1fr))}
.hp-ecc.big{grid-column:1/-1}
.hp-learn{grid-template-columns:minmax(0,1fr)}
.hp-nf{flex-direction:row}
.hp-nf input{flex:1}
.hp-ico3{display:block}
.hp-fgrid{grid-template-columns:2fr 1fr 1fr 1fr}
.hp-fb{grid-column:auto}
}

/* ---------- Desktop 900px+ ---------- */
@media(min-width:900px){
.hp-hin{padding:0 32px}
.hp-hbar{height:72px}
.hp-nav{display:flex}
.hp-burger,.hp-drop{display:none}
.hp-brand{font-size:22px}
.hp-brand i{width:40px;height:40px}
.hp-hero{padding:56px 0 70px}
.hp-herogrid{grid-template-columns:1.1fr .9fr;gap:60px}
.hp-copy h1{font-size:52px}
.hp-copy p{font-size:18px}
.hp-buy{padding:30px;border-radius:28px}
.hp-buy h2{font-size:26px}
.hp-field{height:62px}
.hp-sec{padding:72px 0 0}
.hp-promos{margin-top:-30px}
.hp-cards4{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.hp-title h2{font-size:34px}
.hp-mc{width:196px}
.hp-prod{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.hp-steps{grid-template-columns:repeat(4,minmax(0,1fr))}
.hp-earn{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)}
.hp-ec{padding:30px}
.hp-eco{grid-template-columns:1.2fr 1fr;grid-template-rows:auto auto;gap:16px}
.hp-ecc.big{grid-column:1;grid-row:1/3}
.hp-ecc{min-height:280px}
.hp-ecc.big{min-height:580px}
.hp-ecc.big .hp-art{width:80%;max-width:380px}
.hp-join{padding:54px 40px}
.hp-join h2{font-size:34px}
.hp-learn{grid-template-columns:1fr 1.2fr;gap:20px}
.hp-lbig{min-height:420px;padding:32px 30px 120px}
.hp-lbig h3{font-size:30px}
.hp-news{padding:44px 44px}
.hp-news h2{font-size:34px}
}
@media(min-width:1200px){
.hp-hin{padding:0}
}
`;
