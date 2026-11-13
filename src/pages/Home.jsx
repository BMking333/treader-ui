import React, { useState, useEffect, useMemo } from "react";

/* =====================================================================
   CexApp.jsx — এক ফাইলে পুরো অ্যাপ (Login, Register, Home, Market,
   Trade, Options, Assets, Deposit, Withdraw, Side menu)
   ব্যবহার:  import CexApp from "./CexApp";   <CexApp />
   কোনো বাইরের ফাইল/লাইব্রেরি লাগে না (শুধু React)।
   ===================================================================== */

const GREEN = "#00c087", RED = "#d94f5c", YIELD = 0.8;

/* ---- coins: [sym, price, 24h%, color] ---- */
const COINS = [["BTC",69114.59,-6.02,"#f7931a"],["ETH",1942.05,-5.16,"#627eea"],["DOGE",0.064785,-3.55,"#c2a633"],["BCH",220.69,-3.62,"#8dc351"],["LTC",49.03,-1.27,"#345d9d"],["TRX",0.311438,-1.65,"#e50914"],["SHIB",0.00000428,-0.93,"#f57f20"],["ADA",0.170846,-1.74,"#2a71d0"],["BSV",15.5039,-2.52,"#eab300"],["ICP",2.61,1.16,"#29abe2"],["XRP",1.03229,-1.57,"#111"],["ETC",6.5083,-1.84,"#3ab83a"]];
const LANGS = ["Português","English","عربي","Français","italiano","日本語","한국인","Deutsch","Русский","Tiếng Việt","Türkçe","español","فارسی","Indonesia","Ελληνικά","Melayu","แบบไทย","Latinus","हिंदी","বাংলা","اردو","繁体中文","简体中文","Română","Svenska","Creole"];
const fmt = (p) => (p >= 100 ? p.toFixed(2) : p >= 1 ? p.toFixed(4) : p >= 0.01 ? p.toFixed(6) : p.toFixed(8));

/* ---- ডেমো প্রাইস (র‍্যান্ডম ওঠানামা). আসল API হলে এখানে fetch বসান ---- */
let LIVE = {};
const usePrices = () => {
  const [P, setP] = useState(() => Object.fromEntries(COINS.map(([s, p, c]) => [s, { price: p, chg: c, open: p / (1 + c / 100), vol: Math.random() * 1e8 }])));
  useEffect(() => {
    const id = setInterval(() => setP((o) => Object.fromEntries(Object.entries(o).map(([s, d]) => {
      const n = d.price * (1 + (Math.random() - 0.5) * 0.0008);
      return [s, { ...d, price: n, chg: (n / d.open - 1) * 100 }];
    }))), 2000);
    return () => clearInterval(id);
  }, []);
  LIVE = P;
  return P;
};

const Coin = ({ s, size = 30 }) => {
  const c = COINS.find((x) => x[0] === s);
  return <span className="cxa-coin" style={{ width: size, height: size, background: c ? c[3] : "#555", fontSize: size * 0.42 }}>{s[0]}</span>;
};
const Pill = ({ v }) => <span className="cxa-pill" style={{ background: v >= 0 ? GREEN : RED }}>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</span>;
const Logo = () => (
  <svg viewBox="0 0 100 100" width="26" height="26"><g fill="none" stroke="#06c9c9" strokeWidth="8"><path d="M76 16H50a34 34 0 000 68h26V66" /><path d="M76 33H50a17 17 0 000 34h26V54" /></g></svg>
);

/* ---------------- Auth (ডেমো অ্যাকাউন্ট মেমরিতে থাকে) ---------------- */
const USERS = {};
function Auth({ mode, go, onLogin }) {
  const [e, setE] = useState(""), [p, setP] = useState(""), [p2, setP2] = useState(""), [m, setM] = useState("");
  const reg = mode === "register";
  const submit = () => {
    const k = e.trim().toLowerCase();
    if (!k.includes("@")) return setM("Please enter a valid email");
    if (reg) {
      if (p.length < 6) return setM("Password must be at least 6 characters");
      if (p !== p2) return setM("Passwords do not match");
      if (USERS[k]) return setM("Email already registered");
      USERS[k] = { pw: p, uid: 2000000 + Math.floor(Math.random() * 99999) };
    } else if (!USERS[k] || USERS[k].pw !== p) return setM("Wrong email or password");
    onLogin({ email: k, uid: USERS[k].uid });
  };
  return (
    <div className="cxa-app">
      <div className="cxa-top"><button onClick={() => go("login")}>‹</button><h1>{reg ? "register" : "login"}</h1><span>🎧</span></div>
      {reg ? (
        <div className="cxa-tabs" style={{ justifyContent: "center" }}><button className="on">Email</button></div>
      ) : (
        <div style={{ display: "grid", placeItems: "center", padding: "18px 0" }}>
          <div style={{ width: 184, height: 184, background: "#fff", display: "grid", placeItems: "center" }}>
            <svg viewBox="0 0 100 100" width="150"><g fill="none" stroke="#06c9c9" strokeWidth="6.5"><path d="M76 16H50a34 34 0 000 68h26V66" /><path d="M76 33H50a17 17 0 000 34h26V54" /><path d="M76 49H54a3 3 0 000 6h22" /></g></svg>
          </div>
        </div>
      )}
      <div className="cxa-fc" style={{ margin: reg ? 0 : "0 14px" }}>
        <input className="cxa-fi" placeholder={reg ? "Please enter your email" : "Please enter your account"} value={e} onChange={(x) => setE(x.target.value)} />
        <input className="cxa-fi" type="password" placeholder="Please enter your password" value={p} onChange={(x) => setP(x.target.value)} />
        {reg
          ? <input className="cxa-fi" type="password" placeholder="Please re-enter your password" value={p2} onChange={(x) => setP2(x.target.value)} />
          : <label style={{ display: "flex", gap: 8, padding: "12px 0" }}><input type="checkbox" />Remember password</label>}
      </div>
      {m && <p className="cxa-msg bad">{m}</p>}
      <button className="cxa-btn" onClick={submit}>{reg ? "register" : "login"}</button>
      {!reg && <div className="cxa-links"><button onClick={() => go("register")}>register</button><button onClick={() => setM("Demo: not available")}>Forgot password</button></div>}
      {reg && <div className="cxa-links"><button onClick={() => go("login")}>Already have an account?</button></div>}
    </div>
  );
}

