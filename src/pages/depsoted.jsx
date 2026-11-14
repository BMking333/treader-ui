import React, { useState, useRef, useEffect, useMemo } from "react";
import { useT, api } from "./Home";

/* =====================================================================
   src/pages/depsoted.jsx — Deposit পেজ + shared (NETS, Chips, TxList)

   Flow:
     Step 1 -> Coin + Amount সিলেক্ট -> Next
     Step 2 -> Network সিলেক্ট -> Address/QR আসে -> Screenshot + TxID দিয়ে Submit

   Backend:
     GET  /deposit/methods -> Admin-এর তৈরি Active payment methods
     POST /deposit         -> { payment_method_id, amount, txid, sender_info, proof_url }
   Deposit approve হলে তবেই Wallet-এ Coin যোগ হয়।
   ===================================================================== */

export const NETS = { USDT: ["TRC20", "ERC20"], USDC: ["ERC20"], ETH: ["ERC20"], BTC: ["BTC"] };

// Customer service (Telegram)
const SUPPORT = [
  { name: "Customer service-1", url: "https://t.me/Michaelgwebb" },
  { name: "Customer service-2", url: "https://t.me/Michaelgwebb1" },
];

// Backend error code -> i18n key
const ERR_KEY = {
  badAmt: "dpBadAmt",
  badTxid: "dpBadTxid",
  duplicateTxid: "dpDup",
  paymentProofRequired: "dpProof",
  paymentUnavailable: "dpUnavail",
  unauthorized: "unauthorized",
  neterr: "neterr",
};

const isDone = (x) => x.type === "dep" || /done|success|complete|approved|paid/i.test(x.status || "");

// Withdraw পেজ এটা ব্যবহার করে, তাই export থাকছে
export function TxList({ txs, type }) {
  const t = useT();
  const l = txs.filter((x) => x.type === type);
  return (
    <div className="cx-hist">
      <h3>{t("hist")}</h3>
      {l.length ? l.map((x) => (
        <div key={x.id} className="cx-tx">
          <span><b>{x.type === "dep" ? "+" : "-"}{x.amt} {x.coin}</b><small>{x.net} · {new Date(x.time).toLocaleString()}</small></span>
          <span className={"st " + (isDone(x) ? "dep" : "wd")}>{t(isDone(x) ? "done" : "proc")}</span>
        </div>
      )) : <div className="cx-empty2">{t("norec")}</div>}
    </div>
  );
}

export function Chips({ list, v, set }) {
  return <div className="cx-chips">{list.map((x) => <button key={x} className={x === v ? "on" : ""} onClick={() => set(x)}>{x}</button>)}</div>;
}

/* ---------- helpers ---------- */
function unwrap(res) {
  if (res?.data !== undefined) return res.data;
  if (res?.result !== undefined) return res.result;
  return res;
}

function toList(res) {
  const d = unwrap(res);
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.methods)) return d.methods;
  if (Array.isArray(d?.results)) return d.results;
  return [];
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (v, max = 8) => num(v).toLocaleString("en-US", { maximumFractionDigits: max });

