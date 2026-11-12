import React, { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/*  CryptoWorld — একটাই ফাইল (Home.jsx / App.jsx লাগবে না)              */
/*  Home · Market · Trade (live chart + order book) · Buy/Sell          */
/*  Deposit · Withdraw · Assets · Login/Signup                          */
/*  DEMO: সব ব্যালেন্স browser-এর localStorage-এ থাকে (শুধু ডিজাইন)       */
/*  ব্যবহার: import CryptoWorld from "./CryptoWorld"; <CryptoWorld />    */
/* ------------------------------------------------------------------ */

const FEE = 0.001;
const WFEE = 1;
const MINW = 10;
const NETS = ["TRC20", "ERC20", "BEP20"];
const COINS = [
  ["BTC", "Bitcoin", "#f7931a"], ["ETH", "Ethereum", "#627eea"], ["XRP", "Ripple", "#4b5563"],
  ["ADA", "Cardano", "#2563eb"], ["DOGE", "Dogecoin", "#c2a633"], ["BCH", "Bitcoin Cash", "#8dc351"],
  ["LTC", "Litecoin", "#345d9d"], ["TRX", "Tron", "#eb0029"], ["ETC", "Ethereum Classic", "#328332"],
  ["SHIB", "Shiba Inu", "#e42d04"], ["ICP", "Internet Computer", "#7b3fe4"],
];
const META = Object.fromEntries(COINS.map(([s, n, c]) => [s, { n, c }]));
const FALL = { BTC: [73977.69, -1.25, 2.4e8], ETH: [2066.48, -2.6, 9.8e7], XRP: [1.05957, -3.65, 2.1e7], ADA: [0.174844, -2.69, 1.6e7], DOGE: [0.068038, -2.97, 1.4e7], BCH: [231.26, -3.28, 3.1e6], LTC: [50.83, -1.55, 5.2e6], TRX: [0.317359, -0.5, 2.2e7], ETC: [6.6867, -2.38, 7.9e4], SHIB: [0.00000443, -0.67, 9.1e6], ICP: [2.54, 5.39, 3857] };
const TABS = ["Hot", "Gainers", "Losers", "Volume"];
const GUARD = ["deposit", "withdraw", "assets"];

const fmt = (p) => (p >= 1000 ? p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p >= 1 ? p.toFixed(4) : p >= 0.01 ? p.toFixed(6) : p.toFixed(8));
const vol = (v) => (v >= 1e9 ? (v / 1e9).toFixed(2) + "B" : v >= 1e6 ? (v / 1e6).toFixed(2) + "M" : v >= 1e3 ? (v / 1e3).toFixed(1) + "K" : v.toFixed(0));
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isPhone = (s) => /^\+?\d{9,15}$/.test(s.replace(/[\s-]/g, ""));

/* ------------------------------ data hooks ------------------------------ */
function usePrices() {
  const [d, setD] = useState(() => Object.fromEntries(Object.entries(FALL).map(([k, v]) => [k, { price: v[0], chg: v[1], vol: v[2] }])));
  const [live, setLive] = useState(false);
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const syms = JSON.stringify(COINS.map(([s]) => s + "USDT"));
        const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(syms)}`);
        if (!r.ok) throw 0;
        const j = await r.json();
        if (stop) return;
        const n = {};
        j.forEach((t) => { n[t.symbol.replace("USDT", "")] = { price: +t.lastPrice, chg: +t.priceChangePercent, vol: +t.quoteVolume, hi: +t.highPrice, lo: +t.lowPrice }; });
        setD((o) => ({ ...o, ...n }));
        setLive(true);
      } catch { if (!stop) setLive(false); }
    };
    load();
    const id = setInterval(load, 4000);
    return () => { stop = true; clearInterval(id); };
  }, []);
  return { P: d, live };
}

function useWallet() {
  const [w, setW] = useState(() => store.get("cw_wallet", { USDT: 0 }));
  const [tx, setTx] = useState(() => store.get("cw_tx", []));
  const save = (nw, e) => {
    setW(nw); store.set("cw_wallet", nw);
    if (e) {
      const nt = [{ id: Date.now(), time: new Date().toLocaleString(), ...e }, ...tx].slice(0, 100);
      setTx(nt); store.set("cw_tx", nt);
    }
  };
  return { w, tx, save };
}

/* ------------------------------ small UI ------------------------------ */
const Ic = ({ d, s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const Coin = ({ s, size = 36 }) => (
  <span className="x-coin" style={{ background: META[s]?.c || "#1f6f5c", width: size, height: size }}>{s[0]}</span>
);
const Msg = ({ m }) => (m ? <div className={`x-msg ${m.ok ? "ok" : "bad"}`} role="alert">{m.text}</div> : null);
const Chg = ({ v }) => <span className={`x-chg ${v >= 0 ? "up" : "dn"}`}>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</span>;

function Top({ title, back, right }) {
  return (
    <div className="x-top">
      <button onClick={back} aria-label="Back"><Ic d="M15 5l-7 7 7 7" s={22} /></button>
      <h1>{title}</h1>
      <div className="x-top-r">{right}</div>
    </div>
  );
}

/* ------------------------------ live chart (candles + line) ------------------------------ */
// [label, binance interval, group size] — 10m / 3H / 3M / 1Y Binance-এ নেই, তাই ছোট ক্যান্ডল জোড়া লাগিয়ে বানানো হয়
const TFS = [
  ["1m", "1m", 1], ["5m", "5m", 1], ["10m", "5m", 2], ["15m", "15m", 1], ["30m", "30m", 1],
  ["1H", "1h", 1], ["3H", "1h", 3], ["6H", "6h", 1], ["12H", "12h", 1], ["1D", "1d", 1],
  ["3D", "3d", 1], ["1W", "1w", 1], ["1M", "1M", 1], ["3M", "1M", 3], ["1Y", "1M", 12],
];
const SHOW = 60;
const UPC = "#19d38b", DNC = "#ff5470";

function group(rows, k) {
  if (k === 1) return rows;
  const out = [];
  for (let i = rows.length; i > 0; i -= k) {
    const g = rows.slice(Math.max(0, i - k), i);
    out.unshift({ t: g[0].t, o: g[0].o, h: Math.max(...g.map((x) => x.h)), l: Math.min(...g.map((x) => x.l)), c: g[g.length - 1].c, v: g.reduce((a, x) => a + x.v, 0) });
  }
  return out;
}
function synth(price, n) {
  const out = [];
  let c = price;
  for (let i = 0; i < n; i++) {
    const o = c * (1 + (Math.random() - 0.5) * 0.01);
    out.unshift({ t: Date.now() - i * 60000, o, h: Math.max(o, c) * (1 + Math.random() * 0.004), l: Math.min(o, c) * (1 - Math.random() * 0.004), c, v: Math.random() * 100 });
    c = o;
  }
  return out;
}

function Chart({ sym, price }) {
  const [tf, setTf] = useState("15m");
  const [type, setType] = useState("candle");
  const [rows, setRows] = useState([]);
  const [sel, setSel] = useState(null);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    let stop = false;
    const [, base, k] = TFS.find((x) => x[0] === tf);
    setRows([]); setSel(null);
    const load = async (first) => {
      try {
        const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=${base}&limit=${Math.min(1000, SHOW * k + k)}`);
        if (!r.ok) throw 0;
        const j = await r.json();
        if (stop) return;
        setRows(group(j.map((x) => ({ t: x[0], o: +x[1], h: +x[2], l: +x[3], c: +x[4], v: +x[5] })), k).slice(-SHOW));
        setDemo(false);
      } catch { if (first && !stop) { setRows(synth(price, SHOW)); setDemo(true); } }
    };
    load(true);
    const id = setInterval(() => load(false), 30000);
    return () => { stop = true; clearInterval(id); };
  }, [sym, tf]); // eslint-disable-line

  useEffect(() => {
    setRows((r) => {
      if (!r.length) return r;
      const a = r.slice(), l = { ...a[a.length - 1] };
      l.c = price; l.h = Math.max(l.h, price); l.l = Math.min(l.l, price);
      a[a.length - 1] = l;
      return a;
    });
  }, [price]);

  const W = 360, H = 250, PW = 298, CH = 190, VB = 246, VH = 42;
  const ready = rows.length > 1;
  const c = rows.length ? rows[sel ?? rows.length - 1] : null;
  const tl = (t) => {
    const d = new Date(t);
    return ["1D", "3D", "1W", "1M", "3M", "1Y"].includes(tf)
      ? d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })
      : d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  let svg = <div className="x-skel" />;
  if (ready) {
    const hi = Math.max(...rows.map((r) => r.h)), lo = Math.min(...rows.map((r) => r.l)), rng = hi - lo || 1;
    const y = (p) => 8 + (1 - (p - lo) / rng) * (CH - 16);
    const cw = PW / rows.length, bw = Math.max(1.5, cw * 0.62), x = (i) => i * cw + cw / 2;
    const mv = Math.max(...rows.map((r) => r.v)) || 1;
    const last = rows[rows.length - 1], lc = last.c >= last.o ? UPC : DNC;
    const line = rows.map((r, i) => `${x(i)},${y(r.c)}`).join(" ");
    const pick = (e) => {
      const b = e.currentTarget.ownerSVGElement.getBoundingClientRect();
      const px = ((e.clientX - b.left) / b.width) * W;
      setSel(Math.max(0, Math.min(rows.length - 1, Math.floor(px / cw))));
    };
    svg = (
      <svg className="x-cv" viewBox={`0 0 ${W} ${H}`} style={{ touchAction: "pan-y" }}>
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={lc} stopOpacity=".3" /><stop offset="1" stopColor={lc} stopOpacity="0" /></linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => {
          const p = lo + (rng * i) / 3;
          return (<g key={i}><line x1="0" x2={PW} y1={y(p)} y2={y(p)} className="x-gl" /><text x={PW + 4} y={y(p) + 3} className="x-ax">{fmt(p)}</text></g>);
        })}
        {type === "line" ? (
          <>
            <polygon points={`0,${CH} ${line} ${PW},${CH}`} fill="url(#cg)" />
            <polyline points={line} fill="none" stroke={lc} strokeWidth="1.6" strokeLinejoin="round" />
          </>
        ) : rows.map((r, i) => {
          const col = r.c >= r.o ? UPC : DNC;
          return (
            <g key={i}>
              <line x1={x(i)} x2={x(i)} y1={y(r.h)} y2={y(r.l)} stroke={col} strokeWidth="1" />
              <rect x={x(i) - bw / 2} y={Math.min(y(r.o), y(r.c))} width={bw} height={Math.max(1, Math.abs(y(r.o) - y(r.c)))} fill={col} />
            </g>
          );
        })}
        {rows.map((r, i) => (
          <rect key={"v" + i} x={x(i) - bw / 2} y={VB - (r.v / mv) * VH} width={bw} height={(r.v / mv) * VH} fill={r.c >= r.o ? UPC : DNC} opacity=".35" />
        ))}
        <line x1="0" x2={PW} y1={y(last.c)} y2={y(last.c)} stroke={lc} strokeDasharray="2 2" strokeWidth=".8" />
        <rect x={PW} y={y(last.c) - 7} width={W - PW} height="14" rx="3" fill={lc} />
        <text x={PW + 3} y={y(last.c) + 3} className="x-tag">{fmt(last.c)}</text>
        {sel !== null && (
          <g>
            <line x1={x(sel)} x2={x(sel)} y1="0" y2={VB} className="x-cr" />
            <line x1="0" x2={PW} y1={y(rows[sel].c)} y2={y(rows[sel].c)} className="x-cr" />
          </g>
        )}
        <rect x="0" y="0" width={PW} height={H} fill="transparent" onPointerDown={pick} onPointerMove={pick} onPointerLeave={() => setSel(null)} />
      </svg>
    );
  }

  return (
    <div className="x-cwrap">
      {c && (
        <div className="x-ohlc">
          <span className="x-ot">{tl(c.t)}{demo ? " · demo" : ""}</span>
          <span>O<b>{fmt(c.o)}</b></span><span>H<b>{fmt(c.h)}</b></span><span>L<b>{fmt(c.l)}</b></span>
          <span>C<b className={c.c >= c.o ? "up" : "dn"}>{fmt(c.c)}</b></span>
        </div>
      )}
      {svg}
      <div className="x-ctl">
        <div className="x-tf">{TFS.map(([l]) => <button key={l} className={l === tf ? "on" : ""} onClick={() => setTf(l)}>{l}</button>)}</div>
        <div className="x-ct">
          <button className={type === "candle" ? "on" : ""} onClick={() => setType("candle")}>Candle</button>
          <button className={type === "line" ? "on" : ""} onClick={() => setType("line")}>Line</button>
        </div>
      </div>
    </div>
  );
}