/* ---------------- Home / Market ---------------- */
function List({ P, go, names }) {
  return (
    <>
      <div className="cxa-th"><span>Name</span><span>Latest price</span><span style={{ textAlign: "right" }}>Chg%</span></div>
      {COINS.map(([s]) => (
        <button key={s} className="cxa-row" onClick={() => go("exchange", s)}>
          <span className="nm">
            {names
              ? <span><b style={{ fontSize: 16 }}>{s}<small>/USDT</small></b><br /><small style={{ fontSize: 12 }}>24H {P[s].vol.toFixed(4)}</small></span>
              : <><Coin s={s} /><span>{s}<small>/USDT</small></span></>}
          </span>
          <b>{fmt(P[s].price)}</b><Pill v={P[s].chg} />
        </button>
      ))}
    </>
  );
}

function Home({ P, go, onMenu, lang, setLang }) {
  const [i, setI] = useState(0), [lo, setLo] = useState(false);
  const B = [["Blockchain Universal", "Traceability"], ["ENTERING", "THE DIGITAL AGE"], ["THE FREEST", "MONEY"]];
  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % 3), 3500); return () => clearInterval(id); }, []);
  const QA = [["▭", "Recharge", "deposit"], ["▭", "Withdraw", "withdraw"], ["◯", "Customer service", ""], ["⇄", "Flash swap", "exchange"], ["¥", "Boost loan", ""], ["▭", "Transfer", "assets"]];
  return (
    <>
      <div className="cxa-top" style={{ background: "#0f1d2b" }}>
        <button className="cxa-logo" onClick={onMenu}><Logo /></button>
        <div className="cxa-lang">
          <button onClick={() => setLo(!lo)}>{lang} 🇺🇸</button>
          {lo && <div className="cxa-lm">{LANGS.map((l) => <button key={l} onClick={() => { setLang(l); setLo(false); }}>{l}</button>)}</div>}
        </div>
      </div>
      <div className="cxa-ban"><h2>{B[i][0]}<b>{B[i][1]}</b></h2><div className="cxa-dots">{B.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div></div>
      <div className="cxa-tk">{["DOGE", "BCH", "LTC"].map((s) => (
        <div key={s}><span>{s}/USDT</span><b style={{ color: P[s].chg >= 0 ? GREEN : RED }}>{fmt(P[s].price)}</b><small style={{ color: P[s].chg >= 0 ? GREEN : RED }}>{P[s].chg.toFixed(2)}%</small></div>
      ))}</div>
      <div className="cxa-qa">{QA.map(([ic, l, to]) => <button key={l} onClick={() => to && go(to)}><i>{ic}</i>{l}</button>)}</div>
      <div className="cxa-sec">Chg%</div>
      <List P={P} go={go} />
    </>
  );
}

function Market({ P, go }) {
  return (
    <>
      <div className="cxa-top"><button onClick={() => go("home")}>‹</button><h1>Market</h1><span /></div>
      <div className="cxa-tabs">{["USDT", "TRX", "BTC", "ETH", "USDD", "USDC", "NFT"].map((x, k) => <button key={x} className={k ? "" : "on"}>{x}</button>)}</div>
      <List P={P} go={go} names />
    </>
  );
}

/* ---------------- Coin drawer ---------------- */
const Drawer = ({ P, onPick, onClose }) => (
  <div className="cxa-over" onClick={onClose}>
    <div className="cxa-drawer" onClick={(e) => e.stopPropagation()}>
      <h2>Spot trading</h2><h3>USDT</h3>
      {COINS.map(([s]) => (
        <button key={s} onClick={() => onPick(s)}><b>{s}<small>/USDT</small></b><span style={{ color: P[s].chg >= 0 ? GREEN : RED }}>{fmt(P[s].price)}</span></button>
      ))}
    </div>
  </div>
);

