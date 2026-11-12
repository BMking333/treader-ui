import React, { useEffect, useMemo, useState } from "react";

/* CexDemo — একটাই ফাইল। ব্যবহার: import CexDemo from "./CexDemo"; <CexDemo />
   Home · Market · Exchange (order book + buy/sell) · Options (long/short) · Assets (4 tab)
   DEMO: ব্যালেন্স browser-এর localStorage-এ, শুধু ডিজাইন প্রিভিউ। */

const BLUE = "#1f7acb", GREEN = "#00c087", RED = "#d84d5a";
const COINS = ["BTC", "ETH", "DOGE", "BCH", "LTC", "TRX", "SHIB", "ADA", "BSV", "ICP", "XRP", "ETC"];
const COL = { BTC: "#f7931a", ETH: "#627eea", DOGE: "#c2a633", BCH: "#8dc351", LTC: "#345d9d", TRX: "#eb0029", SHIB: "#e42d04", ADA: "#2563eb", BSV: "#eab300", ICP: "#7b3fe4", XRP: "#111", ETC: "#328332" };
const FALL = { BTC: [73618.71, -0.27, 1.4e8], ETH: [2046.75, -1.04, 9e7], DOGE: [0.067128, -1.58, 1e7], BCH: [228.86, -0.97, 16285], LTC: [49.77, -2.43, 164530], TRX: [0.317486, -0.04, 1.7e7], SHIB: [0.00000434, -2.91, 6.9e9], ADA: [0.172924, -1.28, 3.3e7], BSV: [15.8364, -2.52, 177887], ICP: [2.57, 0, 2008], XRP: [1.04406, -1.48, 2.7e7], ETC: [6.6095, -1.69, 124280] };
const MARKETS = ["USDT", "TRX", "BTC", "ETH", "USDD", "USDC", "NFT"];
const QTY = [10, 1000, 10000, 1000000], SECS = [20, 30, 70, 90, 180], YIELD = 0.2;
const ASSET_COINS = ["USDT", "USDC", "ETH", "BTC"];

const fmt = (p) => (p >= 100 ? p.toFixed(2) : p >= 1 ? p.toFixed(4) : p >= 0.01 ? p.toFixed(6) : p.toFixed(8));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

function usePrices() {
  const [P, setP] = useState(() => Object.fromEntries(Object.entries(FALL).map(([k, v]) => [k, { price: v[0], chg: v[1], vol: v[2], hi: v[0] * 1.01, lo: v[0] * 0.99 }])));
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const syms = JSON.stringify(COINS.filter((c) => c !== "BSV").map((s) => s + "USDT"));
        const r = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbols=" + encodeURIComponent(syms));
        if (!r.ok) throw 0;
        const j = await r.json();
        if (stop) return;
        const n = {};
        j.forEach((t) => { n[t.symbol.replace("USDT", "")] = { price: +t.lastPrice, chg: +t.priceChangePercent, vol: +t.volume, hi: +t.highPrice, lo: +t.lowPrice }; });
        setP((o) => ({ ...o, ...n }));
      } catch {}
    };
    load();
    const id = setInterval(load, 4000);
    return () => { stop = true; clearInterval(id); };
  }, []);
  return P;
}

