import React, { useEffect, useRef, useState } from "react";
import Home, { useT, api, usePrices, Ic, ICON, COINS } from "./Home";
import SideMenu from "./sidebar";
import Deposit from "./depsoted";
import Withdraw from "./withdrew";
import Authentication from "./authentication";
import { Market, Exchange } from "./trading";
import Assets from "./Assets";
import Options from "./options";
import Swap from "./exchange";
import Loans from "./loans";
import ChangeMoney from "./changemoney";

/* =====================================================================
   src/pages/Dashboard.jsx — লগইনের পরের মূল অ্যাপ (ডেটা লোড + পেজ রাউটিং)
   URL ↔ page: /  /market  /trade?s=BTC  /options?s=BTC  /assets  /deposit  /withdraw  /real-authentication  /exchangeb  /loans  /changemoney

   আপডেট:
   - Market পেজে কোনো কয়েনে ক্লিক করলে Options পেজ খুলবে (ওই কয়েন সহ)
   - Home এ onRegister পাঠানো হয়েছে (গেস্টের Register বাটন → /register)
   - নিচের নেভিগেশন বার ছোট ও প্রিমিয়াম (আইকন 22px, লেখা 11px, স্মুথ ফন্ট)
   ===================================================================== */

const PATHS = { home: "/", market: "/market", exchange: "/trade", options: "/options", assets: "/assets", deposit: "/deposit", withdraw: "/withdraw", auth: "/real-authentication", exchangeb: "/exchangeb", loans: "/loans", changemoney: "/changemoney" };
/* এই পেজগুলোতে নিচের নেভিগেশন বার লুকানো থাকে (স্ক্রিনশটের মতো) */
const HIDE_NAV = ["exchangeb", "loans", "changemoney"];
const HAS_SYM = ["exchange", "options"];
/* Options পেজ এখন লাইট থিম (নিজের ব্যাকগ্রাউন্ড আছে), তাই এখানে আর ডার্ক নয় */
const DARK_PAGES = ["auth"];

/* নিচের নেভিগেশন বার: ছোট, প্রিমিয়াম, স্মুথ টেক্সট */
const NAV_CSS = `
nav.cx-nav{
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Noto Sans","Noto Sans Bengali","Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;
  box-shadow:0 -1px 0 rgba(125,140,165,.2);touch-action:manipulation;
}
nav.cx-nav > button{
  position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
  height:auto!important;min-height:0!important;
  padding:8px 0 calc(6px + env(safe-area-inset-bottom,0px))!important;
  font-size:11px!important;font-weight:500;letter-spacing:.15px;line-height:1.1;
  background:transparent;border:0;-webkit-tap-highlight-color:transparent;
  transition:color .2s ease,opacity .15s ease;
}
nav.cx-nav > button svg{width:22px;height:22px;transition:transform .2s ease}
nav.cx-nav > button.on{font-weight:600}
nav.cx-nav > button.on svg{transform:translateY(-1px)}
nav.cx-nav > button.on::before{
  content:"";position:absolute;top:0;left:50%;width:18px;height:2px;margin-left:-9px;border-radius:0 0 2px 2px;background:currentColor;
}
nav.cx-nav > button:active{opacity:.65}
@media(prefers-reduced-motion:reduce){nav.cx-nav > button,nav.cx-nav > button svg{transition:none!important}}
`;

const urlFor = (page, sym) => PATHS[page] + (HAS_SYM.includes(page) ? "?s=" + sym : "");

const fromLoc = () => {
  const p = window.location.pathname.replace(/\/+$/, "") || "/";
  const page = Object.keys(PATHS).find((k) => PATHS[k] === p) || "home";
  const s = (new URLSearchParams(window.location.search).get("s") || "").toUpperCase();
  return { page, sym: COINS.includes(s) ? s : "BTC" };
};

const pushUrl = (url) => { if (url !== window.location.pathname + window.location.search) window.history.pushState(null, "", url); };
const replaceUrl = (url) => { if (url !== window.location.pathname + window.location.search) window.history.replaceState(null, "", url); };