// ছবি ছোট করে (max 1000px, JPEG) dataURL বানায়
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 1000;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- coin logos ---------- */
function CoinLogo({ coin, size = 40, url }) {
  const [broken, setBroken] = useState(false);
  const st = { width: size, height: size, flexShrink: 0, display: "block" };

  if (url && !broken) {
    return <img src={url} alt={coin} style={{ ...st, borderRadius: "50%", objectFit: "cover" }} onError={() => setBroken(true)} />;
  }

  switch ((coin || "").toUpperCase()) {
    case "USDT":
      return (
        <svg viewBox="0 0 40 40" style={st}>
          <circle cx="20" cy="20" r="20" fill="#26A17B" />
          <rect x="11" y="10" width="18" height="4.5" rx="1" fill="#fff" />
          <rect x="17.8" y="13" width="4.4" height="17" rx="1" fill="#fff" />
          <ellipse cx="20" cy="19.5" rx="9.5" ry="2.6" fill="none" stroke="#fff" strokeWidth="1.8" />
        </svg>
      );
    case "USDC":
      return (
        <svg viewBox="0 0 40 40" style={st}>
          <circle cx="20" cy="20" r="20" fill="#2775CA" />
          <path d="M20 8.500a11.500 11.500 0 1 0 0 23 11.500 11.500 0 0 0 0-23zm0 21.300a9.800 9.800 0 1 1 0-19.600 9.800 9.800 0 0 1 0 19.600z" fill="#fff" />
          <path d="M22.700 18.100c0-1.400-.9-1.900-2.600-2.100-1.200-.2-1.500-.5-1.500-1s.5-.9 1.300-.9c.8 0 1.200.4 1.400 1h1.700a2.800 2.800 0 0 0-2-2.200V11.500h-1.800v1.300c-1.400.2-2.300 1.100-2.300 2.300 0 1.500.9 2 2.600 2.200 1.100.2 1.500.5 1.500 1.100 0 .7-.6 1.100-1.500 1.100s-1.400-.5-1.600-1.200h-1.700a2.900 2.900 0 0 0 2.300 2.300v1.400h1.800v-1.300c1.500-.2 2.400-1.100 2.400-2.400z" fill="#fff" />
        </svg>
      );
    case "ETH":
      return (
        <svg viewBox="0 0 40 40" style={st}>
          <circle cx="20" cy="20" r="20" fill="#627EEA" />
          <path d="M20.700 6v10.600l9 4z" fill="#fff" fillOpacity=".6" />
          <path d="M20.700 6l-9 14.600 9-4z" fill="#fff" />
          <path d="M20.700 27.600v6.400l9-12.400z" fill="#fff" fillOpacity=".6" />
          <path d="M20.700 34v-6.400l-9-5.200z" fill="#fff" />
          <path d="M20.700 25.900l9-5.300-9-4z" fill="#fff" fillOpacity=".2" />
          <path d="M11.700 20.600l9 5.300v-9.300z" fill="#fff" fillOpacity=".6" />
        </svg>
      );
    case "BTC":
      return (
        <svg viewBox="0 0 40 40" style={st}>
          <circle cx="20" cy="20" r="20" fill="#F7931A" />
          <path d="M26.300 17.900c.3-2.100-1.300-3.200-3.500-4l.7-2.900-1.700-.4-.7 2.800-1.400-.3.700-2.800-1.700-.4-.7 2.900-1.100-.3v0l-2.400-.6-.5 1.900s1.300.3 1.200.3c.7.200.8.600.8 1l-.8 3.300c.1 0 .1 0 .2.100h-.2l-1.200 4.600c-.1.200-.3.600-.8.400 0 0-1.200-.3-1.200-.3l-.9 2 2.200.6 1.200.3-.7 3 1.700.4.700-2.900 1.400.4-.7 2.800 1.700.4.700-3c3 .6 5.200.3 6.100-2.400.8-2.100 0-3.400-1.600-4.200 1.100-.3 2-1 2.200-2.600zm-4 5.600c-.5 2.100-4.200 1-5.300.7l1-3.800c1.200.3 4.900.9 4.300 3.100zm.6-5.700c-.5 1.900-3.500.9-4.500.7l.9-3.500c1 .2 4.100.7 3.600 2.800z" fill="#fff" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 40 40" style={st}>
          <circle cx="20" cy="20" r="20" fill="#3a4a66" />
          <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff" fontFamily="Inter, Arial, sans-serif">
            {(coin || "?").slice(0, 3)}
          </text>
        </svg>
      );
  }
}