/* ---------------- Exchange (spot) ---------------- */
function Exchange({ P, W, sym, setSym, go, notify }) {
  const [side, setSide] = useState("buy"), [q, setQ] = useState(""), [amt, setAmt] = useState(""), [pick, setPick] = useState(false);
  const d = P[sym], usdt = W.w.USDT || 0, held = W.w[sym] || 0;
  const book = useMemo(() => {
    const mk = (k) => Array.from({ length: 5 }, (_, i) => [d.price * (1 + k * 0.0004 * (i + 1)), Math.random() * 0.5]);
    return { a: mk(1).reverse(), b: mk(-1) };
  }, [Math.round(d.price)]); // eslint-disable-line
  const pct = (p) => (side === "buy" ? setAmt(String(+(usdt * p).toFixed(2))) : setQ(String(+(held * p).toFixed(8))));
  const submit = () => {
    if (side === "buy") {
      const a = +amt;
      if (!(a > 0)) return notify("Enter amount");
      if (a > usdt) return notify("Insufficient USDT");
      W.set((w) => ({ ...w, USDT: w.USDT - a, [sym]: (w[sym] || 0) + a / d.price }));
    } else {
      const n = +q;
      if (!(n > 0)) return notify("Enter quantity");
      if (n > held) return notify("Insufficient " + sym);
      W.set((w) => ({ ...w, USDT: w.USDT + n * d.price, [sym]: w[sym] - n }));
    }
    setAmt(""); setQ(""); notify("Order filled");
  };
  const R = ({ r, c }) => <div className="cxa-bk"><b style={{ color: c, fontWeight: 400 }}>{r[0].toFixed(6)}</b><span>{r[1].toFixed(6)}</span></div>;
  return (
    <>
      <div className="cxa-top">
        <button onClick={() => setPick(true)}>☰ <b>{sym}/USDT</b> <small style={{ color: d.chg >= 0 ? GREEN : RED }}>{d.chg.toFixed(2)} %</small></button>
        <button onClick={() => go("options")}>📊</button>
      </div>
      <div className="cxa-ex">
        <div>
          <div className="cxa-bk"><small>Price</small><small>Quantity</small></div>
          {book.a.map((r, i) => <R key={i} r={r} c={RED} />)}
          <div className="cxa-mid" style={{ color: d.chg >= 0 ? GREEN : RED }}>{d.price.toFixed(8)}<br /><small style={{ fontSize: 12 }}>≈ {d.price.toFixed(2)}</small></div>
          {book.b.map((r, i) => <R key={i} r={r} c={GREEN} />)}
        </div>
        <div>
          <div className="cxa-bs">
            <button className={"b" + (side === "buy" ? " on" : "")} onClick={() => setSide("buy")}>Buy</button>
            <button className={"s" + (side === "sell" ? " on" : "")} onClick={() => setSide("sell")}>Sell</button>
          </div>
          <div style={{ padding: "14px 0", display: "flex", justifyContent: "space-between" }}>Limit price <span>⌄</span></div>
          <div className="cxa-in"><input readOnly value={fmt(d.price)} /><button>+</button><button>−</button></div>
          <small>≈ {d.price.toFixed(2)}</small>
          <div className="cxa-in"><input placeholder="Quantity" value={q} onChange={(e) => setQ(e.target.value)} /><small>{sym}</small></div>
          <small>Available {side === "buy" ? usdt.toFixed(8) + " USDT" : held.toFixed(8) + " " + sym}</small>
          <div className="cxa-pc">{[0.25, 0.5, 0.75, 1].map((p) => <button key={p} onClick={() => pct(p)}>{p * 100}%</button>)}</div>
          <div className="cxa-in"><input placeholder="Trade amount" value={amt} onChange={(e) => setAmt(e.target.value)} /><small>USDT</small></div>
          <button className="cxa-cta" style={{ background: side === "buy" ? "#08a876" : RED }} onClick={submit}>{side === "buy" ? "Buy" : "Sell"} {sym}</button>
        </div>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--ln)" }}>
        <span style={{ fontSize: 18 }}>Current entrust <small style={{ color: "#4a90e2" }}>Buy ⌄</small></span><small>All</small>
      </div>
      {pick && <Drawer P={P} onClose={() => setPick(false)} onPick={(s) => { setSym(s); setPick(false); }} />}
    </>
  );
}