const Ic = ({ d, s = 24 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>
);
const ICON = {
  home: "M12 3l10 9h-3v9h-5v-6h-4v6H5v-9H2z",
  market: "M3 21v-8h4v8zm6 0V9h4v12zm6 0V4h4v17z",
  trade: "M12 5V1L7 6l5 5V7a6 6 0 11-6 6H4a8 8 0 108-8z",
  options: "M6 2h9l5 5v15H6zm3 9v2h8v-2zm0 4v2h8v-2z",
  assets: "M3 6a2 2 0 012-2h13v3h3v13H5a2 2 0 01-2-2zm14 8a1.5 1.5 0 100 3 1.5 1.5 0 000-3z",
  card: "M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm1 4v2h16V9z",
  chat: "M12 3a9 9 0 00-7.6 13.8L3 21l4.4-1.3A9 9 0 1012 3z",
  swap: "M7 7h11l-3-3 1.4-1.4L22 8l-5.6 5.4L15 12l3-3H7zm10 10H6l3 3-1.4 1.4L2 16l5.6-5.4L9 12l-3 3h11z",
  loan: "M12 22l-7-8h4V3h6v11h4z",
  eye: "M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 3a4 4 0 110 8 4 4 0 010-8z",
  menu: "M3 6h2v2H3zm4 0h14v2H7zM3 11h2v2H3zm4 0h14v2H7zM3 16h2v2H3zm4 0h14v2H7z",
};
const Coin = ({ s, size = 42 }) => (
  <span className="cx-coin" style={{ background: COL[s] || BLUE, width: size, height: size }}>{s[0]}</span>
);

/* ---------------- Home ---------------- */
function Home({ P, go }) {
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % 3), 3500); return () => clearInterval(id); }, []);
  const tick = ["ETH", "DOGE", "BCH"].map((s, k) => ["ETH", "DOGE", "BCH", "TRX", "SHIB", "LTC"][(k + i * 3) % 6]);
  const acts = [["Quick deposit", "card", "assets"], ["Withdraw", "card", "assets"], ["Online support", "chat", "home"], ["Quick swap", "swap", "exchange"], ["Loans", "loan", "home"], ["Transfer", "card", "assets"]];
  return (
    <>
      <div className="cx-bar"><span className="cx-logo">C</span><span className="cx-lang">English 🇺🇸</span></div>
      <div className="cx-banner"><div><b>ENTERING</b><h2>THE DIGITAL AGE</h2><p>The long lost mainstream currency<br />market has finally arrived</p></div>
        <div className="cx-dots">{[0, 1, 2].map((d) => <i key={d} className={d === i ? "on" : ""} />)}</div></div>
      <div className="cx-tick">
        {tick.map((s) => (
          <button key={s} onClick={() => go("exchange", s)}>
            <span>{s}/USDT</span><b style={{ color: P[s].chg >= 0 ? GREEN : RED }}>{fmt(P[s].price)}</b>
            <em style={{ color: P[s].chg >= 0 ? GREEN : RED }}>{P[s].chg.toFixed(2)}%</em>
          </button>
        ))}
      </div>
      <div className="cx-grid">
        {acts.map(([l, ic, to]) => (
          <button key={l} onClick={() => go(to)}><span style={{ color: "#17c3c9" }}><Ic d={ICON[ic]} s={34} /></span>{l}</button>
        ))}
      </div>
      <h3 className="cx-h">% Change</h3>
      <List P={P} go={go} />
    </>
  );
}

function List({ P, go, names }) {
  return (
    <>
      <div className="cx-th"><span>Name</span><span>Latest price</span><span>Chg%</span></div>
      {COINS.map((s) => (
        <button key={s} className="cx-row" onClick={() => go("exchange", s)}>
          <span className="cx-nm">{names ? <span><b>{s}<small>/USDT</small></b><small>24H {P[s].vol.toFixed(4)}</small></span> : <><Coin s={s} /><b>{s}<small>/USDT</small></b></>}</span>
          <span>{names ? <><b>{fmt(P[s].price)}</b><small>$ {P[s].price.toFixed(2)}</small></> : <b>{fmt(P[s].price)}</b>}</span>
          <span className="cx-pill" style={{ background: P[s].chg >= 0 ? GREEN : RED }}>{P[s].chg >= 0 ? "+" : ""}{Math.abs(P[s].chg) < 0.005 ? "0" : P[s].chg.toFixed(2)}%</span>
        </button>
      ))}
    </>
  );
}

/* ---------------- Market ---------------- */
function Market({ P, go }) {
  const [m, setM] = useState("USDT");
  const [sub, setSub] = useState("All");
  return (
    <>
      <div className="cx-top"><button onClick={() => go("home")}>‹</button><h1>Market</h1><span /></div>
      <div className="cx-tabs">{MARKETS.map((t) => <button key={t} className={m === t ? "on" : ""} onClick={() => setM(t)}>{t}</button>)}</div>
      <div className="cx-tabs two">{["All", "NFT"].map((t) => <button key={t} className={sub === t ? "on" : ""} onClick={() => setSub(t)}>{t}</button>)}</div>
      {m === "USDT" && sub === "All" ? <List P={P} go={go} names /> : <div className="cx-empty">No data</div>}
    </>
  );
}

