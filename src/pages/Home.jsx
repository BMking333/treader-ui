import React, { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/*  CryptoWorld — Home.jsx (mobile-first, dark, no extra dependencies)  */
/*  Features: Login/Signup modal, live prices (Binance public API),     */
/*  favorites, search, announcements, FAQ, referral, footer.            */
/*                                                                      */
/*  Props:                                                              */
/*   onNavigate(page, symbol)  -> your router                           */
/*   onLogin({identifier,password})  -> Promise<user>   (optional)      */
/*   onSignup({identifier,password,referral}) -> Promise<user> (opt.)   */
/*   onLogout() (optional)                                              */
/* ------------------------------------------------------------------ */

const BRAND = "CryptoWorld";

const PAIRS = [
  { s: "BTC", n: "Bitcoin", c: "#f7931a" },
  { s: "ETH", n: "Ethereum", c: "#627eea" },
  { s: "XRP", n: "Ripple", c: "#3b4350" },
  { s: "ADA", n: "Cardano", c: "#0a4bd6" },
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
  { t: "Trade Crypto Like a Pro", d: "100+ pairs, deep liquidity and instant execution.", g: "linear-gradient(120deg,#0b1220 0%,#0f2a43 55%,#10695c 100%)", cta: "Start Trading", go: "trade" },
  { t: "Flash Swap — Zero Fees", d: "Convert between assets in one tap at the best rate.", g: "linear-gradient(120deg,#1a1033 0%,#33206b 55%,#6a3df0 100%)", cta: "Swap Now", go: "swap" },
  { t: "Invite Friends, Earn More", d: "Share your referral code and get rewarded on every trade.", g: "linear-gradient(120deg,#2b1405 0%,#6b3a0b 55%,#f7931a 100%)", cta: "Invite Now", go: "invite" },
];

const ACTIONS = [
  { k: "recharge", l: "Deposit", p: "M12 5v14M5 12h14" },
  { k: "withdraw", l: "Withdraw", p: "M12 19V5M6 11l6-6 6 6" },
  { k: "swap", l: "Flash Swap", p: "M7 7h11l-3-3M17 17H6l3 3" },
  { k: "transfer", l: "Transfer", p: "M4 8h16M16 4l4 4-4 4M20 16H4M8 12l-4 4 4 4" },
  { k: "loan", l: "Boost Loan", p: "M12 3v12M7 11l5 5 5-5M5 21h14" },
  { k: "support", l: "Support", p: "M4 5h16v11H9l-5 4z" },
];

const FEATURES = [
  { t: "Bank-grade Security", d: "2FA, cold storage and real-time risk monitoring.", p: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" },
  { t: "Lightning Fast", d: "Orders matched in milliseconds with deep liquidity.", p: "M13 2L4 14h7l-1 8 9-12h-7z" },
  { t: "Low Fees", d: "Transparent, competitive pricing on every trade.", p: "M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { t: "24/7 Support", d: "Our team is always available to help you.", p: "M4 5h16v11H9l-5 4z" },
];

const FAQ = [
  ["How do I start trading on CryptoWorld?", "Create a free account, deposit funds from the Deposit page, then open the Trade tab and pick any pair."],
  ["Are my funds safe?", "We use two-factor authentication, cold-storage for the majority of assets and continuous monitoring."],
  ["How long do withdrawals take?", "Most withdrawals are processed within minutes. Network congestion may add some delay."],
  ["What is Flash Swap?", "Flash Swap lets you convert one asset to another instantly at a quoted rate, without placing an order."],
];

const ANNOUNCEMENTS = [
  "Welcome to CryptoWorld — secure, fast and simple crypto trading.",
  "New: Flash Swap now supports 100+ assets with zero fees.",
  "Complete verification to unlock higher withdrawal limits.",
];

const TABS = ["Hot", "Gainers", "Losers", "Volume", "Favorites"];
const PROTECTED = ["recharge", "withdraw", "swap", "transfer", "loan", "trade", "options", "assets", "invite"];

/* ------------------------------ helpers ------------------------------ */
const fmtPrice = (p) => {
  if (p >= 1000) return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(4);
  if (p >= 0.01) return p.toFixed(6);
  return p.toFixed(8);
};
const fmtVol = (v) =>
  v >= 1e9 ? (v / 1e9).toFixed(2) + "B" : v >= 1e6 ? (v / 1e6).toFixed(2) + "M" : v >= 1e3 ? (v / 1e3).toFixed(1) + "K" : v.toFixed(0);

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

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isPhone = (s) => /^\+?\d{9,15}$/.test(s.replace(/[\s-]/g, ""));

function strength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

/* ------------------------------ small parts ------------------------------ */
function Icon({ d, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function CoinIcon({ s, c }) {
  return <span className="cw-coin" style={{ background: c }}>{s.slice(0, 1)}</span>;
}

/* ------------------------------ Auth modal ------------------------------ */
function AuthModal({ mode, setMode, onClose, onSuccess, onLogin, onSignup }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [ref, setRef] = useState("");
  const [agree, setAgree] = useState(true);
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";
  const st = strength(pw);

  useEffect(() => { setErr(""); }, [mode]);
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    const clean = id.trim();
    if (!isEmail(clean) && !isPhone(clean)) return setErr("Enter a valid email or phone number.");
    if (pw.length < 6) return setErr("Password must be at least 6 characters.");
    if (signup) {
      if (st < 2) return setErr("Password is too weak. Use letters, numbers and 8+ characters.");
      if (pw !== pw2) return setErr("Passwords do not match.");
      if (!agree) return setErr("Please accept the Terms & Privacy Policy.");
    }
    setBusy(true);
    setErr("");
    try {
      const payload = { identifier: clean, password: pw, referral: ref.trim() };
      let user;
      if (signup && onSignup) user = await onSignup(payload);
      else if (!signup && onLogin) user = await onLogin(payload);
      else {
        await new Promise((r) => setTimeout(r, 600)); // demo mode
        user = { id: Date.now(), name: clean.includes("@") ? clean.split("@")[0] : clean, identifier: clean };
      }
      onSuccess(user);
    } catch (ex) {
      setErr(ex?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cw-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="cw-modal" onSubmit={submit} noValidate>
        <button type="button" className="cw-x" onClick={onClose} aria-label="Close">✕</button>
        <div className="cw-modal-logo"><span className="cw-logo-mark">C</span></div>
        <h3>{signup ? "Create your account" : "Welcome back"}</h3>
        <p className="cw-sub">{signup ? `Join ${BRAND} and start trading in minutes.` : `Log in to your ${BRAND} account.`}</p>

        <div className="cw-seg">
          <button type="button" className={!signup ? "on" : ""} onClick={() => setMode("login")}>Login</button>
          <button type="button" className={signup ? "on" : ""} onClick={() => setMode("signup")}>Sign up</button>
        </div>

        <label className="cw-field">
          <span>Email or phone</span>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="you@example.com" autoComplete="username" inputMode="email" />
        </label>

        <label className="cw-field">
          <span>Password</span>
          <div className="cw-pw">
            <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete={signup ? "new-password" : "current-password"} />
            <button type="button" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
          </div>
        </label>

        {signup && (
          <>
            <div className="cw-meter">
              {[0, 1, 2, 3].map((i) => <i key={i} className={i < st ? `s${st}` : ""} />)}
              <small>{["", "Weak", "Fair", "Good", "Strong"][st] || "Weak"}</small>
            </div>
            <label className="cw-field">
              <span>Confirm password</span>
              <input type={show ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
            </label>
            <label className="cw-field">
              <span>Referral code (optional)</span>
              <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Enter code" />
            </label>
            <label className="cw-check">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>I agree to the <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a></span>
            </label>
          </>
        )}

        {!signup && <div className="cw-forgot"><a href="#forgot">Forgot password?</a></div>}
        {err && <div className="cw-err" role="alert">{err}</div>}

        <button className="cw-btn primary cw-full" disabled={busy}>
          {busy ? "Please wait…" : signup ? "Create account" : "Log in"}
        </button>

        <p className="cw-switch">
          {signup ? "Already have an account?" : "New to CryptoWorld?"}{" "}
          <button type="button" onClick={() => setMode(signup ? "login" : "signup")}>{signup ? "Log in" : "Sign up"}</button>
        </p>
      </form>
    </div>
  );
}

/* ------------------------------ Home ------------------------------ */
export default function Home({ onNavigate = () => {}, onLogin, onSignup, onLogout }) {
  const [data, setData] = useState(() =>
    Object.fromEntries(Object.entries(FALLBACK).map(([k, v]) => [k, { price: v[0], chg: v[1], vol: v[2] }]))
  );
  const [live, setLive] = useState(false);
  const [tab, setTab] = useState("Hot");
  const [q, setQ] = useState("");
  const [slide, setSlide] = useState(0);
  const [hide, setHide] = useState(false);
  const [user, setUser] = useState(() => store.get("cw_user", null));
  const [fav, setFav] = useState(() => store.get("cw_fav", ["BTC", "ETH"]));
  const [auth, setAuth] = useState(null); // null | "login" | "signup"
  const [menu, setMenu] = useState(false);
  const [faq, setFaq] = useState(-1);
  const [note, setNote] = useState(0);
  const [pending, setPending] = useState(null);

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
          next[t.symbol.replace("USDT", "")] = { price: parseFloat(t.lastPrice), chg: parseFloat(t.priceChangePercent), vol: parseFloat(t.quoteVolume) };
        });
        setData((d) => ({ ...d, ...next }));
        setLive(true);
      } catch {
        setLive(false);
      }
    };
    load();
    const id = setInterval(load, 8000);
    return () => { stop = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % BANNERS.length), 4500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setNote((n) => (n + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { store.set("cw_fav", fav); }, [fav]);

  /* navigation with auth guard */
  const go = (page, sym) => {
    if (page === "support") return onNavigate("support");
    if (PROTECTED.includes(page) && !user) {
      setPending([page, sym]);
      return setAuth("login");
    }
    onNavigate(page, sym);
  };

  const handleSuccess = (u) => {
    setUser(u);
    store.set("cw_user", u);
    setAuth(null);
    if (pending) { onNavigate(pending[0], pending[1]); setPending(null); }
  };

  const logout = async () => {
    try { onLogout && (await onLogout()); } catch {}
    store.del("cw_user");
    setUser(null);
    setMenu(false);
  };

  const toggleFav = (s, e) => {
    e.stopPropagation();
    setFav((f) => (f.includes(s) ? f.filter((x) => x !== s) : [...f, s]));
  };

  const all = useMemo(() => PAIRS.map((p) => ({ ...p, ...data[p.s] })), [data]);

  const rows = useMemo(() => {
    let list = [...all];
    if (tab === "Gainers") list.sort((a, b) => b.chg - a.chg);
    if (tab === "Losers") list.sort((a, b) => a.chg - b.chg);
    if (tab === "Volume") list.sort((a, b) => b.vol - a.vol);
    if (tab === "Favorites") list = list.filter((r) => fav.includes(r.s));
    const s = q.trim().toLowerCase();
    if (s) list = list.filter((r) => r.s.toLowerCase().includes(s) || r.n.toLowerCase().includes(s));
    return list;
  }, [all, tab, q, fav]);

  const gainers = all.filter((r) => r.chg >= 0).length;
  const losers = all.length - gainers;
  const sentiment = Math.round((gainers / all.length) * 100);
  const initial = (user?.name || user?.identifier || "U").slice(0, 1).toUpperCase();
  const tickers = [all[0], data.ETH && { s: "ETH", ...data.ETH }, data.DOGE && { s: "DOGE", ...data.DOGE }, data.BCH && { s: "BCH", ...data.BCH }];

  return (
    <div className="cw">
      <style>{CSS}</style>

      {/* Header */}
      <header className="cw-head">
        <div className="cw-wrap cw-head-in">
          <div className="cw-logo">
            <span className="cw-logo-mark">C</span>
            <span>Crypto<b>World</b></span>
          </div>
          <div className="cw-head-r">
            <span className={`cw-live ${live ? "on" : ""}`}><i /> {live ? "Live" : "Demo"}</span>
            {user ? (
              <div className="cw-user">
                <button className="cw-avatar" onClick={() => setMenu(!menu)} aria-label="Account">{initial}</button>
                {menu && (
                  <div className="cw-menu" onMouseLeave={() => setMenu(false)}>
                    <div className="cw-menu-h">
                      <b>{user.name || "Trader"}</b>
                      <small>{user.identifier}</small>
                    </div>
                    <button onClick={() => { setMenu(false); go("assets"); }}>My Assets</button>
                    <button onClick={() => { setMenu(false); go("invite"); }}>Invite & Earn</button>
                    <button onClick={() => { setMenu(false); onNavigate("support"); }}>Support</button>
                    <button className="out" onClick={logout}>Log out</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className="cw-link" onClick={() => setAuth("login")}>Log in</button>
                <button className="cw-btn primary sm" onClick={() => setAuth("signup")}>Sign up</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="cw-wrap cw-main">
        {/* Announcement */}
        <button className="cw-note" onClick={() => onNavigate("announcements")}>
          <Icon d="M3 11v2a1 1 0 001 1h3l5 4V6L7 10H4a1 1 0 00-1 1zM16 9a4 4 0 010 6" size={16} />
          <span key={note}>{ANNOUNCEMENTS[note]}</span>
        </button>

        {/* Balance / Welcome */}
        <section className="cw-balance">
          {user ? (
            <>
              <div className="cw-bal-top">
                <span>Total Assets (USDT)</span>
                <button onClick={() => setHide(!hide)} className="cw-eye" aria-label="Toggle balance">
                  <Icon d={hide ? "M3 3l18 18M10 6a9 9 0 0111 6 9 9 0 01-2 3M6 7a9 9 0 00-3 5s3 6 9 6a8 8 0 003-1" : "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z"} size={18} />
                </button>
              </div>
              <div className="cw-bal-amt">{hide ? "••••••" : (user.balance ?? 0).toFixed(2)}</div>
              <div className="cw-bal-btns">
                <button className="cw-btn primary" onClick={() => go("recharge")}>Deposit</button>
                <button className="cw-btn ghost" onClick={() => go("trade")}>Trade</button>
              </div>
            </>
          ) : (
            <>
              <h2 className="cw-welcome">Start your crypto journey</h2>
              <p className="cw-sub">Sign up in under a minute and trade 100+ pairs with low fees.</p>
              <div className="cw-bal-btns">
                <button className="cw-btn primary" onClick={() => setAuth("signup")}>Create account</button>
                <button className="cw-btn ghost" onClick={() => setAuth("login")}>Log in</button>
              </div>
            </>
          )}
        </section>

        {/* Banner */}
        <section className="cw-banner">
          <div className="cw-slides" style={{ transform: `translateX(-${slide * 100}%)` }}>
            {BANNERS.map((b, i) => (
              <div key={i} className="cw-slide" style={{ background: b.g }}>
                <h2>{b.t}</h2>
                <p>{b.d}</p>
                <button className="cw-btn light" onClick={() => go(b.go)}>{b.cta}</button>
                <div className="cw-orb" />
              </div>
            ))}
          </div>
          <div className="cw-dots">
            {BANNERS.map((_, i) => <button key={i} className={i === slide ? "on" : ""} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />)}
          </div>
        </section>

        {/* Top tickers */}
        <section className="cw-tickers">
          {tickers.filter(Boolean).map((t) => (
            <button key={t.s} className="cw-ticker" onClick={() => go("trade", t.s)}>
              <span className="cw-tk-pair">{t.s}/USDT</span>
              <span className={`cw-tk-price ${t.chg >= 0 ? "up" : "dn"}`}>{fmtPrice(t.price)}</span>
              <span className={`cw-chip ${t.chg >= 0 ? "up" : "dn"}`}>{t.chg >= 0 ? "+" : ""}{t.chg.toFixed(2)}%</span>
            </button>
          ))}
        </section>

        {/* Quick actions */}
        <section className="cw-actions">
          {ACTIONS.map((a) => (
            <button key={a.k} className="cw-action" onClick={() => go(a.k)}>
              <span className="cw-action-ic"><Icon d={a.p} size={22} /></span>
              <span>{a.l}</span>
            </button>
          ))}
        </section>

        {/* Market sentiment */}
        <section className="cw-sent">
          <div className="cw-sent-h">
            <b>Market Overview</b>
            <span><em className="up">{gainers} up</em> · <em className="dn">{losers} down</em></span>
          </div>
          <div className="cw-bar"><i style={{ width: `${sentiment}%` }} /></div>
          <div className="cw-sent-f">
            <span>Bearish</span>
            <span>{sentiment >= 55 ? "Bullish" : sentiment <= 45 ? "Bearish" : "Neutral"} · {sentiment}%</span>
            <span>Bullish</span>
          </div>
        </section>

        {/* Market list */}
        <section className="cw-market">
          <div className="cw-tabs">
            {TABS.map((t) => <button key={t} className={t === tab ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}
          </div>
          <div className="cw-search">
            <Icon d="M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3" size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search coin (BTC, Ethereum…)" />
            {q && <button onClick={() => setQ("")} aria-label="Clear">✕</button>}
          </div>
          <div className="cw-thead"><span>Name</span><span>Last price</span><span>24h chg</span></div>

          {rows.length === 0 && (
            <div className="cw-empty">{tab === "Favorites" && !q ? "Tap the ☆ next to a coin to add it here." : "No coins found."}</div>
          )}

          {rows.map((r, i) => {
            const up = r.chg >= 0;
            const starred = fav.includes(r.s);
            return (
              <div key={r.s} className="cw-row" role="button" tabIndex={0} onClick={() => go("trade", r.s)} onKeyDown={(e) => e.key === "Enter" && go("trade", r.s)}>
                <div className="cw-name">
                  <button className={`cw-star ${starred ? "on" : ""}`} onClick={(e) => toggleFav(r.s, e)} aria-label="Favorite">{starred ? "★" : "☆"}</button>
                  <CoinIcon s={r.s} c={r.c} />
                  <div>
                    <div className="cw-sym">{r.s}<small>/USDT</small></div>
                    <div className="cw-vol">Vol {fmtVol(r.vol)}</div>
                  </div>
                </div>
                <div className="cw-mid">
                  <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="cw-spark">
                    <polyline points={spark(i + 3, up)} fill="none" stroke={up ? "#0ecb81" : "#f6465d"} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <div className="cw-price">{fmtPrice(r.price)}</div>
                </div>
                <span className={`cw-badge ${up ? "up" : "dn"}`}>{up ? "+" : ""}{r.chg.toFixed(2)}%</span>
              </div>
            );
          })}
          <button className="cw-viewall" onClick={() => onNavigate("market")}>View all markets ›</button>
        </section>

        {/* Why us */}
        <section>
          <h3 className="cw-h">Why {BRAND}</h3>
          <div className="cw-feat">
            {FEATURES.map((f) => (
              <div key={f.t} className="cw-feat-c">
                <span className="cw-action-ic"><Icon d={f.p} size={22} /></span>
                <b>{f.t}</b>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Referral */}
        <section className="cw-ref">
          <div>
            <b>Invite friends, earn rewards</b>
            <p>Share your referral code and earn a commission on your friends' trades.</p>
          </div>
          <button className="cw-btn primary sm" onClick={() => go("invite")}>Invite</button>
        </section>

        {/* FAQ */}
        <section>
          <h3 className="cw-h">Frequently asked questions</h3>
          <div className="cw-faq">
            {FAQ.map(([qq, a], i) => (
              <div key={i} className={`cw-faq-i ${faq === i ? "open" : ""}`}>
                <button onClick={() => setFaq(faq === i ? -1 : i)}>
                  <span>{qq}</span><i>{faq === i ? "−" : "+"}</i>
                </button>
                {faq === i && <p>{a}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="cw-foot">
          <div className="cw-logo"><span className="cw-logo-mark">C</span><span>Crypto<b>World</b></span></div>
          <div className="cw-foot-l">
            <a href="#about">About</a><a href="#terms">Terms</a><a href="#privacy">Privacy</a><a href="#support">Support</a>
          </div>
          <small>© {new Date().getFullYear()} {BRAND}. Trading digital assets involves risk. Trade responsibly.</small>
        </footer>
      </main>

      {/* Bottom nav */}
      <nav className="cw-nav">
        {[
          ["home", "Home", "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"],
          ["market", "Market", "M4 20V10M10 20V4M16 20v-8M22 20H2"],
          ["trade", "Trade", "M21 12a9 9 0 11-3-6.7M21 4v5h-5"],
          ["options", "Options", "M6 3h9l4 4v14H6zM9 12h7M9 16h7"],
          ["assets", "Assets", "M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 7l2-3h12M16 14h2"],
        ].map(([k, l, d]) => (
          <button key={k} className={k === "home" ? "on" : ""} onClick={() => (k === "home" ? window.scrollTo({ top: 0, behavior: "smooth" }) : go(k))}>
            <Icon d={d} size={22} />
            <span>{l}</span>
          </button>
        ))}
      </nav>

      {auth && (
        <AuthModal
          mode={auth}
          setMode={setAuth}
          onClose={() => { setAuth(null); setPending(null); }}
          onSuccess={handleSuccess}
          onLogin={onLogin}
          onSignup={onSignup}
        />
      )}
    </div>
  );
}

/* ------------------------------ styles ------------------------------ */
const CSS = `
.cw{--bg:#0a0d13;--card:#121723;--card2:#1a2132;--line:#232b3d;--tx:#eaecef;--mut:#7c8798;--up:#0ecb81;--dn:#f6465d;--ac:#2dd4a7;
  min-height:100vh;background:var(--bg);color:var(--tx);font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  display:flex;flex-direction:column;align-items:center;-webkit-font-smoothing:antialiased}
.cw *{box-sizing:border-box}
.cw button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:inherit}
.cw a{color:var(--ac);text-decoration:none}
.cw-wrap{width:100%;max-width:520px}
.cw-head{position:sticky;top:0;z-index:20;width:100%;background:rgba(10,13,19,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);display:flex;justify-content:center}
.cw-head-in{display:flex;justify-content:space-between;align-items:center;padding:12px 16px}
.cw-logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:19px;letter-spacing:.2px}
.cw-logo b{color:var(--ac)}
.cw-logo-mark{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-weight:800;color:#06241c;background:linear-gradient(135deg,#2dd4a7,#0ea5e9)}
.cw-head-r{display:flex;align-items:center;gap:8px}
.cw-live{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--mut);padding:4px 9px;border:1px solid var(--line);border-radius:99px}
.cw-live i{width:7px;height:7px;border-radius:50%;background:#e0a100}
.cw-live.on i{background:var(--up);animation:cwp 1.8s infinite}
@keyframes cwp{0%{box-shadow:0 0 0 0 rgba(14,203,129,.6)}70%,100%{box-shadow:0 0 0 7px rgba(14,203,129,0)}}
.cw-link{padding:8px 10px;font-size:14px;font-weight:600}
.cw-link:hover{color:var(--ac)}
.cw-user{position:relative}
.cw-avatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:700;background:linear-gradient(135deg,#2dd4a7,#0ea5e9);color:#06241c!important}
.cw-menu{position:absolute;right:0;top:44px;min-width:200px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:6px;box-shadow:0 18px 40px rgba(0,0,0,.45)}
.cw-menu-h{padding:10px 12px;border-bottom:1px solid var(--line);margin-bottom:4px;display:flex;flex-direction:column;gap:2px}
.cw-menu-h small{color:var(--mut);overflow:hidden;text-overflow:ellipsis}
.cw-menu button{display:block;width:100%;padding:10px 12px;border-radius:9px;font-size:14px}
.cw-menu button:hover{background:var(--card2)}
.cw-menu .out{color:var(--dn)!important}

.cw-main{padding:14px 16px 100px;display:flex;flex-direction:column;gap:18px}

.cw-note{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:var(--card);border:1px solid var(--line);font-size:13px;color:var(--mut);overflow:hidden}
.cw-note svg{color:var(--ac);flex:none}
.cw-note span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;animation:cwf .5s}
@keyframes cwf{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

.cw-balance{padding:18px;border-radius:18px;background:linear-gradient(160deg,#162036,#101726);border:1px solid var(--line)}
.cw-bal-top{display:flex;justify-content:space-between;align-items:center;color:var(--mut);font-size:13px}
.cw-eye{color:var(--mut)!important;display:grid;place-items:center}
.cw-bal-amt{font-size:34px;font-weight:700;margin:6px 0 14px;letter-spacing:.5px}
.cw-welcome{margin:0 0 4px;font-size:22px}
.cw-sub{margin:0 0 14px;color:var(--mut);font-size:13.5px;line-height:1.5}
.cw-bal-btns{display:flex;gap:10px}
.cw-btn{flex:1;padding:11px 16px;border-radius:11px;font-weight:600;font-size:14px;text-align:center!important;transition:.15s}
.cw-btn.sm{flex:none;padding:8px 16px}
.cw-btn.primary{background:var(--ac);color:#04221a!important}
.cw-btn.primary:hover{filter:brightness(1.08)}
.cw-btn.primary:disabled{opacity:.6;cursor:wait}
.cw-btn.ghost{border:1px solid var(--line);background:var(--card2)}
.cw-btn.ghost:hover{border-color:var(--ac)}
.cw-btn.light{flex:none;background:rgba(255,255,255,.95);color:#0b1220!important;padding:9px 18px;margin-top:14px}
.cw-full{width:100%;margin-top:6px;padding:13px}

.cw-banner{position:relative;border-radius:18px;overflow:hidden}
.cw-slides{display:flex;transition:transform .6s cubic-bezier(.65,0,.35,1)}
.cw-slide{position:relative;min-width:100%;padding:24px 20px 30px;min-height:170px;overflow:hidden}
.cw-slide h2{margin:0 0 6px;font-size:22px;line-height:1.2;max-width:70%}
.cw-slide p{margin:0;color:rgba(255,255,255,.75);font-size:13px;max-width:62%;line-height:1.45}
.cw-orb{position:absolute;right:-40px;top:-30px;width:190px;height:190px;border-radius:50%;background:radial-gradient(circle at 35% 35%,rgba(255,255,255,.35),rgba(255,255,255,.02) 65%)}
.cw-dots{position:absolute;bottom:10px;left:20px;display:flex;gap:6px}
.cw-dots button{width:6px;height:6px;border-radius:99px;background:rgba(255,255,255,.35);padding:0;transition:.25s}
.cw-dots button.on{width:18px;background:#fff}

.cw-tickers{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:0 16px}
.cw-tickers::-webkit-scrollbar{display:none}
.cw-ticker{flex:0 0 auto;min-width:128px;padding:12px 14px;border-radius:14px;background:var(--card);border:1px solid var(--line);display:flex;flex-direction:column;gap:4px;transition:.15s}
.cw-ticker:hover{border-color:#34405a;transform:translateY(-1px)}
.cw-tk-pair{font-size:12px;color:var(--mut)}
.cw-tk-price{font-size:17px;font-weight:700}
.up{color:var(--up)}.dn{color:var(--dn)}
.cw-chip{font-size:12px;font-weight:600}

.cw-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.cw-action{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 6px;border-radius:14px;background:var(--card);border:1px solid var(--line);font-size:12.5px;font-weight:500;text-align:center!important;transition:.15s}
.cw-action:hover{background:var(--card2);border-color:#34405a}
.cw-action-ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;color:var(--ac);background:rgba(45,212,167,.1);flex:none}

.cw-sent{padding:14px 16px;border-radius:16px;background:var(--card);border:1px solid var(--line)}
.cw-sent-h{display:flex;justify-content:space-between;font-size:14px;margin-bottom:10px}
.cw-sent-h em{font-style:normal;font-weight:600}
.cw-bar{height:8px;border-radius:99px;background:var(--dn);overflow:hidden}
.cw-bar i{display:block;height:100%;background:var(--up);border-radius:99px;transition:width .6s}
.cw-sent-f{display:flex;justify-content:space-between;font-size:11.5px;color:var(--mut);margin-top:8px}

.cw-market{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:6px 0 0;overflow:hidden}
.cw-tabs{display:flex;gap:4px;padding:10px 12px 6px;overflow-x:auto;scrollbar-width:none}
.cw-tabs::-webkit-scrollbar{display:none}
.cw-tabs button{padding:7px 13px;border-radius:99px;font-size:13.5px;color:var(--mut);font-weight:600;white-space:nowrap}
.cw-tabs button.on{background:var(--card2);color:var(--tx)}
.cw-search{display:flex;align-items:center;gap:8px;margin:6px 12px 4px;padding:0 12px;height:40px;border-radius:11px;background:var(--bg);border:1px solid var(--line);color:var(--mut)}
.cw-search:focus-within{border-color:var(--ac)}
.cw-search input{flex:1;background:none;border:0;outline:0;color:var(--tx);font-size:14px;min-width:0}
.cw-thead,.cw-row{display:grid;grid-template-columns:1.3fr 1.2fr .85fr;align-items:center;gap:8px;padding:0 16px}
.cw-thead{font-size:12px;color:var(--mut);padding-top:10px;padding-bottom:6px}
.cw-thead span:last-child{text-align:right}
.cw-row{padding-top:12px;padding-bottom:12px;border-top:1px solid rgba(35,43,61,.6);transition:.12s;cursor:pointer}
.cw-row:hover{background:var(--card2)}
.cw-name{display:flex;align-items:center;gap:8px;min-width:0}
.cw-star{font-size:17px;color:var(--mut);padding:0 2px;line-height:1}
.cw-star.on{color:#f7c948}
.cw-coin{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:14px;color:#fff;flex:none}
.cw-sym{font-weight:700;font-size:15px}
.cw-sym small{color:var(--mut);font-weight:500;font-size:12px}
.cw-vol{font-size:11px;color:var(--mut);margin-top:2px}
.cw-mid{display:flex;flex-direction:column;gap:3px}
.cw-spark{width:70px;height:20px}
.cw-price{font-weight:600;font-size:14.5px;font-variant-numeric:tabular-nums}
.cw-badge{justify-self:end;min-width:74px;text-align:center;padding:7px 0;border-radius:8px;font-size:13px;font-weight:700;color:#fff!important}
.cw-badge.up{background:var(--up)}.cw-badge.dn{background:var(--dn)}
.cw-empty{padding:28px 16px;text-align:center;color:var(--mut);font-size:13.5px;border-top:1px solid var(--line)}
.cw-viewall{width:100%;padding:14px;text-align:center!important;color:var(--ac)!important;font-weight:600;font-size:14px;border-top:1px solid var(--line)}

.cw-h{margin:0 0 12px;font-size:17px}
.cw-feat{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cw-feat-c{padding:16px;border-radius:16px;background:var(--card);border:1px solid var(--line);display:flex;flex-direction:column;gap:8px}
.cw-feat-c b{font-size:14.5px}
.cw-feat-c p{margin:0;font-size:12.5px;color:var(--mut);line-height:1.45}

.cw-ref{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px;border-radius:16px;background:linear-gradient(120deg,rgba(45,212,167,.14),rgba(14,165,233,.1));border:1px solid rgba(45,212,167,.28)}
.cw-ref p{margin:4px 0 0;font-size:12.5px;color:var(--mut);line-height:1.45}

.cw-faq{display:flex;flex-direction:column;gap:8px}
.cw-faq-i{border-radius:14px;background:var(--card);border:1px solid var(--line);overflow:hidden}
.cw-faq-i button{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;font-size:14px;font-weight:600}
.cw-faq-i i{font-style:normal;color:var(--ac);font-size:20px;line-height:1}
.cw-faq-i p{margin:0;padding:0 16px 16px;font-size:13px;color:var(--mut);line-height:1.55}

.cw-foot{display:flex;flex-direction:column;align-items:center;gap:14px;padding:14px 0 4px;text-align:center}
.cw-foot-l{display:flex;gap:18px;font-size:13px;flex-wrap:wrap;justify-content:center}
.cw-foot small{color:var(--mut);font-size:11.5px;line-height:1.5;max-width:340px}

.cw-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;z-index:30;display:flex;background:rgba(15,19,29,.94);backdrop-filter:blur(14px);border-top:1px solid var(--line);padding:6px 4px calc(6px + env(safe-area-inset-bottom))}
.cw-nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 0;font-size:11px;color:var(--mut);text-align:center!important}
.cw-nav button.on{color:var(--ac)}

/* auth modal */
.cw-overlay{position:fixed;inset:0;z-index:100;background:rgba(3,6,12,.72);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;animation:cwf .2s}
.cw-modal{position:relative;width:100%;max-width:440px;max-height:94vh;overflow-y:auto;background:var(--card);border:1px solid var(--line);border-radius:22px 22px 0 0;padding:26px 22px 22px;animation:cwu .28s cubic-bezier(.2,.8,.2,1)}
@keyframes cwu{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.cw-modal h3{margin:10px 0 4px;font-size:22px;text-align:center}
.cw-modal .cw-sub{text-align:center}
.cw-modal-logo{display:flex;justify-content:center}
.cw-x{position:absolute;right:14px;top:14px;width:32px;height:32px;border-radius:50%;color:var(--mut)!important;display:grid;place-items:center}
.cw-x:hover{background:var(--card2)}
.cw-seg{display:grid;grid-template-columns:1fr 1fr;padding:4px;border-radius:12px;background:var(--bg);margin-bottom:16px}
.cw-seg button{padding:10px;border-radius:9px;font-weight:600;font-size:14px;text-align:center!important;color:var(--mut)}
.cw-seg button.on{background:var(--card2);color:var(--tx)}
.cw-field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
.cw-field>span{font-size:12.5px;color:var(--mut)}
.cw-field input,.cw-pw{height:46px;border-radius:11px;background:var(--bg);border:1px solid var(--line);color:var(--tx);padding:0 14px;font-size:15px;outline:0;width:100%}
.cw-field input:focus,.cw-pw:focus-within{border-color:var(--ac)}
.cw-pw{display:flex;align-items:center;padding:0}
.cw-pw input{border:0;background:none;height:100%;flex:1;min-width:0}
.cw-pw button{padding:0 14px;color:var(--ac)!important;font-size:13px;font-weight:600}
.cw-meter{display:flex;align-items:center;gap:5px;margin:-4px 0 12px}
.cw-meter i{flex:1;height:4px;border-radius:9px;background:var(--line)}
.cw-meter i.s1{background:var(--dn)}.cw-meter i.s2{background:#e0a100}.cw-meter i.s3,.cw-meter i.s4{background:var(--up)}
.cw-meter small{font-size:11.5px;color:var(--mut);margin-left:6px;min-width:42px}
.cw-check{display:flex;gap:10px;align-items:flex-start;font-size:12.5px;color:var(--mut);margin-bottom:10px;line-height:1.45}
.cw-check input{margin-top:2px;accent-color:#2dd4a7}
.cw-forgot{text-align:right;font-size:13px;margin:-4px 0 10px}
.cw-err{padding:10px 12px;border-radius:10px;background:rgba(246,70,93,.12);border:1px solid rgba(246,70,93,.35);color:#ff8a9a;font-size:13px;margin-bottom:10px}
.cw-switch{text-align:center;margin:14px 0 0;font-size:13.5px;color:var(--mut)}
.cw-switch button{color:var(--ac)!important;font-weight:600}

@media(min-width:768px){
  .cw-wrap,.cw-nav{max-width:760px}
  .cw-nav{border-radius:16px 16px 0 0}
  .cw-actions{grid-template-columns:repeat(6,1fr)}
  .cw-feat{grid-template-columns:repeat(4,1fr)}
  .cw-slide{min-height:200px;padding:32px 28px}
  .cw-slide h2{font-size:28px}
  .cw-overlay{align-items:center}
  .cw-modal{border-radius:22px}
}
`;