/* ---------------- Candle chart (কৃত্রিম ডেটা) ---------------- */
function Chart({ sym, price }) {
  const cs = useMemo(() => {
    let seed = sym.charCodeAt(0) * 97 + sym.length;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let c = price; const a = [];
    for (let i = 0; i < 70; i++) {
      const o = c / (1 + (r() - 0.5) * 0.05), h = Math.max(o, c) * (1 + r() * 0.01), l = Math.min(o, c) * (1 - r() * 0.01);
      a.unshift({ o, h, l, c, v: r() }); c = o;
    }
    return a;
  }, [sym]); // eslint-disable-line
  const a = cs.slice(), L = a[a.length - 1];
  a[a.length - 1] = { ...L, c: price, h: Math.max(L.h, price), l: Math.min(L.l, price) };
  const hi = Math.max(...a.map((x) => x.h)) * 1.02, lo = Math.min(...a.map((x) => x.l)) * 0.98;
  const y = (p) => ((hi - p) / (hi - lo)) * 220, W = 300, st = W / 70;
  return (
    <svg viewBox="0 0 360 340" width="100%" style={{ background: "#10141f", display: "block" }}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
        <g key={k}><line x1="0" x2={W} y1={k * 31} y2={k * 31} stroke="#1f2633" /><text x={W + 6} y={k * 31 + 4} fill="#aab" fontSize="10">{fmt(hi - ((hi - lo) * k) / 7)}</text></g>
      ))}
      {a.map((c, k) => {
        const u = c.c >= c.o, col = u ? "#2ebd85" : "#e5484d", x = k * st + st / 2;
        return (
          <g key={k}>
            <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke={col} />
            <rect x={x - st * 0.35} y={y(Math.max(c.o, c.c))} width={st * 0.7} height={Math.max(1.5, Math.abs(y(c.o) - y(c.c)))} fill={col} />
            <rect x={x - st * 0.35} y={330 - c.v * 80} width={st * 0.7} height={c.v * 80} fill={col} opacity=".4" />
          </g>
        );
      })}
      <line x1="0" x2={W} y1={y(price)} y2={y(price)} stroke="#e5484d" strokeDasharray="2 3" />
      <rect x={W} y={y(price) - 9} width="60" height="18" fill="#e5484d" />
      <text x={W + 4} y={y(price) + 4} fontSize="10" fill="#fff">{fmt(price)}</text>
      <text x="8" y="14" fill="#e5484d" fontSize="10">{sym.toLowerCase()}usdt, D  C{fmt(price)}</text>
    </svg>
  );
}