export default function Dashboard({ me0, logout, askLogin, lang, setLang, dark, setDark }) {
  const P = usePrices();
  const t = useT();
  const authed = !!me0;
  const [me, setMe] = useState(me0), [menu, setMenu] = useState(false), [w, setW] = useState({ USDT: 0 }), [fz, setFz] = useState({}), [total, setTotal] = useState(null);
  const [pos, setPos] = useState([]), [orders, setOrders] = useState([]), [txs, setTxs] = useState([]), [spot, setSpot] = useState([]), [toast, setToast] = useState("");
  const notify = (m, ms = 3000) => { setToast(m); setTimeout(() => setToast(""), ms); };
  const [page, setPage] = useState(() => fromLoc().page), [sym, setSym] = useState(() => fromLoc().sym);
  const ref = useRef({});
  ref.current = { t, pos, page };
  const prevOpen = useRef(null);

  const loadMe = async () => { try { const j = await api("/auth/me"); setMe(j); } catch {} };
  const loadWallet = async () => {
    try {
      const [j, tt] = await Promise.all([api("/wallet"), api("/wallet/total").catch(() => null)]);
      const a = {}, f = {};
      Object.entries(j.wallet).forEach(([c, v]) => { a[c] = v.available; f[c] = v.frozen; });
      setW(a); setFz(f);
      setTotal(tt && typeof tt.total_usd === "number" ? tt.total_usd : null);
    } catch {}
  };
  const loadSpot = async () => { try { const j = await api("/spot/orders"); if (Array.isArray(j)) setSpot(j); } catch {} };
  const loadPos = async () => {
    try {
      const [o, r] = await Promise.all([api("/options/positions"), api("/options/records")]);
      const np = o.map((x) => ({ id: x.id, sym: x.sym, dir: x.direction, qty: x.qty, open: x.open_price, end: Date.parse(x.end_at) }));
      const no = r.map((x) => ({ id: x.id, sym: x.sym, dir: x.direction, qty: x.qty, open: x.open_price, close: x.close_price, pnl: x.pnl || 0 }));
      if (prevOpen.current) {
        const ids = new Set(np.map((x) => x.id));
        const gone = [...prevOpen.current].filter((i) => !ids.has(i));
        const cl = no.filter((x) => gone.includes(x.id));
        if (cl.length) {
          const wins = cl.filter((x) => x.pnl > 0).length;
          notify(ref.current.t("closed").replace("{n}", cl.length).replace("{w}", wins).replace("{l}", cl.length - wins), 4000);
          loadWallet();
        }
      }
      prevOpen.current = new Set(np.map((x) => x.id));
      setPos(np); setOrders(no);
    } catch {}
  };
  const loadTx = async () => {
    try {
      const [d, x] = await Promise.all([api("/deposit/history"), api("/withdraw/history")]);
      const m = (a, type) => a.map((y) => ({ id: type + y.id, type, coin: y.coin, net: y.net, amt: y.amount, status: y.status, time: y.created_at }));
      setTxs([...m(d, "dep"), ...m(x, "wd")].sort((a, b) => Date.parse(b.time) - Date.parse(a.time)));
    } catch {}
  };
  const reload = () => Promise.all([loadWallet(), loadPos(), loadTx(), loadSpot()]);
  const W = { w, fz, total, reload, guest: !authed, needLogin: () => askLogin("login", "needLogin") };

  useEffect(() => {
    if (!authed) return;
    loadMe(); reload();
    let c = 0;
    const id = setInterval(() => {
      c++;
      const { pos: ps, page: pg } = ref.current;
      if (ps.length || pg === "options") loadPos();
      if (c % 3 === 0) loadWallet();
    }, 2000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  /* প্রথম লোডে ভুল/অচেনা URL হলে ঠিক URL বসায় */
  useEffect(() => { replaceUrl(urlFor(page, sym)); }, []); // eslint-disable-line

  /* ব্রাউজারের Back / Forward */
  useEffect(() => {
    const onPop = () => {
      const l = fromLoc();
      setPage(l.page); setSym(l.sym);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* পেজ বদল → state + URL দুটোই */
  const go = (p, s) => {
    const ns = s || sym;
    if (s) setSym(s);
    setPage(p);
    pushUrl(urlFor(p, ns));
    window.scrollTo(0, 0);
  };

  /* Market পেজ থেকে কয়েনে ক্লিক করলে (exchange/trade এ যেত) → এখন Options পেজে যাবে */
  const marketGo = (p, s) => go(p === "exchange" ? "options" : p, s);

  /* Trade/Options পেজে কয়েন বদলালে URL-এর ?s= বদলায় (নতুন history entry ছাড়াই) */
  const pickSym = (s) => { setSym(s); replaceUrl(urlFor(page, s)); };

  const nav = [["home", "home"], ["market", "market"], ["exchange", "trade"], ["options", "options"], ["assets", "assets"]];
  return (
    <>
      <style>{NAV_CSS}</style>
      <div className={"cx-pg" + (DARK_PAGES.includes(page) ? " od" : "")}>
        {page === "home" && <Home P={P} go={go} lang={lang} setLang={setLang} onMenu={() => setMenu(true)} notify={notify} guest={!authed} askLogin={askLogin} onRegister={() => askLogin("register")} />}
        {page === "market" && <Market P={P} go={marketGo} />}
        {page === "exchange" && <Exchange P={P} W={W} sym={sym} setSym={pickSym} go={go} spot={spot} />}
        {page === "options" && <Options P={P} W={W} sym={sym} setSym={pickSym} pos={pos} orders={orders} />}
        {page === "assets" && <Assets P={P} W={W} go={go} />}
        {page === "deposit" && <Deposit W={W} go={go} txs={txs} />}
        {page === "withdraw" && <Withdraw W={W} go={go} txs={txs} />}
        {page === "auth" && <Authentication W={W} go={go} />}
        {page === "exchangeb" && <Swap W={W} go={go} />}
        {page === "loans" && <Loans W={W} go={go} />}
        {page === "changemoney" && <ChangeMoney W={W} go={go} />}
      </div>
      <SideMenu open={menu} onClose={() => setMenu(false)} me={authed ? me : null} logout={logout} dark={dark} setDark={setDark} go={go} notify={notify} guest={!authed} askLogin={askLogin} />
      {toast && <div className="cx-toast">{toast}</div>}
      {!HIDE_NAV.includes(page) && (
      <nav className="cx-nav">
        {nav.map(([k, l]) => (<button key={k} className={page === k ? "on" : ""} onClick={() => go(k)}><Ic d={ICON[k === "exchange" ? "trade" : k]} s={22} />{t(l)}</button>))}
      </nav>
      )}
    </>
  );
}