/* ---------- styles ---------- */
const CSS = `
.dp, .dp * { box-sizing: border-box; }
.dp {
  --bg: #08101d;
  --panel: #0f1b2d;
  --panel2: #0b1626;
  --line: #1a2b43;
  --text: #f2f6fc;
  --muted: #8393ad;
  --blue: #1677ff;
  --blue2: #3d93ff;
  --green: #2ecc8f;
  --red: #ff6b7a;
  --amber: #f5b942;
  background:
    radial-gradient(1200px 380px at 50% -120px, rgba(22,119,255,.16), transparent 70%),
    var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding-bottom: 56px;
  font-family: Inter, "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.dp button { font-family: inherit; }

/* top bar */
.dp-top {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-between;
  height: 60px; padding: 0 12px;
  background: rgba(15,27,45,.92); backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.dp-top h1 { margin: 0; font-size: 18px; font-weight: 600; letter-spacing: .2px; }
.dp-ibtn {
  width: 42px; height: 42px; border: 0; background: transparent; color: var(--text);
  cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; border-radius: 12px;
}
.dp-ibtn:active { background: rgba(255,255,255,.06); }
.dp-ibtn svg { width: 26px; height: 26px; }
.cx[dir=rtl] .dp-ibtn.back { transform: scaleX(-1); }

.dp-wrap { max-width: 560px; margin: 0 auto; padding: 20px 16px 0; }

/* stepper */
.dp-steps { display: flex; align-items: center; margin: 2px 6px 22px; }
.dp-st { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 13px; font-weight: 600; }
.dp-st i {
  width: 28px; height: 28px; border-radius: 50%; font-style: normal; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  background: var(--panel); border: 1.5px solid var(--line); color: var(--muted);
}
.dp-st.on { color: var(--text); }
.dp-st.on i { background: var(--blue); border-color: var(--blue); color: #fff; box-shadow: 0 4px 14px rgba(22,119,255,.4); }
.dp-st.done i { background: rgba(46,204,143,.16); border-color: var(--green); color: var(--green); }
.dp-line { flex: 1; height: 2px; margin: 0 12px; background: var(--line); border-radius: 2px; }
.dp-line.on { background: var(--blue); }

/* cards */
.dp-card {
  background: var(--panel); border: 1px solid var(--line);
  border-radius: 20px; padding: 20px 18px 22px; margin-bottom: 16px;
}
.dp-h { margin: 0 0 4px; font-size: 17px; font-weight: 700; }
.dp-sub { margin: 0 0 16px; font-size: 13px; color: var(--muted); line-height: 1.5; }

/* coin grid */
.dp-coins { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.dp-coin {
  position: relative; display: flex; align-items: center; gap: 12px; text-align: start;
  background: var(--panel2); border: 1.5px solid var(--line); border-radius: 16px;
  padding: 14px 12px; cursor: pointer; color: var(--text);
  transition: border-color .15s, background .15s;
}
.dp-coin:hover { border-color: #2a4468; }
.dp-coin.on { border-color: var(--blue); background: rgba(22,119,255,.1); }
.dp-coin b { display: block; font-size: 16px; font-weight: 700; }
.dp-coin small { display: block; color: var(--muted); font-size: 11.5px; margin-top: 2px; }
.dp-tick {
  position: absolute; top: 8px; inset-inline-end: 8px; width: 18px; height: 18px; border-radius: 50%;
  background: var(--blue); display: flex; align-items: center; justify-content: center;
}
.dp-tick svg { width: 11px; height: 11px; color: #fff; stroke-width: 3.2; }

/* amount */
.dp-amount {
  display: flex; align-items: center; gap: 10px;
  background: var(--panel2); border: 1.5px solid var(--line); border-radius: 16px;
  padding: 0 16px; height: 70px; transition: border-color .15s, box-shadow .15s;
}
.dp-amount:focus-within { border-color: var(--blue); box-shadow: 0 0 0 4px rgba(22,119,255,.14); }
.dp-amount input {
  flex: 1; min-width: 0; background: transparent; border: 0; outline: none;
  color: var(--text); font-size: 26px; font-weight: 700; font-family: inherit;
}
.dp-amount input::placeholder { color: #51627f; font-weight: 400; font-size: 16px; }
.dp-amount em {
  font-style: normal; font-size: 14px; font-weight: 700; color: var(--blue2);
  background: rgba(22,119,255,.12); padding: 6px 12px; border-radius: 999px; flex-shrink: 0;
}
.dp-hint { margin-top: 10px; font-size: 12.5px; color: var(--muted); }

/* buttons */
.dp-primary {
  width: 100%; height: 56px; border: 0; border-radius: 16px; cursor: pointer;
  background: linear-gradient(135deg, #1677ff, #3d93ff); color: #fff;
  font-size: 17px; font-weight: 700; box-shadow: 0 10px 24px rgba(22,119,255,.32);
}
.dp-primary:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }

/* summary strip */
.dp-sum {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  background: var(--panel); border: 1px solid var(--line); border-radius: 16px;
  padding: 12px 14px; margin-bottom: 16px;
}
.dp-sum-l { display: flex; align-items: center; gap: 12px; min-width: 0; }
.dp-sum b { display: block; font-size: 17px; }
.dp-sum small { display: block; color: var(--muted); font-size: 12px; margin-top: 2px; }
.dp-link { border: 0; background: transparent; color: var(--blue2); font-size: 14px; font-weight: 700; cursor: pointer; padding: 8px 4px; }

/* network */
.dp-nets { display: flex; gap: 8px; }
.dp-net {
  flex: 1; height: 50px; border-radius: 14px; cursor: pointer;
  background: var(--panel2); border: 1.5px solid var(--line); color: var(--text);
  font-size: 15px; font-weight: 600;
}
.dp-net.on { background: var(--blue); border-color: var(--blue); }

/* pay details */
.dp-pay { text-align: center; }
.dp-qr {
  width: 100%; max-width: 232px; aspect-ratio: 1 / 1; margin: 4px auto 0;
  background: #fff; border-radius: 18px; padding: 10px; overflow: hidden;
  box-shadow: 0 12px 30px rgba(0,0,0,.35);
}
.dp-qr img { width: 100%; height: 100%; object-fit: contain; display: block; }
.dp-lbl { margin-top: 20px; font-size: 13px; color: var(--muted); font-weight: 600; text-align: start; }
.dp-addr {
  margin-top: 8px; display: flex; align-items: center; gap: 10px; text-align: start;
  background: var(--panel2); border: 1px solid var(--line); border-radius: 14px; padding: 12px 12px 12px 14px;
}
.dp-addr span {
  flex: 1; min-width: 0; word-break: break-all; direction: ltr;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13.5px; line-height: 1.5;
}
.dp-copy {
  flex-shrink: 0; border: 0; cursor: pointer; padding: 10px 16px; border-radius: 10px;
  background: var(--blue); color: #fff; font-size: 13px; font-weight: 700;
}
.dp-copy.done { background: var(--green); color: #052a1d; }
.dp-warn {
  margin-top: 14px; padding: 12px 14px; border-radius: 12px; text-align: start;
  background: rgba(245,185,66,.09); border: 1px solid rgba(245,185,66,.28);
  color: var(--amber); font-size: 12.5px; line-height: 1.55; white-space: pre-wrap;
}

/* submit form */
.dp-field { margin-top: 18px; }
.dp-field:first-of-type { margin-top: 0; }
.dp-flbl { font-size: 13px; color: var(--muted); font-weight: 600; margin-bottom: 8px; }
.dp-drop {
  position: relative; cursor: pointer; width: 100%; min-height: 150px;
  background: var(--panel2); border: 1.5px dashed #2f4468; border-radius: 16px; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  color: var(--muted); font-size: 13px; transition: border-color .15s;
}
.dp-drop:hover { border-color: var(--blue); }
.dp-drop svg { width: 34px; height: 34px; }
.dp-drop img { width: 100%; max-height: 280px; object-fit: contain; display: block; background: #000; }
.dp-rm {
  position: absolute; top: 8px; inset-inline-end: 8px; width: 30px; height: 30px; border: 0;
  border-radius: 50%; background: rgba(0,0,0,.7); color: #fff; font-size: 13px; cursor: pointer;
}
.dp-in {
  width: 100%; height: 54px; background: var(--panel2); border: 1.5px solid var(--line); border-radius: 14px;
  color: var(--text); font-size: 15px; padding: 0 14px; outline: none; font-family: inherit;
  transition: border-color .15s, box-shadow .15s;
}
.dp-in::placeholder { color: #51627f; }
.dp-in:focus { border-color: var(--blue); box-shadow: 0 0 0 4px rgba(22,119,255,.14); }

.dp-msg { margin: 16px 0 0; padding: 12px 14px; border-radius: 12px; font-size: 13.5px; line-height: 1.5; }
.dp-msg.ok { background: rgba(46,204,143,.12); color: var(--green); border: 1px solid rgba(46,204,143,.3); }
.dp-msg.bad { background: rgba(255,107,122,.1); color: var(--red); border: 1px solid rgba(255,107,122,.3); }

.dp-center { text-align: center; color: var(--muted); padding: 60px 10px; font-size: 15px; }

/* support sheet */
.dp-ov { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.6); display: flex; align-items: flex-end; justify-content: center; }
.dp-sheet {
  width: 100%; max-width: 640px; background: var(--panel);
  border-radius: 24px 24px 0 0; padding: 18px 20px 28px; animation: dpUp .2s ease-out;
}
@keyframes dpUp { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .dp-sheet { animation: none; } }
.dp-sh-head { display: flex; align-items: center; justify-content: space-between; min-height: 40px; }
.dp-sh-head h3 { margin: 0; font-size: 20px; font-weight: 700; flex: 1; text-align: center; }
.dp-svc {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  border: 0; border-top: 1px solid var(--line); background: transparent; color: var(--text);
  font-size: 18px; padding: 20px 2px; cursor: pointer; text-align: start; text-decoration: none;
}
.dp-svc:last-child { border-bottom: 1px solid var(--line); }
.dp-svc svg { width: 22px; height: 22px; color: var(--muted); }
.cx[dir=rtl] .dp-svc svg { transform: scaleX(-1); }
`;