/* ---------------- Options (long / short) ---------------- */
function Options({ P, W, sym, setSym, pos, setPos, orders, setOrders, notify }) {
  const [qty, setQty] = useState(10), [sec, setSec] = useState(20), [sheet, setSheet] = useState(false);
  const [view, setView] = useState("k"), [pt, setPt] = useState("list"), [pick, setPick] = useState(false), [, tick] = useState(0);
  const d = P[sym];
  useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(id); }, []);
  const open = (dir) => {
    if (qty < 10) return notify("Min 10 USDT");
    if (qty > (W.w.USDT || 0)) return notify("Insufficient balance");
    const id = Date.now(), op = d.price;
    W.set((w) => ({ ...w, USDT: w.USDT - qty }));
    setPos((p) => [...p, { id, sym, dir, qty, op, end: id + sec * 1000 }]);
    setSheet(false); notify("Position opened");
    setTimeout(() => {
      const c = LIVE[sym].price, win = dir === "long" ? c > op : c < op, pnl = win ? qty * YIELD : -qty;
      W.set((w) => ({ ...w, USDT: w.USDT + (win ? qty + pnl : 0) }));
      setPos((p) => p.filter((x) => x.id !== id));
      setOrders((o) => [{ id, sym, dir, qty, op, close: c, pnl }, ...o]);
      notify(win ? "Position won +" + pnl.toFixed(2) : "Position lost " + pnl.toFixed(2));
    }, sec * 1000);
  };
  return (
    <>
      <div className="cxa-top">
        <button onClick={() => setPick(true)}>☰ <b>{sym}/USDT</b></button>
        <button onClick={() => setView(view === "k" ? "p" : "k")}>{view === "k" ? "Positions 📝" : "K-line 📊"}</button>
      </div>
      {view === "k" ? (
        <>
          <div className="cxa-chead">
            <b style={{ fontSize: 20, color: d.chg >= 0 ? GREEN : RED }}>{d.price.toFixed(6)}<br /><small style={{ fontSize: 13, color: d.chg >= 0 ? GREEN : RED }}>{d.chg.toFixed(2)} %</small></b>
            <div style={{ textAlign: "right", fontSize: 13 }}><small>High </small>{fmt(d.price * 1.04)}<br /><small>Low </small>{fmt(d.price * 0.97)}<br /><small>24H volume </small>{d.vol.toFixed(2)}</div>
          </div>
          <Chart sym={sym} price={d.price} />
          <div className="cxa-obar">
            <button className="q" onClick={() => setSheet(true)}>Quantity ⌄<b>{qty.toFixed(2)}</b></button>
            <button className="q" onClick={() => setSheet(true)}>Time ⌄<b>{sec}s</b></button>
            <button className="g" onClick={() => open("long")}>Buy Long</button>
            <button className="r" onClick={() => open("short")}>Sell Short</button>
          </div>
        </>
      ) : (
        <>
          <div className="cxa-tabs"><button className={pt === "list" ? "on" : ""} onClick={() => setPt("list")}>Positions</button><button className={pt === "rec" ? "on" : ""} onClick={() => setPt("rec")}>Order records</button></div>
          <div className="cxa-tb" style={{ color: "var(--mut)" }}><span>Quantity</span><span>Open</span><span>Final</span><span>P&amp;L</span></div>
          {pt === "list" && pos.map((p) => {
            const c = P[p.sym].price, w = p.dir === "long" ? c > p.op : c < p.op;
            return (
              <div key={p.id} className="cxa-tb">
                <span>{p.qty}<br /><small>{p.sym} · {p.dir} · {Math.max(0, Math.ceil((p.end - Date.now()) / 1000))}s</small></span>
                <span>{fmt(p.op)}</span><span>{fmt(c)}</span>
                <span style={{ color: w ? GREEN : RED }}>{w ? "+" + (p.qty * YIELD).toFixed(2) : "-" + p.qty.toFixed(2)}</span>
              </div>
            );
          })}
          {pt === "rec" && orders.map((o) => (
            <div key={o.id} className="cxa-tb">
              <span>{o.qty}<br /><small>{o.sym} · {o.dir}</small></span>
              <span>{fmt(o.op)}</span><span>{fmt(o.close)}</span>
              <span style={{ color: o.pnl >= 0 ? GREEN : RED }}>{o.pnl.toFixed(2)}</span>
            </div>
          ))}
          {((pt === "list" && !pos.length) || (pt === "rec" && !orders.length)) && <div className="cxa-empty">No records</div>}
        </>
      )}
      {sheet && (
        <div className="cxa-over" onClick={() => setSheet(false)}>
          <div className="cxa-sheet" onClick={(e) => e.stopPropagation()}>
            <small>Quantity</small>
            <div className="cxa-chs">{[10, 50, 100, 500, 1000].map((x) => <button key={x} className={qty === x ? "on" : ""} onClick={() => setQty(x)}>{x.toFixed(2)}</button>)}</div>
            <div className="cxa-in"><input value={qty} onChange={(e) => setQty(+e.target.value || 0)} /><button onClick={() => setQty(Math.floor(W.w.USDT || 0))}>All</button></div>
            <small>Time</small>
            <div className="cxa-chs">{[20, 30, 60, 120, 180].map((x) => <button key={x} className={sec === x ? "on" : ""} onClick={() => setSec(x)}>{x}s</button>)}</div>
            <p><small>Balance : {(W.w.USDT || 0).toFixed(8)} · Yield : {YIELD * 100}%</small></p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button style={{ background: GREEN, padding: 14, borderRadius: 6 }} onClick={() => open("long")}>Buy Long</button>
              <button style={{ background: RED, padding: 14, borderRadius: 6 }} onClick={() => open("short")}>Sell Short</button>
            </div>
          </div>
        </div>
      )}
      {pick && <Drawer P={P} onClose={() => setPick(false)} onPick={(s) => { setSym(s); setPick(false); }} />}
    </>
  );
}