function Book({ price }) {
  const rows = useMemo(() => {
    const mk = (dir) => Array.from({ length: 6 }, (_, i) => ({ p: price * (1 + dir * 0.0003 * (i + 1)), q: Math.random() * 3 + 0.2 }));
    return { asks: mk(1).reverse(), bids: mk(-1) };
  }, [price]);
  const mx = Math.max(...rows.asks.map((r) => r.q), ...rows.bids.map((r) => r.q));
  const R = ({ r, c }) => (
    <div className="x-bk"><i className={c} style={{ width: `${(r.q / mx) * 100}%` }} /><span className={c === "a" ? "dn" : "up"}>{fmt(r.p)}</span><span>{r.q.toFixed(4)}</span></div>
  );
  return (
    <div className="x-book">
      <div className="x-bk-h"><span>Price</span><span>Qty</span></div>
      {rows.asks.map((r, i) => <R key={"a" + i} r={r} c="a" />)}
      <div className="x-mid">{fmt(price)}</div>
      {rows.bids.map((r, i) => <R key={"b" + i} r={r} c="b" />)}
    </div>
  );
}

/* ------------------------------ auth ------------------------------ */
function Auth({ mode, setMode, onClose, onDone }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const sign = mode === "signup";
  useEffect(() => { setErr(""); }, [mode]);
  const submit = (e) => {
    e.preventDefault();
    const c = id.trim();
    if (!isEmail(c) && !isPhone(c)) return setErr("Enter a valid email or phone number.");
    if (pw.length < 6) return setErr("Password must be at least 6 characters.");
    if (sign && pw !== pw2) return setErr("Passwords do not match.");
    onDone({ id: Date.now(), name: c.includes("@") ? c.split("@")[0] : c, identifier: c });
  };
  return (
    <div className="x-over" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="x-sheet" onSubmit={submit} noValidate>
        <button type="button" className="x-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="x-mark big">C</div>
        <h3>{sign ? "Create your account" : "Welcome back"}</h3>
        <div className="x-seg">
          <button type="button" className={!sign ? "on" : ""} onClick={() => setMode("login")}>Login</button>
          <button type="button" className={sign ? "on" : ""} onClick={() => setMode("signup")}>Sign up</button>
        </div>
        <label className="x-lab">Email or phone</label>
        <input className="x-in" value={id} onChange={(e) => setId(e.target.value)} placeholder="you@example.com" autoComplete="username" />
        <label className="x-lab">Password</label>
        <div className="x-pw">
          <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete={sign ? "new-password" : "current-password"} />
          <button type="button" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
        </div>
        {sign && (<><label className="x-lab">Confirm password</label>
          <input className="x-in" type={show ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Repeat password" autoComplete="new-password" /></>)}
        <Msg m={err && { text: err }} />
        <button className="x-btn pri full">{sign ? "Create account" : "Log in"}</button>
      </form>
    </div>
  );
}

/* ------------------------------ Home ------------------------------ */
function Home({ P, W, user, go, openAuth, logout }) {
  const [tab, setTab] = useState("Hot");
  const [hide, setHide] = useState(false);
  const [menu, setMenu] = useState(false);
  const total = Object.entries(W.w).reduce((t, [s, q]) => t + (s === "USDT" ? q : q * (P[s]?.price || 0)), 0);
  const rows = useMemo(() => {
    let l = COINS.map(([s]) => ({ s, ...P[s] }));
    if (tab === "Gainers") l.sort((a, b) => b.chg - a.chg);
    if (tab === "Losers") l.sort((a, b) => a.chg - b.chg);
    if (tab === "Volume") l.sort((a, b) => b.vol - a.vol);
    return l;
  }, [P, tab]);
  const movers = [...COINS].map(([s]) => ({ s, ...P[s] })).sort((a, b) => b.chg - a.chg).slice(0, 4);
  const acts = [
    ["deposit", "Deposit", "M12 5v14M5 12h14"],
    ["withdraw", "Withdraw", "M12 19V5M6 11l6-6 6 6"],
    ["trade", "Trade", "M21 12a9 9 0 11-3-6.7M21 4v5h-5"],
    ["assets", "Assets", "M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 7l2-3h12"],
  ];
  return (
    <div className="x-page">
      <header className="x-head">
        <div className="x-logo"><span className="x-mark">C</span>Crypto<b>World</b></div>
        {user ? (
          <div className="x-user">
            <button className="x-av" onClick={() => setMenu(!menu)}>{(user.name || "U")[0].toUpperCase()}</button>
            {menu && (
              <div className="x-menu">
                <div><b>{user.name}</b><small>{user.identifier}</small></div>
                <button onClick={() => { setMenu(false); go("assets"); }}>My assets</button>
                <button className="out" onClick={() => { setMenu(false); logout(); }}>Log out</button>
              </div>
            )}
          </div>
        ) : (
          <div className="x-auth-b"><button onClick={() => openAuth("login")}>Log in</button><button className="x-btn pri sm" onClick={() => openAuth("signup")}>Sign up</button></div>
        )}
      </header>

      <section className="x-hero">
        <div className="x-orb" /><div className="x-orb two" />
        <div className="x-hero-t">
          <span>Total assets (USDT)</span>
          <button onClick={() => setHide(!hide)} aria-label="Toggle"><Ic d={hide ? "M3 3l18 18M10 6a9 9 0 0111 6 9 9 0 01-2 3M6 7a9 9 0 00-3 5s3 6 9 6a8 8 0 003-1" : "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z"} s={18} /></button>
        </div>
        <div className="x-hero-n">{user ? (hide ? "••••••" : total.toFixed(2)) : "0.00"}</div>
        <div className="x-hero-b">
          {user ? (<><button className="x-btn pri" onClick={() => go("deposit")}>Deposit</button><button className="x-btn glass" onClick={() => go("trade")}>Trade</button></>)
            : (<><button className="x-btn pri" onClick={() => openAuth("signup")}>Create account</button><button className="x-btn glass" onClick={() => openAuth("login")}>Log in</button></>)}
        </div>
      </section>

      <section className="x-acts">
        {acts.map(([k, l, d]) => (
          <button key={k} onClick={() => go(k)}><span><Ic d={d} s={22} /></span>{l}</button>
        ))}
      </section>

      <section>
        <h3 className="x-h">Top movers</h3>
        <div className="x-movers">
          {movers.map((m) => (
            <button key={m.s} onClick={() => go("trade", m.s)}>
              <Coin s={m.s} size={30} />
              <b>{m.s}</b>
              <em className={m.chg >= 0 ? "up" : "dn"}>{fmt(m.price)}</em>
              <Chg v={m.chg} />
            </button>
          ))}
        </div>
      </section>

      <section className="x-card">
        <div className="x-tabs">{TABS.map((t) => <button key={t} className={t === tab ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}</div>
        <div className="x-th"><span>Name</span><span>Last price</span><span>24h</span></div>
        {rows.map((r) => (
          <button key={r.s} className="x-row" onClick={() => go("trade", r.s)}>
            <span className="x-nm"><Coin s={r.s} /><span><b>{r.s}<small>/USDT</small></b><small>Vol {vol(r.vol)}</small></span></span>
            <b className="x-px">{fmt(r.price)}</b>
            <span className={`x-pill ${r.chg >= 0 ? "up" : "dn"}`}>{r.chg >= 0 ? "+" : ""}{r.chg.toFixed(2)}%</span>
          </button>
        ))}
        <button className="x-more" onClick={() => go("market")}>View all markets ›</button>
      </section>
      <p className="x-foot">© {new Date().getFullYear()} CryptoWorld · Demo design. Trading involves risk.</p>
    </div>
  );
}

/* ------------------------------ Market ------------------------------ */
function Market({ P, go }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("def");
  const rows = useMemo(() => {
    let l = COINS.map(([s, n]) => ({ s, n, ...P[s] })).filter((r) => (r.s + r.n).toLowerCase().includes(q.trim().toLowerCase()));
    if (sort === "gain") l.sort((a, b) => b.chg - a.chg);
    if (sort === "lose") l.sort((a, b) => a.chg - b.chg);
    if (sort === "vol") l.sort((a, b) => b.vol - a.vol);
    return l;
  }, [P, q, sort]);
  return (
    <div className="x-page">
      <Top title="Market" back={() => go("home")} />
      <input className="x-in" placeholder="Search coin" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="x-tabs solo">{[["def", "Default"], ["gain", "Gainers"], ["lose", "Losers"], ["vol", "Volume"]].map(([k, l]) => <button key={k} className={sort === k ? "on" : ""} onClick={() => setSort(k)}>{l}</button>)}</div>
      <div className="x-card">
        {rows.map((r) => (
          <button key={r.s} className="x-row" onClick={() => go("trade", r.s)}>
            <span className="x-nm"><Coin s={r.s} /><span><b>{r.s}<small>/USDT</small></b><small>{r.n}</small></span></span>
            <b className="x-px">{fmt(r.price)}</b>
            <span className={`x-pill ${r.chg >= 0 ? "up" : "dn"}`}>{r.chg >= 0 ? "+" : ""}{r.chg.toFixed(2)}%</span>
          </button>
        ))}
        {!rows.length && <div className="x-empty">No coins found.</div>}
      </div>
    </div>
  );
}

/* ------------------------------ Trade ------------------------------ */
function Trade({ P, W, user, sym, setSym, go, openAuth }) {
  const [side, setSide] = useState("buy");
  const [v, setV] = useState("");
  const [m, setM] = useState(null);
  const d = P[sym];
  const usdt = W.w.USDT || 0, held = W.w[sym] || 0, amt = num(v);
  const est = side === "buy" ? (amt * (1 - FEE)) / d.price : amt * d.price * (1 - FEE);
  const pct = (p) => setV(String(side === "buy" ? +(usdt * p).toFixed(2) : +(held * p).toFixed(8)));
  const submit = () => {
    setM(null);
    if (!user) return openAuth("login");
    if (amt <= 0) return setM({ text: "Enter an amount." });
    const nw = { ...W.w };
    if (side === "buy") {
      if (amt > usdt) return setM({ text: "Not enough USDT. Deposit first." });
      nw.USDT = usdt - amt; nw[sym] = held + est;
    } else {
      if (amt > held) return setM({ text: `Not enough ${sym}.` });
      nw[sym] = held - amt; nw.USDT = usdt + est;
    }
    W.save(nw, { type: side === "buy" ? "Buy" : "Sell", text: side === "buy" ? `${amt.toFixed(2)} USDT → ${est.toFixed(6)} ${sym} @ ${fmt(d.price)}` : `${amt} ${sym} → ${est.toFixed(2)} USDT @ ${fmt(d.price)}` });
    setV("");
    setM({ ok: true, text: `${side === "buy" ? "Bought" : "Sold"} ${sym} at ${fmt(d.price)}.` });
  };
  return (
    <div className="x-page">
      <Top title={`${sym}/USDT`} back={() => go("market")} />
      <div className="x-chips">{COINS.map(([s]) => <button key={s} className={s === sym ? "on" : ""} onClick={() => { setSym(s); setV(""); setM(null); }}>{s}</button>)}</div>
      <div className="x-card x-pad">
        <div className="x-pr">
          <div><b className={`x-big ${d.chg >= 0 ? "up" : "dn"}`}>{fmt(d.price)}</b><small>{META[sym].n}</small></div>
          <Chg v={d.chg} />
        </div>
        <Chart sym={sym} price={d.price} />
        <div className="x-kv3"><span>24h high<b>{d.hi ? fmt(d.hi) : "—"}</b></span><span>24h low<b>{d.lo ? fmt(d.lo) : "—"}</b></span><span>24h vol<b>{vol(d.vol)}</b></span></div>
      </div>
      <div className="x-split">
        <div className="x-card x-pad">
          <div className="x-seg">
            <button className={side === "buy" ? "buy" : ""} onClick={() => { setSide("buy"); setV(""); }}>Buy</button>
            <button className={side === "sell" ? "sell" : ""} onClick={() => { setSide("sell"); setV(""); }}>Sell</button>
          </div>
          <label className="x-lab">{side === "buy" ? "Spend (USDT)" : `Amount (${sym})`}</label>
          <input className="x-in" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} placeholder="0.00" />
          <div className="x-pcts">{[0.25, 0.5, 0.75, 1].map((p) => <button key={p} onClick={() => pct(p)}>{p * 100}%</button>)}</div>
          <div className="x-kv"><span>Available</span><b>{side === "buy" ? `${usdt.toFixed(2)} USDT` : `${held.toFixed(6)} ${sym}`}</b></div>
          <div className="x-kv"><span>Receive ≈</span><b>{amt > 0 ? (side === "buy" ? `${est.toFixed(6)} ${sym}` : `${est.toFixed(2)} USDT`) : "—"}</b></div>
          <div className="x-kv"><span>Fee</span><b>{FEE * 100}%</b></div>
          <Msg m={m} />
          <button className={`x-btn full ${side}`} onClick={submit}>{side === "buy" ? "Buy" : "Sell"} {sym}</button>
          {user && usdt === 0 && <button className="x-link" onClick={() => go("deposit")}>Deposit USDT to start ›</button>}
        </div>
        <div className="x-card x-pad"><Book price={d.price} /></div>
      </div>
    </div>
  );
}

/* ------------------------------ Deposit ------------------------------ */
function Deposit({ W, go }) {
  const [net, setNet] = useState("TRC20");
  const [v, setV] = useState("");
  const [m, setM] = useState(null);
  const addr = { TRC20: "TDemo9xQ2kLw7Zr4PbN8sVh3yUe5JcAf1M", ERC20: "0xDemo9a1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f", BEP20: "0xDemoBsc1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7" }[net];
  const cells = useMemo(() => {
    let x = [...addr].reduce((a, c) => a + c.charCodeAt(0), 7);
    return Array.from({ length: 169 }, () => ((x = (x * 9301 + 49297) % 233280) / 233280) > 0.5);
  }, [addr]);
  const copy = async () => { try { await navigator.clipboard.writeText(addr); setM({ ok: true, text: "Address copied." }); } catch { setM({ text: "Copy failed." }); } };
  const add = () => {
    const a = num(v);
    if (a <= 0) return setM({ text: "Enter an amount." });
    W.save({ ...W.w, USDT: (W.w.USDT || 0) + a }, { type: "Deposit", text: `+${a.toFixed(2)} USDT via ${net} (demo)` });
    setV(""); setM({ ok: true, text: `${a.toFixed(2)} USDT added (demo).` });
  };
  return (
    <div className="x-page">
      <Top title="Deposit USDT" back={() => go("home")} />
      <div className="x-card x-pad c">
        <div className="x-pcts">{NETS.map((n) => <button key={n} className={net === n ? "on" : ""} onClick={() => setNet(n)}>{n}</button>)}</div>
        <div className="x-qr">{cells.map((c, i) => <i key={i} className={c ? "on" : ""} />)}</div>
        <div className="x-addr">{addr}</div>
        <button className="x-btn glass full" onClick={copy}>Copy address</button>
        <p className="x-note">Send only USDT on {net}. Sending other assets may result in loss. (Demo address)</p>
      </div>
      <div className="x-card x-pad">
        <b>Demo deposit</b>
        <p className="x-note">Design preview only — add test funds to try buy and sell.</p>
        <input className="x-in" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} placeholder="Amount (USDT)" />
        <div className="x-pcts">{[100, 500, 1000, 5000].map((n) => <button key={n} onClick={() => setV(String(n))}>{n}</button>)}</div>
        <Msg m={m} />
        <button className="x-btn pri full" onClick={add}>Add funds</button>
      </div>
    </div>
  );
}

/* ------------------------------ Withdraw ------------------------------ */
function Withdraw({ W, go }) {
  const [net, setNet] = useState("TRC20");
  const [a, setA] = useState("");
  const [v, setV] = useState("");
  const [m, setM] = useState(null);
  const bal = W.w.USDT || 0, amt = num(v);
  const submit = () => {
    setM(null);
    if (a.trim().length < 20) return setM({ text: "Enter a valid wallet address." });
    if (amt < MINW) return setM({ text: `Minimum withdrawal is ${MINW} USDT.` });
    if (amt > bal) return setM({ text: "Amount is higher than your balance." });
    W.save({ ...W.w, USDT: bal - amt }, { type: "Withdraw", text: `-${amt.toFixed(2)} USDT to ${a.trim().slice(0, 8)}… (${net}) · Pending` });
    setA(""); setV(""); setM({ ok: true, text: "Withdrawal request submitted." });
  };
  return (
    <div className="x-page">
      <Top title="Withdraw USDT" back={() => go("home")} />
      <div className="x-card x-pad">
        <div className="x-pcts">{NETS.map((n) => <button key={n} className={net === n ? "on" : ""} onClick={() => setNet(n)}>{n}</button>)}</div>
        <label className="x-lab">Wallet address</label>
        <input className="x-in" value={a} onChange={(e) => setA(e.target.value)} placeholder="Paste address" />
        <label className="x-lab">Amount (USDT)</label>
        <input className="x-in" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} placeholder={`Min ${MINW}`} />
        <div className="x-pcts"><button onClick={() => setV(String(bal))}>Max</button></div>
        <div className="x-kv"><span>Available</span><b>{bal.toFixed(2)} USDT</b></div>
        <div className="x-kv"><span>Network fee</span><b>{WFEE} USDT</b></div>
        <div className="x-kv"><span>You receive</span><b>{Math.max(0, amt - WFEE).toFixed(2)} USDT</b></div>
        <Msg m={m} />
        <button className="x-btn sell full" onClick={submit}>Withdraw</button>
      </div>
    </div>
  );
}

/* ------------------------------ Assets ------------------------------ */
function Assets({ P, W, go }) {
  const h = Object.entries(W.w).filter(([, q]) => q > 0).map(([s, q]) => ({ s, q, val: s === "USDT" ? q : q * P[s].price }));
  const total = h.reduce((t, x) => t + x.val, 0);
  return (
    <div className="x-page">
      <Top title="My Assets" back={() => go("home")} />
      <div className="x-hero">
        <div className="x-orb" />
        <div className="x-hero-t"><span>Total value (USDT)</span></div>
        <div className="x-hero-n">{total.toFixed(2)}</div>
        <div className="x-hero-b"><button className="x-btn pri" onClick={() => go("deposit")}>Deposit</button><button className="x-btn glass" onClick={() => go("withdraw")}>Withdraw</button></div>
      </div>
      <div className="x-card">
        {h.map((x) => (
          <div key={x.s} className="x-li"><Coin s={x.s} /><span><b>{x.s}</b><small>{x.q.toFixed(x.s === "USDT" ? 2 : 6)}</small></span><b>{x.val.toFixed(2)}</b></div>
        ))}
        {!h.length && <div className="x-empty">No assets yet. Make a deposit to begin.</div>}
      </div>
      <h3 className="x-h">History</h3>
      <div className="x-card">
        {W.tx.map((t) => (
          <div key={t.id} className="x-li"><span><b>{t.type}</b><small>{t.text}</small></span><small>{t.time}</small></div>
        ))}
        {!W.tx.length && <div className="x-empty">No transactions yet.</div>}
      </div>
    </div>
  );
}

/* ------------------------------ App ------------------------------ */
export default function CryptoWorld() {
  const { P, live } = usePrices();
  const W = useWallet();
  const [route, setRoute] = useState({ page: "home", sym: "BTC" });
  const [user, setUser] = useState(() => store.get("cw_user", null));
  const [auth, setAuth] = useState(null);
  const [pend, setPend] = useState(null);

  const go = (page, sym) => {
    if (GUARD.includes(page) && !user) { setPend([page, sym]); return setAuth("login"); }
    setRoute((r) => ({ page, sym: sym || r.sym }));
    window.scrollTo(0, 0);
  };
  const done = (u) => {
    setUser(u); store.set("cw_user", u); setAuth(null);
    if (pend) { setRoute((r) => ({ page: pend[0], sym: pend[1] || r.sym })); setPend(null); }
  };
  const logout = () => { store.del("cw_user"); setUser(null); setRoute({ page: "home", sym: "BTC" }); };
  const { page, sym } = route;

  const nav = [
    ["home", "Home", "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"],
    ["market", "Market", "M4 20V10M10 20V4M16 20v-8M22 20H2"],
    ["trade", "Trade", "M21 12a9 9 0 11-3-6.7M21 4v5h-5"],
    ["assets", "Assets", "M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 7l2-3h12"],
  ];

  return (
    <div className="x">
      <style>{CSS}</style>
      <span className={`x-live ${live ? "on" : ""}`}><i />{live ? "Live" : "Demo"}</span>
      {page === "home" && <Home P={P} W={W} user={user} go={go} openAuth={setAuth} logout={logout} />}
      {page === "market" && <Market P={P} go={go} />}
      {page === "trade" && <Trade P={P} W={W} user={user} sym={sym} setSym={(s) => setRoute((r) => ({ ...r, sym: s }))} go={go} openAuth={setAuth} />}
      {page === "deposit" && <Deposit W={W} go={go} />}
      {page === "withdraw" && <Withdraw W={W} go={go} />}
      {page === "assets" && <Assets P={P} W={W} go={go} />}
      <nav className="x-nav">
        {nav.map(([k, l, d]) => (
          <button key={k} className={page === k ? "on" : ""} onClick={() => go(k)}><Ic d={d} s={22} /><span>{l}</span></button>
        ))}
      </nav>
      {auth && <Auth mode={auth} setMode={setAuth} onClose={() => { setAuth(null); setPend(null); }} onDone={done} />}
    </div>
  );
}

/* ------------------------------ styles ------------------------------ */
const CSS = `
.x{--bg:#070b12;--card:#0e1420;--card2:#151d2e;--line:#1e283b;--tx:#eef1f6;--mut:#7d889c;--up:#19d38b;--dn:#ff5470;--ac:#3ee6b8;--ac2:#4aa8ff;
  min-height:100vh;background:radial-gradient(900px 400px at 50% -120px,#10243a 0,transparent 70%),var(--bg);color:var(--tx);
  font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex;flex-direction:column;align-items:center;-webkit-font-smoothing:antialiased}
.x *{box-sizing:border-box}
.x button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:inherit}
.x small{color:var(--mut);font-size:12px;display:block}
.up{color:var(--up)}.dn{color:var(--dn)}
.x-live{position:fixed;top:14px;right:14px;z-index:40;display:flex;align-items:center;gap:6px;font-size:11px;color:var(--mut);padding:4px 9px;border:1px solid var(--line);border-radius:99px;background:rgba(7,11,18,.7);backdrop-filter:blur(8px)}
.x-live i{width:7px;height:7px;border-radius:50%;background:#e0a100}
.x-live.on i{background:var(--up);animation:xp 1.8s infinite}
@keyframes xp{0%{box-shadow:0 0 0 0 rgba(25,211,139,.6)}70%,100%{box-shadow:0 0 0 7px rgba(25,211,139,0)}}
.x-page{width:100%;max-width:520px;padding:0 16px 110px;display:flex;flex-direction:column;gap:16px}
.x-head{display:flex;align-items:center;justify-content:space-between;padding:16px 0 4px;padding-right:62px}
.x-logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:19px}
.x-logo b{color:var(--ac)}
.x-mark{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;font-weight:800;color:#04241c;background:linear-gradient(135deg,var(--ac),var(--ac2))}
.x-mark.big{width:48px;height:48px;border-radius:14px;font-size:22px;margin:0 auto}
.x-auth-b{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:600}
.x-auth-b>button:first-child{padding:8px 10px}
.x-user{position:relative}
.x-av{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:700;background:linear-gradient(135deg,var(--ac),var(--ac2));color:#04241c!important}
.x-menu{position:absolute;right:0;top:44px;min-width:200px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:6px;box-shadow:0 18px 40px rgba(0,0,0,.5);z-index:30}
.x-menu>div{padding:10px 12px;border-bottom:1px solid var(--line);margin-bottom:4px}
.x-menu button{display:block;width:100%;padding:10px 12px;border-radius:9px;font-size:14px}
.x-menu button:hover{background:var(--card2)}
.x-menu .out{color:var(--dn)!important}
.x-top{position:sticky;top:0;z-index:10;display:grid;grid-template-columns:40px 1fr 62px;align-items:center;padding:14px 0 8px;background:linear-gradient(var(--bg) 70%,transparent)}
.x-top h1{margin:0;font-size:18px;text-align:center}
.x-top button{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:var(--card)}

.x-hero{position:relative;overflow:hidden;padding:22px 20px 20px;border-radius:24px;background:linear-gradient(145deg,#12304a 0%,#0c2036 45%,#0a3a38 100%);border:1px solid rgba(62,230,184,.18)}
.x-orb{position:absolute;right:-50px;top:-60px;width:210px;height:210px;border-radius:50%;background:radial-gradient(circle at 35% 35%,rgba(74,168,255,.45),transparent 65%)}
.x-orb.two{right:auto;left:-70px;top:auto;bottom:-90px;background:radial-gradient(circle at 60% 40%,rgba(62,230,184,.3),transparent 65%)}
.x-hero>:not(.x-orb){position:relative}
.x-orb{pointer-events:none}
.x-hero-t{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:rgba(255,255,255,.65)}
.x-hero-t button{color:inherit;display:grid;place-items:center}
.x-hero-n{font-size:38px;font-weight:700;letter-spacing:.3px;margin:8px 0 18px;font-variant-numeric:tabular-nums}
.x-hero-b{display:flex;gap:10px}
.x-btn{flex:1;padding:12px 16px;border-radius:13px;font-weight:700;font-size:14.5px;text-align:center!important;transition:.15s}
.x-btn.sm{flex:none;padding:8px 16px;font-size:14px}
.x-btn.full{width:100%;margin-top:4px;padding:14px}
.x-btn.pri{background:linear-gradient(135deg,var(--ac),#2fc9d6);color:#03251d!important}
.x-btn.glass{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)}
.x-btn.buy{background:var(--up);color:#032416!important}
.x-btn.sell{background:var(--dn);color:#fff!important}
.x-btn:active{transform:scale(.98)}

.x-acts{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.x-acts button{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:12.5px;font-weight:600;text-align:center!important;padding:6px 0}
.x-acts span{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;color:var(--ac);background:var(--card);border:1px solid var(--line);transition:.15s}
.x-acts button:hover span{border-color:var(--ac);background:var(--card2)}

.x-h{margin:0 0 10px;font-size:16px}
.x-movers{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.x-movers button{display:grid;grid-template-columns:30px 1fr;grid-template-rows:auto auto auto;column-gap:10px;row-gap:2px;padding:12px;border-radius:16px;background:var(--card);border:1px solid var(--line);align-items:center}
.x-movers .x-coin{grid-row:1/3}
.x-movers em{font-style:normal;font-weight:700;font-size:14px;grid-column:1/3;margin-top:6px;font-variant-numeric:tabular-nums}
.x-movers .x-chg{grid-column:1/3}
.x-chg{font-size:12.5px;font-weight:700}
.x-chg.up{color:var(--up)}.x-chg.dn{color:var(--dn)}

.x-card{background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden}
.x-pad{padding:16px;display:flex;flex-direction:column;gap:10px}
.x-pad.c{align-items:stretch}
.x-tabs{display:flex;gap:4px;padding:12px 12px 6px;overflow-x:auto;scrollbar-width:none}
.x-tabs.solo{padding:0}
.x-tabs button{padding:8px 14px;border-radius:99px;font-size:13.5px;font-weight:600;color:var(--mut);white-space:nowrap;background:transparent}
.x-tabs.solo button{background:var(--card)}
.x-tabs button.on{background:var(--card2);color:var(--tx);box-shadow:inset 0 0 0 1px var(--line)}
.x-th,.x-row{display:grid;grid-template-columns:1.5fr 1.1fr .8fr;align-items:center;gap:8px;padding:0 16px;width:100%}
.x-th{font-size:12px;color:var(--mut);padding-top:8px;padding-bottom:6px}
.x-th span:last-child{text-align:right}
.x-row{padding-top:12px;padding-bottom:12px;border-top:1px solid rgba(30,40,59,.7);transition:.12s}
.x-row:hover{background:var(--card2)}
.x-nm{display:flex;align-items:center;gap:10px;min-width:0}
.x-nm b{font-size:15px;display:block}
.x-nm b small{display:inline;font-size:12px;font-weight:500}
.x-px{font-variant-numeric:tabular-nums;font-size:14.5px}
.x-pill{justify-self:end;min-width:72px;text-align:center;padding:7px 0;border-radius:9px;font-size:13px;font-weight:700;color:#fff}
.x-pill.up{background:var(--up);color:#03251a}.x-pill.dn{background:var(--dn)}
.x-coin{border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:14px;color:#fff;flex:none}
.x-more{width:100%;padding:14px;text-align:center!important;color:var(--ac)!important;font-weight:600;font-size:14px;border-top:1px solid var(--line)}
.x-foot{margin:0;text-align:center;color:var(--mut);font-size:11.5px;line-height:1.5}
.x-empty{padding:28px 16px;text-align:center;color:var(--mut);font-size:13.5px}

.x-chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}
.x-chips button{padding:8px 14px;border-radius:99px;font-weight:700;font-size:13px;background:var(--card);border:1px solid var(--line);color:var(--mut)}
.x-chips button.on{color:#03251d;background:var(--ac);border-color:var(--ac)}
.x-pr{display:flex;justify-content:space-between;align-items:flex-start}
.x-big{font-size:30px;font-variant-numeric:tabular-nums;display:block}
.x-cwrap{display:flex;flex-direction:column;gap:8px}
.x-cv{width:100%;height:auto;display:block;user-select:none;-webkit-user-select:none}
.x-gl{stroke:#1e283b;stroke-width:.6}
.x-ax{fill:#7d889c;font-size:8.5px}
.x-tag{fill:#04140e;font-size:8.5px;font-weight:700}
.x-cr{stroke:#7d889c;stroke-width:.6;stroke-dasharray:2 2}
.x-ohlc{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11.5px;color:var(--mut);min-height:34px;align-items:center}
.x-ohlc b{margin-left:4px;color:var(--tx);font-variant-numeric:tabular-nums}
.x-ohlc b.up{color:var(--up)}.x-ohlc b.dn{color:var(--dn)}
.x-ot{width:100%}
.x-ctl{display:flex;gap:8px;align-items:center;justify-content:space-between}
.x-tf{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;flex:1}
.x-tf::-webkit-scrollbar{display:none}
.x-tf button,.x-ct button{padding:6px 10px;border-radius:8px;font-size:12.5px;font-weight:600;color:var(--mut);white-space:nowrap}
.x-tf button.on{background:var(--card2);color:var(--ac);box-shadow:inset 0 0 0 1px var(--line)}
.x-ct{display:flex;flex:none;background:var(--bg);border-radius:9px;padding:2px}
.x-ct button.on{background:var(--card2);color:var(--tx)}
.x-skel{height:250px;border-radius:12px;background:linear-gradient(90deg,var(--card2),#1b2640,var(--card2));background-size:200% 100%;animation:xs 1.4s infinite}
@keyframes xs{to{background-position:-200% 0}}
.x-kv3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:11.5px;color:var(--mut)}
.x-kv3 b{display:block;color:var(--tx);font-size:13px;margin-top:2px;overflow-wrap:anywhere}
.x-split{display:flex;flex-direction:column;gap:16px}
.x-book{display:flex;flex-direction:column;gap:3px;font-size:12.5px;font-variant-numeric:tabular-nums}
.x-bk-h,.x-bk{display:flex;justify-content:space-between;position:relative;padding:3px 6px}
.x-bk-h{color:var(--mut);font-size:11.5px}
.x-bk i{position:absolute;right:0;top:0;bottom:0;opacity:.14;border-radius:4px}
.x-bk i.a{background:var(--dn)}.x-bk i.b{background:var(--up)}
.x-bk span{position:relative}
.x-mid{text-align:center;font-weight:700;font-size:16px;padding:8px 0;border-block:1px solid var(--line);margin:3px 0}

.x-seg{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:13px;background:var(--bg);margin-bottom:6px}
.x-seg button{padding:11px;border-radius:10px;font-weight:700;text-align:center!important;color:var(--mut)}
.x-seg button.on{background:var(--card2);color:var(--tx)}
.x-seg button.buy{background:var(--up);color:#03251a}
.x-seg button.sell{background:var(--dn);color:#fff}
.x-lab{font-size:12.5px;color:var(--mut);margin-top:4px;display:block}
.x-in{width:100%;height:48px;border-radius:12px;background:var(--bg);border:1px solid var(--line);color:var(--tx);padding:0 14px;font-size:15px;outline:0}
.x-in:focus,.x-pw:focus-within{border-color:var(--ac)}
.x-pw{display:flex;align-items:center;height:48px;border-radius:12px;background:var(--bg);border:1px solid var(--line)}
.x-pw input{flex:1;min-width:0;height:100%;background:none;border:0;outline:0;color:var(--tx);padding:0 14px;font-size:15px}
.x-pw button{padding:0 14px;color:var(--ac)!important;font-size:13px;font-weight:600}
.x-pcts{display:flex;gap:8px;flex-wrap:wrap}
.x-pcts button{padding:8px 14px;border-radius:99px;font-size:13px;font-weight:600;background:var(--bg);border:1px solid var(--line);color:var(--mut)}
.x-pcts button.on{color:var(--tx);border-color:var(--ac);background:var(--card2)}
.x-kv{display:flex;justify-content:space-between;font-size:13.5px}
.x-kv span{color:var(--mut)}
.x-link{color:var(--ac)!important;font-weight:600;font-size:14px;text-align:center!important}
.x-note{margin:0;font-size:12.5px;line-height:1.5;color:var(--mut)}
.x-msg{padding:10px 12px;border-radius:11px;font-size:13px;margin-top:4px}
.x-msg.ok{background:rgba(25,211,139,.12);border:1px solid rgba(25,211,139,.35);color:#7ff0c0}
.x-msg.bad{background:rgba(255,84,112,.12);border:1px solid rgba(255,84,112,.35);color:#ff9aae}
.x-qr{display:grid;grid-template-columns:repeat(13,1fr);gap:2px;width:170px;padding:10px;border-radius:14px;background:#fff;margin:4px auto}
.x-qr i{aspect-ratio:1;background:#fff;border-radius:1px}.x-qr i.on{background:#0b1220}
.x-addr{padding:12px;border-radius:12px;background:var(--bg);border:1px dashed var(--line);font-size:13px;overflow-wrap:anywhere;text-align:center}
.x-li{display:flex;align-items:center;gap:12px;padding:13px 16px;border-top:1px solid rgba(30,40,59,.7)}
.x-li:first-child{border-top:0}
.x-li>span{flex:1;min-width:0}
.x-li b{display:block}

.x-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;z-index:30;display:flex;background:rgba(10,15,24,.92);backdrop-filter:blur(16px);border-top:1px solid var(--line);padding:6px 4px calc(6px + env(safe-area-inset-bottom))}
.x-nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 0;font-size:11px;color:var(--mut);text-align:center!important}
.x-nav button.on{color:var(--ac)}

.x-over{position:fixed;inset:0;z-index:100;background:rgba(3,6,12,.75);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center}
.x-sheet{position:relative;width:100%;max-width:440px;max-height:94vh;overflow-y:auto;background:var(--card);border:1px solid var(--line);border-radius:24px 24px 0 0;padding:26px 22px 24px;display:flex;flex-direction:column;gap:8px;animation:xu .28s cubic-bezier(.2,.8,.2,1)}
@keyframes xu{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.x-sheet h3{margin:6px 0 8px;font-size:22px;text-align:center}
.x-close{position:absolute;right:14px;top:14px;width:32px;height:32px;border-radius:50%;color:var(--mut)!important;display:grid;place-items:center}

@media(min-width:768px){
  .x-page,.x-nav{max-width:760px}
  .x-acts{grid-template-columns:repeat(4,160px);justify-content:center}
  .x-movers{grid-template-columns:repeat(4,1fr)}
  .x-split{flex-direction:row}.x-split>*{flex:1}
  .x-over{align-items:center}.x-sheet{border-radius:24px}
}
`;