/* ---------- icons ---------- */
const Svg = ({ children, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const IcBack = () => <Svg><polyline points="15 5 8 12 15 19" /></Svg>;
const IcRight = () => <Svg><polyline points="9 5 16 12 9 19" /></Svg>;
const IcCheck = () => <Svg><polyline points="5 12.5 10 17.5 19 7.5" /></Svg>;
const IcClose = () => <Svg><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></Svg>;
const IcHeadset = () => (
  <svg viewBox="0 0 24 24" fill="#2bb4ff">
    <path d="M12 2a8 8 0 0 0-8 8v4a3 3 0 0 0 3 3h1v-7H6.1A6 6 0 0 1 17.9 10H16v7h-4v2h4a3 3 0 0 0 3-3v-1a3 3 0 0 0 1-2.2V10a8 8 0 0 0-8-8z" />
    <circle cx="12" cy="11" r="3.2" />
    <path d="M6.5 22c.4-3 2.6-4.5 5.5-4.5s5.1 1.5 5.5 4.5z" />
  </svg>
);
const IcCamera = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9zm3 5.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
  </svg>
);

export default function Deposit({ W, go }) {
  const t = useT();
  // i18n key না থাকলে ইংরেজি fallback
  const L = (key, fb) => {
    const s = t(key);
    return s && s !== key ? s : fb;
  };

  const [methods, setMethods] = useState([]);
  const [loadingM, setLoadingM] = useState(true);

  const [step, setStep] = useState(1);          // 1 = coin + amount, 2 = network/address/submit
  const [coin, setCoin] = useState("");
  const [amt, setAmt] = useState("");
  const [methodId, setMethodId] = useState(null);

  const [txid, setTxid] = useState("");
  const [proof, setProof] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [copied, setCopied] = useState(false);
  const [support, setSupport] = useState(false);
  const fileRef = useRef(null);

  const say = (text, ok = false) => setMsg({ text, ok });
  const clearMsg = () => setMsg({ text: "", ok: false });
  const errText = (e) => {
    const m = e?.message;
    if (!m) return t("dpGeneric");
    return t(ERR_KEY[m] || m);
  };

  /* ---------- load methods ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = toList(await api("/deposit/methods")).filter((m) => m.method_type === "crypto");
        if (alive) setMethods(list);
      } catch (e) {
        if (alive) say(errText(e));
      } finally {
        if (alive) setLoadingM(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- derived ---------- */
  const coins = useMemo(() => [...new Set(methods.map((m) => m.coin))], [methods]);
  const ofCoin = methods.filter((m) => m.coin === coin);
  const method = ofCoin.find((m) => m.id === methodId) || null;
  const a = parseFloat(amt);

  const logoUrl = (c) => {
    const m = methods.find((x) => x.coin === c && (x.logo_url || x.icon_url));
    return m ? m.logo_url || m.icon_url : "";
  };

  const rangeMsg = (m) =>
    t("dpRange")
      .replace("{min}", fmt(m.min_amount))
      .replace("{max}", fmt(m.max_amount))
      .replace("{cur}", m.currency || m.coin);

  const qrSrc = method
    ? method.qr_image_url ||
      (method.address
        ? "https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=0&data=" + encodeURIComponent(method.address)
        : "")
    : "";

  /* ---------- actions ---------- */
  const pickCoin = (c) => {
    setCoin(c);
    clearMsg();
    setCopied(false);
    const list = methods.filter((m) => m.coin === c);
    setMethodId(list.length === 1 ? list[0].id : null);   // একটাই নেটওয়ার্ক হলে অটো সিলেক্ট
  };

  const pickNet = (id) => {
    setMethodId(id);
    clearMsg();
    setCopied(false);
  };

  const next = () => {
    if (!coin) return;
    if (!(a > 0)) return say(t("dpBadAmt"));
    // অন্তত একটি নেটওয়ার্কের রেঞ্জে amount মিলতে হবে
    if (!ofCoin.some((m) => a >= num(m.min_amount) && a <= num(m.max_amount))) {
      return say(rangeMsg(ofCoin[0]));
    }
    clearMsg();
    setStep(2);
  };

  const backBtn = () => {
    if (step === 2) {
      clearMsg();
      setStep(1);
    } else {
      go("home");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(method?.address || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      say(t("dpCopyFail"));
    }
  };

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try {
      setProof(await compressImage(f));
    } catch {
      say(t("dpImgFail"));
    }
  };

  const submit = async () => {
    if (busy || !method) return;
    if (W.guest) return W.needLogin();

    if (!(a > 0)) return say(t("dpBadAmt"));
    if (a < num(method.min_amount) || a > num(method.max_amount)) return say(rangeMsg(method));
    if (!proof) return say(t("dpProof"));
    if (txid.trim().length < 3) return say(t("dpBadTxid"));

    setBusy(true);
    clearMsg();
    try {
      await api("/deposit", {
        method: "POST",
        body: {
          payment_method_id: method.id,
          amount: a,
          txid: txid.trim(),
          sender_info: null,
          proof_url: proof,
        },
      });
      setAmt("");
      setTxid("");
      setProof("");
      setCoin("");
      setMethodId(null);
      setStep(1);
      say(t("dpOk"), true);
    } catch (e) {
      say(errText(e));
    }
    setBusy(false);
  };

  /* ---------- UI ---------- */
  return (
    <div className="dp">
      <style>{CSS}</style>

      <div className="dp-top">
        <button className="dp-ibtn back" onClick={backBtn} aria-label="Back"><IcBack /></button>
        <h1>{t("dpTitle")}</h1>
        <button className="dp-ibtn" onClick={() => setSupport(true)} aria-label="Customer service"><IcHeadset /></button>
      </div>

      <div className="dp-wrap">
        {loadingM && <div className="dp-center">{t("dpLoading")}</div>}

        {!loadingM && !methods.length && (
          <div className="dp-center">
            {t("dpNone")}
            {msg.text && <div className="dp-msg bad">{msg.text}</div>}
          </div>
        )}

        {!loadingM && methods.length > 0 && (
          <>
            {/* stepper */}
            <div className="dp-steps">
              <div className={"dp-st " + (step === 1 ? "on" : "done")}>
                <i>{step === 1 ? "1" : "✓"}</i><span>{L("dpStepA", "Coin & amount")}</span>
              </div>
              <div className={"dp-line" + (step === 2 ? " on" : "")} />
              <div className={"dp-st" + (step === 2 ? " on" : "")}>
                <i>2</i><span>{L("dpStepB", "Payment")}</span>
              </div>
            </div>

            {/* ============ STEP 1 — Coin + Amount ============ */}
            {step === 1 && (
              <>
                {msg.ok && <div className="dp-msg ok" style={{ marginTop: 0, marginBottom: 16 }}>{msg.text}</div>}

                <div className="dp-card">
                  <h2 className="dp-h">{L("dpCurrency", "Current currency")}</h2>
                  <p className="dp-sub">{L("dpPickCoin", "Choose the coin you will send.")}</p>

                  <div className="dp-coins">
                    {coins.map((c) => (
                      <button key={c} className={"dp-coin" + (c === coin ? " on" : "")} onClick={() => pickCoin(c)}>
                        <CoinLogo coin={c} url={logoUrl(c)} size={40} />
                        <span>
                          <b>{c}</b>
                          <small>{methods.filter((m) => m.coin === c).map((m) => m.network).filter(Boolean).join(" · ")}</small>
                        </span>
                        {c === coin && <span className="dp-tick"><IcCheck /></span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="dp-card">
                  <h2 className="dp-h">{L("dpEnterAmt", "Deposit amount")}</h2>
                  <p className="dp-sub">{L("dpEnterAmtSub", "Enter the amount you want to deposit.")}</p>

                  <div className="dp-amount">
                    <input
                      value={amt}
                      onChange={(e) => { setAmt(e.target.value); clearMsg(); }}
                      placeholder={L("dpQtyPh", "Please enter the quantity")}
                      inputMode="decimal"
                      onKeyDown={(e) => e.key === "Enter" && next()}
                    />
                    {coin && <em>{coin}</em>}
                  </div>

                  {coin && ofCoin.length === 1 && (
                    <div className="dp-hint">
                      {t("dpMin")} {fmt(ofCoin[0].min_amount)} · {t("dpMax")} {fmt(ofCoin[0].max_amount)} {ofCoin[0].currency || coin}
                    </div>
                  )}

                  {msg.text && !msg.ok && <div className="dp-msg bad">{msg.text}</div>}
                </div>

                <button className="dp-primary" onClick={next} disabled={!coin || !(a > 0)}>
                  {L("dpNext", "Next")}
                </button>
              </>
            )}

            {/* ============ STEP 2 — Network -> Address -> Submit ============ */}
            {step === 2 && (
              <>
                <div className="dp-sum">
                  <div className="dp-sum-l">
                    <CoinLogo coin={coin} url={logoUrl(coin)} size={36} />
                    <div>
                      <b>{fmt(a)} {coin}</b>
                      <small>{L("dpEnterAmt", "Deposit amount")}</small>
                    </div>
                  </div>
                  <button className="dp-link" onClick={backBtn}>{L("dpEdit", "Edit")}</button>
                </div>

                {ofCoin.length > 1 && (
                  <div className="dp-card">
                    <h2 className="dp-h">{L("dpNetwork", "Network")}</h2>
                    <p className="dp-sub">{L("dpPickNet", "Select the network you will send on.")}</p>
                    <div className="dp-nets">
                      {ofCoin.map((m) => (
                        <button key={m.id} className={"dp-net" + (m.id === methodId ? " on" : "")} onClick={() => pickNet(m.id)}>
                          {m.network || m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {method && (
                  <>
                    <div className="dp-card dp-pay">
                      {qrSrc && <div className="dp-qr"><img src={qrSrc} alt="QR code" /></div>}

                      {method.address && (
                        <>
                          <div className="dp-lbl">{L("dpAddr", "Deposit address")}</div>
                          <div className="dp-addr">
                            <span>{method.address}</span>
                            <button className={"dp-copy" + (copied ? " done" : "")} onClick={copy}>
                              {copied ? t("dpCopied") : t("dpCopy")}
                            </button>
                          </div>
                        </>
                      )}

                      <div className="dp-warn">
                        ⚠ {t("dpWarn").replace("{coin}", method.coin).replace("{net}", method.network || "")}
                      </div>
                      {method.instructions && <div className="dp-warn">{method.instructions}</div>}
                    </div>

                    <div className="dp-card">
                      <div className="dp-field">
                        <div className="dp-flbl">{L("dpVoucher", "Payment voucher")}</div>
                        <div className="dp-drop" onClick={() => fileRef.current && fileRef.current.click()}>
                          {proof ? (
                            <>
                              <img src={proof} alt="voucher" />
                              <button className="dp-rm" aria-label="Remove" onClick={(e) => { e.stopPropagation(); setProof(""); }}>✕</button>
                            </>
                          ) : (
                            <>
                              <IcCamera />
                              <span>{L("dpUpload", "Upload screenshot")}</span>
                            </>
                          )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
                      </div>

                      <div className="dp-field">
                        <div className="dp-flbl">{L("dpTxid", "TxID")}</div>
                        <input
                          className="dp-in"
                          value={txid}
                          onChange={(e) => setTxid(e.target.value)}
                          placeholder={L("dpTxidPh", "Enter the transaction ID")}
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </div>

                      {msg.text && !msg.ok && <div className="dp-msg bad">{msg.text}</div>}

                      <button className="dp-primary" style={{ marginTop: 20 }} onClick={submit} disabled={busy}>
                        {busy ? t("dpSubmitting") : t("dpSubmit")}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Customer service */}
      {support && (
        <div className="dp-ov" onClick={() => setSupport(false)}>
          <div className="dp-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="dp-sh-head">
              <span style={{ width: 42 }} />
              <h3>{L("dpSupport", "Customer service")}</h3>
              <button className="dp-ibtn" onClick={() => setSupport(false)} aria-label="Close"><IcClose /></button>
            </div>
            <div style={{ marginTop: 20 }}>
              {SUPPORT.map((s) => (
                <a key={s.url} className="dp-svc" href={s.url} target="_blank" rel="noopener noreferrer">
                  <span>{s.name}</span>
                  <IcRight />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