/* ---------------- Assets ---------------- */
function Assets({ P, W, notify }) {
  const [tab, setTab] = useState("assets"), [add, setAdd] = useState(""), [hide, setHide] = useState(false);
  const val = (s, q) => (s === "USDT" || s === "USDC" ? q : q * (P[s]?.price || 0));
  const total = Object.entries(W.w).reduce((x, [s, q]) => x + val(s, q), 0);
  const T = [["assets", "Assets"], ["funds", "Funds"], ["options", "Options"], ["quant", "Quant trading"]];
  const N = { ta: "Total assets converted", funds: "Funds converted", options: "Options converted", quant: "Quant trading converted" };
  const sub = tab !== "assets", tv = tab === "funds" ? total : 0;
  return (
    <>
      <div className="cxa-tabs">{T.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      {!sub ? (
        <div className="cxa-cards">{[["ta", total], ["funds", total], ["options", 0], ["quant", 0]].map(([k, v]) => (
          <div key={k} className="cxa-ac"><h3>{N[k]}</h3><small>Available</small><div>{v.toFixed(2)}</div></div>
        ))}</div>
      ) : (
        <>
          <div className="cxa-sum">
            <h2>{N[tab]} <small>Total assets converted($)</small></h2>
            <button style={{ position: "absolute", right: 20, top: 16 }} onClick={() => setHide(!hide)}>👁</button>
            <b>$ {hide ? "••••••" : tv.toFixed(8)}</b><br /><small>≈ $ {tv.toFixed(2)}</small>
          </div>
          <div className="cxa-cards" style={{ background: "#0a131d" }}>
            {["USDT", "USDC", "ETH", "BTC", "DOGE", "XRP", "SOL", "PYUSD"].map((s) => {
              const q = tab === "funds" ? W.w[s] || 0 : 0;
              return (
                <div key={s} className="cxa-ac"><h3>{s}</h3>
                  <div className="c3"><span><small>Available</small>{q.toFixed(8)}</span><span><small>Frozen</small>0.00000000</span><span style={{ textAlign: "right" }}><small>Converted($)</small>$ {val(s, q).toFixed(2)}</span></div>
                </div>
              );
            })}
          </div>
          {tab === "funds" && (
            <div className="cxa-ac" style={{ margin: 14 }}>
              <b>Demo top-up</b>
              <div className="cxa-in"><input placeholder="Amount (USDT)" value={add} onChange={(e) => setAdd(e.target.value)} />
                <button style={{ color: "var(--blue)" }} onClick={() => { const a = +add; if (a > 0) { W.set((w) => ({ ...w, USDT: (w.USDT || 0) + a })); setAdd(""); notify("Demo funds added"); } }}>Add</button></div>
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ---------------- Deposit / Withdraw (ডেমো) ---------------- */
function Pay({ kind, W, go, notify }) {
  const [c, setC] = useState("USDT"), [a, setA] = useState(""), [ad, setAd] = useState("");
  const dep = kind === "deposit";
  const run = () => {
    const n = +a;
    if (!(n > 0)) return notify("Enter amount");
    if (dep) W.set((w) => ({ ...w, [c]: (w[c] || 0) + n }));
    else {
      if (!/^[A-Za-z0-9]{20,100}$/.test(ad)) return notify("Invalid address");
      if (n > (W.w[c] || 0)) return notify("Insufficient balance");
      W.set((w) => ({ ...w, [c]: w[c] - n }));
    }
    setA(""); notify(dep ? "Deposit successful (demo)" : "Withdrawal submitted (demo)");
  };
  return (
    <>
      <div className="cxa-top"><button onClick={() => go("home")}>‹</button><h1>{dep ? "Recharge" : "Withdraw"}</h1><span /></div>
      <div className="cxa-form">
        <small>Coin</small>
        <div className="cxa-chs">{["USDT", "USDC", "ETH", "BTC"].map((x) => <button key={x} className={c === x ? "on" : ""} onClick={() => setC(x)}>{x}</button>)}</div>
        {!dep && <><small>Address</small><div className="cxa-in"><input placeholder="Withdrawal address" value={ad} onChange={(e) => setAd(e.target.value)} /></div></>}
        <small>Amount</small>
        <div className="cxa-in"><input placeholder="Amount" value={a} onChange={(e) => setA(e.target.value)} /><small>{c}</small></div>
        <small>Demo only — no real funds are moved.</small>
      </div>
      <button className="cxa-btn" onClick={run}>Submit</button>
    </>
  );
}

/* ---------------- Side menu ---------------- */
function Menu({ me, onClose, logout, notify, go }) {
  const R = [["🪪", "Authentication", "Under review", 1], ["📍", "Bind withdrawal address", "", 0, () => { onClose(); go("withdraw"); }], ["↗", "My sharing link", "", 0, () => notify("Link copied")], ["🔔", "System message", "", 0, () => notify("No messages")], ["🌙", "Night mode", "sw"], ["🔒", "Security", "Not set", 1], ["👤", "Website Introduction", ""]];
  return (
    <div className="cxa-over" onClick={onClose}>
      <aside style={{ width: "70%", maxWidth: 340, height: "100%", background: "var(--card)", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="cxa-mp"><p>{me.email}</p><p>UID:{me.uid}</p><p>VIP:1</p><p style={{ margin: 0 }}>Reputation score : 100</p></div>
        {R.map(([ic, l, v, red, fn]) => (
          <button key={l} className="cxa-mr" onClick={fn || (() => notify("Demo"))}>
            <span style={{ color: "var(--blue)" }}>{ic}</span><span className="l">{l}</span>
            {v === "sw" ? <span className="cxa-sw"><i /></span> : <>{v && <span style={{ color: red ? "#ff4d5e" : "inherit" }}>{v}</span>}<small>›</small></>}
          </button>
        ))}
        <button className="cxa-btn" onClick={() => { onClose(); logout(); }}>Log out</button>
      </aside>
    </div>
  );
}

/* ---------------- App (root) ---------------- */
export default function CexApp() {
  const P = usePrices();
  const [me, setMe] = useState(null), [auth, setAuth] = useState("login"), [page, setPage] = useState("home"), [sym, setSym] = useState("BTC");
  const [w, setW] = useState({ USDT: 0 }), [pos, setPos] = useState([]), [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState(false), [toast, setToast] = useState(""), [lang, setLang] = useState("English");
  const notify = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };
  const W = { w, set: setW };
  const go = (p, s) => { if (s) setSym(s); setPage(p); window.scrollTo(0, 0); };
  const nav = [["home", "⌂", "Home"], ["market", "📶", "Market"], ["exchange", "↻", "Trade"], ["options", "📄", "Options"], ["assets", "👛", "Assets"]];

  return (
    <>
      <style>{CSS}</style>
      {!me ? (
        <Auth mode={auth} go={setAuth} onLogin={(u) => { setMe(u); setPage("home"); }} />
      ) : (
        <div className="cxa-app">
          {page === "home" && <Home P={P} go={go} onMenu={() => setMenu(true)} lang={lang} setLang={setLang} />}
          {page === "market" && <Market P={P} go={go} />}
          {page === "exchange" && <Exchange P={P} W={W} sym={sym} setSym={setSym} go={go} notify={notify} />}
          {page === "options" && <Options P={P} W={W} sym={sym} setSym={setSym} pos={pos} setPos={setPos} orders={orders} setOrders={setOrders} notify={notify} />}
          {page === "assets" && <Assets P={P} W={W} notify={notify} />}
          {(page === "deposit" || page === "withdraw") && <Pay kind={page} W={W} go={go} notify={notify} />}
          {menu && <Menu me={me} onClose={() => setMenu(false)} logout={() => { setMe(null); setAuth("login"); }} notify={notify} go={go} />}
          {toast && <div className="cxa-toast">{toast}</div>}
          {page !== "options" && (
            <nav className="cxa-nav">
              {nav.map(([k, ic, l]) => <button key={k} className={page === k ? "on" : ""} onClick={() => go(k)}><span>{ic}</span>{l}</button>)}
            </nav>
          )}
        </div>
      )}
    </>
  );
}

/* ---------------- CSS (সব স্টাইল এই ফাইলেই) ---------------- */
const CSS = `
:root{--bg:#0b1622;--card:#112030;--ln:#2a3a4a;--blue:#1a7fd8;--mut:#8b9aa8}
body{margin:0;background:#070e16;color:#fff;font-family:Roboto,system-ui,sans-serif;font-size:15px}
.cxa-app,.cxa-app *{box-sizing:border-box}
.cxa-app button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.cxa-app input{font:inherit;color:#fff;background:none;border:0;outline:0}
.cxa-app small{color:var(--mut)}
.cxa-app{max-width:480px;margin:0 auto;min-height:100vh;background:var(--bg);position:relative;padding-bottom:70px;color:#fff}
.cxa-top{display:flex;align-items:center;justify-content:space-between;height:46px;padding:0 14px;border-bottom:1px solid var(--ln);background:var(--card)}
.cxa-top h1{font-size:16px;font-weight:500;margin:0}
.cxa-logo{width:34px;height:34px;background:#fff!important;border-radius:4px;display:grid;place-items:center}
.cxa-lang{position:relative}.cxa-lang>button{display:flex;gap:8px;align-items:center}
.cxa-lm{position:absolute;right:0;top:34px;width:125px;max-height:420px;overflow:auto;background:#fff;color:#111;z-index:30}
.cxa-lm button{display:block;width:100%;text-align:left;padding:10px 6px;color:#111!important}
.cxa-ban{height:180px;overflow:hidden;position:relative;background:linear-gradient(120deg,#0a1a2a,#1b3a52 60%,#7a5a1a)}
.cxa-ban h2{margin:0;position:absolute;left:34px;top:50px;font-size:26px;line-height:1.1;text-shadow:0 2px 8px #000}
.cxa-ban h2 b{color:#f5a623;display:block}
.cxa-dots{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:6px}
.cxa-dots i{width:7px;height:7px;border-radius:50%;background:#888}.cxa-dots i.on{background:#fff}
.cxa-tk{display:flex;justify-content:space-around;text-align:center;padding:26px 0 22px;background:#0f1d2b}
.cxa-tk b{display:block;font-size:20px;margin:6px 0 2px}.cxa-tk span{font-weight:600;color:#aab}
.cxa-qa{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:6px 16px 14px;background:#0b1622}
.cxa-qa button{display:flex;gap:10px;align-items:center;background:var(--card)!important;padding:11px 10px;border-radius:6px;font-size:13px;font-weight:600}
.cxa-qa i{color:#2fd0e0;font-style:normal;font-size:20px}
.cxa-th{display:grid;grid-template-columns:1.3fr 1.2fr 1fr;padding:8px 10px;color:var(--mut);font-size:13px;border-top:1px solid var(--ln)}
.cxa-sec{padding:10px;font-weight:700;background:#0b1622}
.cxa-row{display:grid;grid-template-columns:1.3fr 1.2fr 1fr;align-items:center;width:100%;padding:12px 10px;border-top:1px solid var(--ln)!important;text-align:left}
.cxa-row .nm{display:flex;align-items:center;gap:8px;font-size:18px}.cxa-row .nm small{font-size:14px}
.cxa-row b{font-weight:500;font-size:18px}
.cxa-pill{justify-self:end;width:80px;padding:8px 0;text-align:center;border-radius:4px;font-size:14px;font-weight:600}
.cxa-coin{display:grid;place-items:center;border-radius:50%;color:#fff;font-weight:700;flex:none}
.cxa-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;display:grid;grid-template-columns:repeat(5,1fr);background:#0f1b28;border-top:1px solid var(--ln);padding:6px 0;z-index:20}
.cxa-nav button{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:12px;font-weight:600}
.cxa-nav button span{font-size:22px;opacity:.55}.cxa-nav .on{color:var(--blue)}.cxa-nav .on span{opacity:1}
.cxa-tabs{display:flex;justify-content:space-around;border-bottom:1px solid var(--ln);background:var(--card)}
.cxa-tabs button{padding:13px 8px;color:var(--mut)!important;border-bottom:2px solid transparent!important}
.cxa-tabs .on{color:#fff!important;border-color:var(--blue)!important}
.cxa-cards{padding:14px;display:flex;flex-direction:column;gap:14px}
.cxa-ac{background:var(--card);border-radius:6px;padding:16px 20px}.cxa-ac h3{margin:0 0 10px;color:var(--blue);font-size:17px}
.cxa-ac .c3{display:flex;justify-content:space-between}.cxa-ac .c3 span{display:block;font-size:15px}.cxa-ac .c3 small{display:block;font-size:13px}
.cxa-sum{padding:14px 26px;background:var(--card);position:relative}.cxa-sum h2{margin:0 0 6px;font-size:18px;font-weight:400}.cxa-sum h2 small{color:#fff;font-size:13px}
.cxa-form{padding:16px}
.cxa-fc{background:var(--card);padding:0 16px}
.cxa-fi{display:block;width:100%;padding:14px 0;border-bottom:1px solid var(--ln)!important}
.cxa-btn{display:block;width:calc(100% - 32px);margin:16px;padding:14px;border-radius:8px;background:#1a82d8!important;text-align:center;font-size:15px}
.cxa-links{display:flex;justify-content:space-between;padding:0 20px;color:var(--blue)}
.cxa-msg{margin:10px 16px;color:#00c087;font-size:14px}.cxa-msg.bad{color:#ff3b4f}
.cxa-ex{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:14px 10px}
.cxa-bk{display:flex;justify-content:space-between;font-size:12px;padding:12px 4px}
.cxa-mid{font-size:22px;padding:10px 4px}
.cxa-bs{display:grid;grid-template-columns:1fr 1fr}.cxa-bs button{padding:14px;background:#0d1620!important}
.cxa-bs .on.b{background:#08a876!important}.cxa-bs .on.s{background:#d94f5c!important}
.cxa-in{display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--ln);padding:8px 0;margin:10px 0 4px}.cxa-in input{flex:1;min-width:0}
.cxa-pc{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:10px 0}.cxa-pc button{border:1px solid var(--ln)!important;padding:6px 0;font-size:12px}
.cxa-cta{width:100%;padding:14px;margin-top:14px;font-size:15px}
.cxa-chead{display:flex;justify-content:space-between;padding:14px 16px;background:var(--card)}
.cxa-obar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;display:grid;grid-template-columns:1fr 1fr 1.3fr 1.3fr;gap:10px;align-items:center;padding:8px 10px;background:var(--card);z-index:25}
.cxa-obar .g,.cxa-obar .r{padding:14px 0;border-radius:6px}.cxa-obar .g{background:#00c087!important}.cxa-obar .r{background:#d94f5c!important}
.cxa-obar .q{font-size:14px;text-align:center}.cxa-obar .q b{display:block;font-weight:400}
.cxa-over{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:50}
.cxa-drawer{width:70%;max-width:340px;height:100%;background:var(--card);padding:10px 0;overflow:auto}
.cxa-drawer h2{font-weight:400;font-size:19px;margin:14px 12px}.cxa-drawer h3{color:var(--blue);margin:20px 12px}
.cxa-drawer button{display:flex;justify-content:space-between;width:calc(100% - 24px);margin:0 12px;padding:15px 0;border-bottom:1px solid var(--ln)!important}
.cxa-sheet{position:absolute;bottom:0;width:100%;background:var(--card);padding:16px}
.cxa-chs{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.cxa-chs button{border:1px solid var(--ln)!important;padding:8px 14px}.cxa-chs .on{border-color:var(--blue)!important;color:var(--blue)}
.cxa-mp{padding:36px 16px 14px;border-bottom:1px solid var(--ln)}.cxa-mp p{margin:0 0 10px}
.cxa-mr{display:flex;align-items:center;gap:14px;width:100%;padding:13px 16px;border-bottom:1px solid var(--ln)!important}.cxa-mr .l{flex:1;text-align:left}
.cxa-sw{width:50px;height:26px;border-radius:13px;background:var(--blue);position:relative}.cxa-sw i{position:absolute;right:2px;top:2px;width:22px;height:22px;border-radius:50%;background:#fff}
.cxa-toast{position:fixed;top:70px;left:50%;transform:translateX(-50%);background:#222c38;padding:10px 18px;border-radius:8px;z-index:90}
.cxa-tb{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;padding:12px 14px;border-bottom:1px solid var(--ln);font-size:13px}
.cxa-empty{text-align:center;color:var(--mut);padding:60px 0}
`;