/* ---------------- Exchange ---------------- */
function Exchange({ P, W, sym, setSym, go }) {
  const [side, setSide] = useState("buy");
  const [price, setPrice] = useState("");
  const [q, setQ] = useState("");
  const [amt, setAmt] = useState("");
  const [msg, setMsg] = useState("");
  const [pick, setPick] = useState(false);
  const d = P[sym];
  const book = useMemo(() => {
    const mk = (k) => Array.from({ length: 5 }, (_, i) => [d.price * (1 + k * 0.0004 * (i + 1)), Math.random() * 1.2 + 0.001]);
    return { a: mk(1).reverse(), b: mk(-1) };
  }, [Math.round(d.price)]); // eslint-disable-line
  const usdt = W.w.USDT || 0, held = W.w[sym] || 0;
  const px = parseFloat(price) || d.price;
  const est = side === "buy" ? (parseFloat(amt) || 0) / px : (parseFloat(q) || 0);
  const pct = (p) => { if (side === "buy") setAmt(String(+(usdt * p).toFixed(2))); else setQ(String(+(held * p).toFixed(8))); };
  const submit = () => {
    setMsg("");
    const nw = { ...W.w };
    if (side === "buy") {
      const a = parseFloat(amt) || 0;
      if (a <= 0) return setMsg("Enter trade amount");
      if (a > usdt) return setMsg("Insufficient USDT balance");
      nw.USDT = usdt - a; nw[sym] = held + a / px;
    } else {
      const n = parseFloat(q) || 0;
      if (n <= 0) return setMsg("Enter quantity");
      if (n > held) return setMsg("Insufficient " + sym);
      nw[sym] = held - n; nw.USDT = usdt + n * px;
    }
    W.save(nw); setAmt(""); setQ(""); setMsg("Order filled (demo)");
  };
  const R = ({ r, c }) => (<div className="cx-bk"><b style={{ color: c }}>{r[0].toFixed(6)}</b><span>{r[1].toFixed(6)}</span></div>);
  return (
    <>
      <div className="cx-top"><button onClick={() => setPick(true)}><Ic d={ICON.menu} s={26} /></button><h1 style={{ textAlign: "left" }}>{sym}/USDT <small style={{ color: d.chg >= 0 ? GREEN : RED }}>{d.chg.toFixed(2)} %</small></h1><button onClick={() => go("options")}><Ic d={ICON.market} s={26} /></button></div>
      <div className="cx-ex">
        <div className="cx-book">
          <div className="cx-bh"><span>Price</span><span>Quantity</span></div>
          {book.a.map((r, i) => <R key={"a" + i} r={r} c={RED} />)}
          <div className="cx-mid" style={{ color: d.chg >= 0 ? GREEN : RED }}>{fmt(d.price)}<small>≈ {d.price.toFixed(2)}</small></div>
          {book.b.map((r, i) => <R key={"b" + i} r={r} c={GREEN} />)}
        </div>
        <div className="cx-form">
          <div className="cx-bs"><button className={side === "buy" ? "buy" : ""} onClick={() => setSide("buy")}>Buy</button><button className={side === "sell" ? "sell" : ""} onClick={() => setSide("sell")}>Sell</button></div>
          <div className="cx-sel">Limit price ⌄</div>
          <div className="cx-in"><input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" inputMode="decimal" /><button onClick={() => setPrice(fmt(px * 1.001))}>+</button><button onClick={() => setPrice(fmt(px * 0.999))}>−</button></div>
          <small>≈ {fmt(px)}</small>
          <div className="cx-in"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Quantity" inputMode="decimal" /><b>{sym}</b></div>
          <small>Available {side === "buy" ? usdt.toFixed(8) + " USDT" : held.toFixed(8) + " " + sym}<br />{side === "buy" ? "Buy" : "Sell"} {est ? est.toFixed(6) : "0"} {sym}</small>
          <div className="cx-pc">{[0.25, 0.5, 0.75, 1].map((p) => <button key={p} onClick={() => pct(p)}>{p * 100}%</button>)}</div>
          <div className="cx-in"><input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Trade amount" inputMode="decimal" /><b>USDT</b></div>
          {msg && <p className="cx-msg">{msg}</p>}
          <button className="cx-cta" style={{ background: side === "buy" ? GREEN : RED }} onClick={submit}>{side === "buy" ? "Buy" : "Sell"} {sym}</button>
        </div>
      </div>
      <div className="cx-ent"><span>Current entrust <b style={{ color: BLUE }}>Buy ⌄</b></span><span>All</span></div>
      <div className="cx-empty" style={{ height: 120 }} />
      {pick && (
        <div className="cx-over" onClick={() => setPick(false)}>
          <div className="cx-drawer" onClick={(e) => e.stopPropagation()}>
            <h2>Spot trading</h2><h3>USDT</h3>
            {COINS.map((s) => (
              <button key={s} onClick={() => { setSym(s); setPick(false); }}><b>{s}<small>/USDT</small></b><span style={{ color: P[s].chg >= 0 ? GREEN : RED }}>{fmt(P[s].price)}</span></button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Options (long / short) ---------------- */
function Options({ P, W, sym, go }) {
  const [qty, setQty] = useState(10);
  const [sec, setSec] = useState(20);
  const [sheet, setSheet] = useState(false);
  const [pos, setPos] = useState(() => store.get("cx_pos", []));
  const [msg, setMsg] = useState("");
  const [hist, setHist] = useState([]);
  const d = P[sym];
  useEffect(() => { setHist((h) => [...h, d.price].slice(-80)); }, [d.price]);
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setPos((ps) => {
        const done = ps.filter((p) => p.end <= now);
        if (!done.length) return ps;
        const nw = { ...W.w };
        done.forEach((p) => {
          const win = p.dir === "long" ? P[p.sym].price > p.open : P[p.sym].price < p.open;
          if (win) nw.USDT = (nw.USDT || 0) + p.qty * (1 + YIELD);
        });
        W.save(nw);
        const rest = ps.filter((p) => p.end > now);
        store.set("cx_pos", rest);
        return rest;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [P]); // eslint-disable-line
  const open = (dir) => {
    setMsg("");
    const bal = W.w.USDT || 0;
    if (qty < 10 || qty > 1000000) return setMsg("Opening quantity: 10.00 - 1000000.00");
    if (qty > bal) return setMsg("Insufficient balance");
    W.save({ ...W.w, USDT: bal - qty });
    const np = [...pos, { id: Date.now(), sym, dir, qty, open: d.price, end: Date.now() + sec * 1000 }];
    setPos(np); store.set("cx_pos", np); setSheet(false); setMsg("Position opened (demo)");
  };
  const lo = Math.min(...hist), hi = Math.max(...hist), rg = hi - lo || 1;
  const line = hist.map((p, i) => `${(i / Math.max(1, hist.length - 1)) * 330},${150 - ((p - lo) / rg) * 140}`).join(" ");
  return (
    <>
      <div className="cx-top"><button><Ic d={ICON.menu} s={26} /></button><h1 style={{ textAlign: "left" }}>{sym}/USDT</h1><span className="cx-link">Positions</span></div>
      <div className="cx-opt-h">
        <b style={{ color: d.chg >= 0 ? GREEN : RED }}>{d.price.toFixed(6)}<small>{d.chg.toFixed(2)} %</small></b>
        <div><span>High</span><i>{fmt(d.hi)}</i><span>Low</span><i>{fmt(d.lo)}</i><span>24H volume</span><i>{d.vol.toFixed(2)}</i></div>
      </div>
      <div className="cx-chart"><svg viewBox="0 0 330 160" width="100%"><polyline points={line} fill="none" stroke={BLUE} strokeWidth="1.6" /></svg></div>
      {msg && <p className="cx-msg">{msg}</p>}
      {pos.map((p) => (
        <div key={p.id} className="cx-pos"><b>{p.sym} {p.dir === "long" ? "Long" : "Short"}</b><span>{p.qty} USDT @ {fmt(p.open)}</span><span>{Math.max(0, Math.ceil((p.end - Date.now()) / 1000))}s</span></div>
      ))}
      <div className="cx-obar">
        <button onClick={() => setSheet(true)}>Quantity ⌄<b>{qty.toFixed(2)}</b></button>
        <button onClick={() => setSheet(true)}>Time ⌄<b>{sec}s</b></button>
        <button className="g" onClick={() => open("long")}>Buy Long</button>
        <button className="r" onClick={() => open("short")}>Sell Short</button>
      </div>
      {sheet && (
        <div className="cx-over end" onClick={() => setSheet(false)}>
          <div className="cx-sheet" onClick={(e) => e.stopPropagation()}>
            <h4>Transaction mode</h4><div className="cx-chs"><button className="on">USDT</button></div>
            <h4>Opening quantity</h4>
            <div className="cx-chs">{QTY.map((n) => <button key={n} className={qty === n ? "on" : ""} onClick={() => setQty(n)}>{n.toFixed(2)}</button>)}</div>
            <div className="cx-line"><input value={qty} inputMode="decimal" onChange={(e) => setQty(parseFloat(e.target.value) || 0)} /><button onClick={() => setQty(Math.floor(W.w.USDT || 0))}>All</button></div>
            <h4>Opening time</h4>
            <div className="cx-chs">{SECS.map((n) => <button key={n} className={sec === n ? "on" : ""} onClick={() => setSec(n)}>{n}s</button>)}</div>
            <div className="cx-info"><span>Account balance : {(W.w.USDT || 0).toFixed(8)}</span><span>Estimated Yield : {YIELD * 100}%</span></div>
            <div className="cx-info"><span>Opening quantity : 10.00 - 1000000.00</span></div>
            <div className="cx-two"><button className="g" onClick={() => open("long")}>Buy Long</button><button className="r" onClick={() => open("short")}>Sell Short</button></div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Assets ---------------- */
function Assets({ P, W }) {
  const [tab, setTab] = useState("Assets");
  const [hide, setHide] = useState(false);
  const [add, setAdd] = useState("");
  const val = (s, q) => (s === "USDT" || s === "USDC" ? q : q * (P[s]?.price || 0));
  const total = Object.entries(W.w).reduce((t, [s, q]) => t + val(s, q), 0);
  const sub = tab === "Assets" ? null : tab;
  const sec = ["Total assets", "Funds", "Options", "Quant trading"];
  return (
    <>
      <div className="cx-tabs big">{["Assets", "Funds", "Options", "Quant trading"].map((t) => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}</div>
      {!sub ? (
        <div className="cx-cards">
          {sec.map((t, i) => (
            <div key={t} className="cx-ac"><h3>{t} converted</h3><small>Available</small><b>{i === 0 ? total.toFixed(2) : i === 1 ? total.toFixed(2) : "0.00"}</b></div>
          ))}
        </div>
      ) : (
        <>
          <div className="cx-sum">
            <div><h2>{sub} converted</h2><span>Total assets</span><small>converted($)</small></div>
            <button onClick={() => setHide(!hide)}><Ic d={ICON.eye} s={26} /></button>
            <b>$ {hide ? "••••••" : (sub === "Funds" ? total : 0).toFixed(8)}</b><small>≈ $ {(sub === "Funds" ? total : 0).toFixed(2)}</small>
          </div>
          <div className="cx-cards gray">
            {ASSET_COINS.map((s) => {
              const q = sub === "Funds" ? W.w[s] || 0 : 0;
              return (
                <div key={s} className="cx-ac wide"><h3>{s} <i>›</i></h3>
                  <div className="cx-3"><span><small>Available</small>{q.toFixed(8)}</span><span><small>Frozen</small>0.00000000</span><span><small>Converted($)</small>$ {val(s, q).toFixed(2)}</span></div>
                </div>
              );
            })}
          </div>
          {sub === "Funds" && (
            <div className="cx-demo"><b>Demo top-up</b><div className="cx-line"><input placeholder="USDT amount" value={add} inputMode="decimal" onChange={(e) => setAdd(e.target.value)} />
              <button onClick={() => { const a = parseFloat(add); if (a > 0) { W.save({ ...W.w, USDT: (W.w.USDT || 0) + a }); setAdd(""); } }}>Add</button></div></div>
          )}
        </>
      )}
    </>
  );
}

/* ---------------- App ---------------- */
export default function CexDemo() {
  const P = usePrices();
  const [w, setW] = useState(() => store.get("cx_wallet", { USDT: 0 }));
  const W = { w, save: (n) => { setW(n); store.set("cx_wallet", n); } };
  const [page, setPage] = useState("home");
  const [sym, setSym] = useState("BTC");
  const go = (p, s) => { if (s) setSym(s); setPage(p); window.scrollTo(0, 0); };
  const nav = [["home", "Home"], ["market", "Market"], ["exchange", "Trade"], ["options", "Options"], ["assets", "Assets"]];
  return (
    <div className="cx">
      <style>{CSS}</style>
      <div className="cx-pg">
        {page === "home" && <Home P={P} go={go} />}
        {page === "market" && <Market P={P} go={go} />}
        {page === "exchange" && <Exchange P={P} W={W} sym={sym} setSym={setSym} go={go} />}
        {page === "options" && <Options P={P} W={W} sym={sym} go={go} />}
        {page === "assets" && <Assets P={P} W={W} />}
      </div>
      <nav className="cx-nav">
        {nav.map(([k, l]) => (
          <button key={k} className={page === k ? "on" : ""} onClick={() => go(k)}><Ic d={ICON[k === "exchange" ? "trade" : k]} s={30} />{l}</button>
        ))}
      </nav>
    </div>
  );
}

const CSS = `
.cx{min-height:100vh;background:#e0e1ea;color:#111;font-family:Roboto,system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;justify-content:center}
.cx *{box-sizing:border-box}
.cx button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:inherit}
.cx small{color:#8a8d99;font-size:13px;display:block}
.cx-pg{width:100%;max-width:520px;background:#fff;min-height:100vh;padding-bottom:90px}
.cx-bar{display:flex;justify-content:space-between;align-items:center;padding:14px 18px}
.cx-logo{width:40px;height:40px;border-radius:12px;border:4px solid #17c3c9;color:#17c3c9;display:grid;place-items:center;font-weight:900}
.cx-lang{font-size:17px}
.cx-banner{position:relative;height:200px;background:linear-gradient(120deg,#14323f,#0f2230 60%,#13262e);color:#fff;padding:36px 22px}
.cx-banner b{color:#f5a623;font-size:34px;font-weight:700;letter-spacing:1px}
.cx-banner h2{margin:0;font-size:34px;line-height:1.1;letter-spacing:.5px}
.cx-banner p{margin:10px 0 0;font-size:13px;color:#aab}
.cx-dots{position:absolute;bottom:14px;left:50%;display:flex;gap:10px;transform:translateX(-50%)}
.cx-dots i{width:10px;height:10px;border-radius:50%;background:#7a8a92}.cx-dots i.on{background:#fff}
.cx-tick{display:grid;grid-template-columns:repeat(3,1fr);text-align:center;padding:22px 0}
.cx-tick button{text-align:center}
.cx-tick span{display:block;font-size:17px}
.cx-tick b{display:block;font-size:26px;margin:4px 0}
.cx-tick em{font-style:normal;font-size:17px}
.cx-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#e0e1ea;padding:14px 10px}
.cx-grid button{display:flex;align-items:center;gap:14px;background:#fff;border-radius:10px;padding:16px 18px;font-size:19px}
.cx-h{margin:0;padding:16px 14px 10px;font-size:24px}
.cx-th,.cx-row{display:grid;grid-template-columns:1.2fr 1fr 1fr;align-items:center;gap:6px;padding:0 14px;width:100%}
.cx-th{color:#8a8d99;font-size:18px;padding-top:12px;padding-bottom:12px;border-top:1px solid #e5e6ec}
.cx-th span:last-child{text-align:right}
.cx-row{padding-top:14px;padding-bottom:14px;border-top:1px solid #e5e6ec}
.cx-row b{font-size:24px;font-weight:500;display:block}
.cx-row .cx-nm b small{display:inline;font-size:18px}
.cx-nm{display:flex;align-items:center;gap:12px;min-width:0}
.cx-coin{border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;flex:none}
.cx-pill{justify-self:end;width:112px;text-align:center;color:#fff;padding:11px 0;border-radius:6px;font-size:19px}
.cx-top{display:grid;grid-template-columns:48px 1fr auto;align-items:center;padding:12px 14px;border-bottom:1px solid #e5e6ec;gap:6px}
.cx-top h1{margin:0;font-size:24px;text-align:center;font-weight:500}
.cx-top h1 small{display:inline;font-size:18px;margin-left:8px}
.cx-top button{font-size:34px;line-height:1}
.cx-link{font-size:19px;padding-right:44px}
.cx-tabs{display:flex;overflow-x:auto;scrollbar-width:none;padding:6px 10px 0}
.cx-tabs button{padding:16px 16px 12px;font-size:21px;white-space:nowrap;color:#444;border-bottom:4px solid transparent}
.cx-tabs button.on{border-color:${BLUE};color:#000}
.cx-tabs.two{padding-left:0}.cx-tabs.two button{flex:1;text-align:center}
.cx-tabs.big button{flex:1;color:#777}.cx-tabs.big button.on{color:#000}
.cx-empty{padding:40px;text-align:center;color:#8a8d99;background:#e0e1ea}
.cx-ex{display:grid;grid-template-columns:1fr 1.1fr;gap:14px;padding:14px 10px}
.cx-bh,.cx-bk{display:flex;justify-content:space-between;gap:6px;font-size:16px;padding:12px 0}
.cx-bh{color:#8a8d99;font-size:18px}
.cx-bk b{font-weight:400}
.cx-mid{font-size:28px;font-weight:700;padding:16px 0}
.cx-bs{display:grid;grid-template-columns:1fr 1fr;background:#e0e1ea}
.cx-bs button{text-align:center;padding:16px;color:#fff;font-size:21px}
.cx-bs button:not(.buy):not(.sell){color:#fff}
.cx-bs button.buy{background:${GREEN};clip-path:polygon(0 0,100% 0,88% 100%,0 100%)}
.cx-bs button.sell{background:${RED}}
.cx-sel{font-size:21px;padding:18px 14px}
.cx-in{display:flex;align-items:center;border:1px solid #ccd;margin:10px 0 6px;padding:8px;gap:8px;height:68px}
.cx-in input{flex:1;min-width:0;border:0;border-bottom:1px solid #999;outline:0;font-size:18px;padding:6px 2px}
.cx-in button{width:40px;height:44px;border:1px solid #ccd;border-radius:4px;text-align:center;font-size:22px}
.cx-in b{font-weight:500;font-size:19px}
.cx-form small{margin:4px 0 8px;font-size:16px}
.cx-pc{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.cx-pc button{border:1px solid #555;padding:10px 0;text-align:center;font-size:17px}
.cx-cta{width:100%;color:#fff!important;padding:18px;margin-top:22px;text-align:center;font-size:22px;border-radius:4px}
.cx-msg{margin:8px 10px;padding:10px;background:#eef6ff;color:${BLUE};border-radius:6px;font-size:14px}
.cx-form .cx-msg{margin:10px 0 0}
.cx-ent{display:flex;justify-content:space-between;padding:20px 14px;font-size:26px;border-top:12px solid #e0e1ea}
.cx-ent b{font-size:22px;font-weight:500}
.cx-over{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:50;display:flex}
.cx-over.end{align-items:flex-end;justify-content:center}
.cx-drawer{width:70%;max-width:360px;background:#fff;overflow-y:auto;padding:30px 0}
.cx-drawer h2{font-weight:400;font-size:34px;margin:30px 28px}
.cx-drawer h3{color:${BLUE};font-size:34px;margin:50px 28px 30px}
.cx-drawer button{display:flex;justify-content:space-between;width:calc(100% - 56px);margin:0 28px;padding:26px 0;border-top:1px solid #ddd;font-size:22px}
.cx-drawer button b small{display:inline;color:#666;font-weight:400}
.cx-opt-h{display:flex;justify-content:space-between;padding:26px 14px;align-items:flex-start}
.cx-opt-h>b{font-size:30px;font-weight:600}
.cx-opt-h>b small{color:inherit;font-size:20px;font-weight:400;margin-top:10px}
.cx-opt-h div{display:grid;grid-template-columns:auto auto;gap:10px 40px;font-size:19px;color:#999}
.cx-opt-h i{font-style:normal;color:#222;text-align:right}
.cx-chart{border-top:1px solid #ccc;border-bottom:1px solid #ccc;padding:16px}
.cx-pos{display:flex;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #e5e6ec;font-size:14px}
.cx-obar{position:fixed;bottom:76px;left:50%;transform:translateX(-50%);width:100%;max-width:520px;background:#fff;display:grid;grid-template-columns:1fr 1fr 1.1fr 1.1fr;gap:8px;padding:10px;z-index:20;border-top:1px solid #e5e6ec}
.cx-obar button{text-align:center;font-size:19px}
.cx-obar b{display:block;font-weight:500;font-size:22px}
.cx-obar .g,.cx-two .g{background:${GREEN};color:#fff;border-radius:12px}
.cx-obar .r,.cx-two .r{background:${RED};color:#fff;border-radius:12px}
.cx-sheet{width:100%;max-width:520px;background:#fff;border-radius:26px 26px 0 0;padding:34px 26px 26px}
.cx-sheet h4{margin:20px 0 18px;font-weight:400;font-size:25px}
.cx-chs{display:flex;gap:14px;flex-wrap:wrap}
.cx-chs button{border:1px solid #888;padding:14px 0;min-width:78px;flex:1;text-align:center;font-size:21px}
.cx-chs button.on{border-color:${BLUE};box-shadow:inset -22px -22px 0 -18px ${BLUE}}
.cx-line{display:flex;align-items:center;gap:10px;margin:22px 0}
.cx-line input{flex:1;font-size:26px;border:0;border-bottom:1px solid #888;outline:0;padding:10px 4px;min-width:0}
.cx-line button{color:${BLUE};font-size:23px;padding:0 16px}
.cx-info{display:flex;justify-content:space-between;color:${GREEN};font-size:22px;margin:18px 0;gap:8px;flex-wrap:wrap}
.cx-two{display:grid;grid-template-columns:1fr 1fr;gap:34px;margin-top:30px}
.cx-two button{padding:26px 0;text-align:center;font-size:24px;border-radius:12px}
.cx-cards{display:flex;flex-direction:column;gap:14px;background:#e0e1ea;padding:14px 20px;min-height:600px}
.cx-ac{background:#fff;border-radius:16px;padding:26px}
.cx-ac h3{margin:0 0 20px;color:${BLUE};font-size:28px;display:flex;justify-content:space-between}
.cx-ac h3 i{font-style:normal;color:#111}
.cx-ac small{font-size:20px}
.cx-ac>b{display:block;font-size:26px;font-weight:500;margin-top:10px}
.cx-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:24px}
.cx-3 span:nth-child(2){text-align:center}.cx-3 span:last-child{text-align:right}
.cx-3 small{font-size:18px;margin-bottom:12px}
.cx-sum{display:grid;grid-template-columns:1fr auto;padding:24px 22px 40px;row-gap:12px}
.cx-sum h2{margin:0 0 10px;font-weight:400;font-size:28px}
.cx-sum span{font-size:18px}
.cx-sum>b{font-size:26px}.cx-sum small{font-size:20px}
.cx-demo{background:#fff;padding:18px 24px}
.cx-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;background:#fff;display:flex;z-index:30;border-top:1px solid #e5e6ec;padding:12px 0 8px}
.cx-nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:19px;color:#111;text-align:center}
.cx-nav svg{color:#5f7a96}
.cx-nav button.on{color:${BLUE}}.cx-nav button.on svg{color:${BLUE}}
@media(max-width:420px){.cx-row b{font-size:19px}.cx-pill{width:90px;font-size:16px}.cx-th,.cx-nav button,.cx-tabs button{font-size:15px}.cx-bk,.cx-bh{font-size:13px}.cx-mid{font-size:22px}.cx-sheet h4{font-size:19px}.cx-chs button,.cx-info{font-size:16px}.cx-3{font-size:17px}.cx-ac h3{font-size:22px}.cx-grid button{font-size:15px;padding:14px 10px}.cx-tick b{font-size:21px}.cx-top h1{font-size:19px}}
`;
