import React, { useState, useRef, useEffect, useMemo } from "react";
import { useT, api } from "./Home";


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
// কয়েনের নেটওয়ার্কগুলোর মধ্যে TRC20 থাকলে সেটা, না থাকলে প্রথমটা
const preferNet = (list) => list.find((m) => /trc ?-?20/i.test(m.network || "")) || list[0] || null;

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

const inRange = (m, a) => a >= num(m.min_amount) && a <= num(m.max_amount);

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
.dp, .dp * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

/* ---------- Light (default) ---------- */
.dp {
  --bg: #f4f6fa;
  --panel: #ffffff;
  --panel2: #f4f6fb;
  --line: #e3e8f0;
  --line2: #d3dbe8;
  --text: #0f1b2e;
  --muted: #66758c;
  --ph: #9aa7bb;
  --blue: #1a6bff;
  --blue-soft: rgba(26,107,255,.08);
  --green: #12a870;
  --red: #e5484d;
  --red-soft: rgba(229,72,77,.08);
  --red-line: rgba(229,72,77,.28);
  --topbg: rgba(255,255,255,.92);
  --ghost: rgba(15,27,46,.05);
  --shadow: 0 1px 2px rgba(15,27,46,.04), 0 8px 24px rgba(30,60,110,.07);
  --sheet: #ffffff;
  --dash: #b9c6da;
  color-scheme: light;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding-bottom: 60px;
  font-family: Inter, "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ---------- Dark (App .cx.dark) ---------- */
.cx.dark .dp {
  --bg: #070e1a;
  --panel: #0e1a2c;
  --panel2: #0a1424;
  --line: #1a2b44;
  --line2: #243955;
  --text: #f3f7fd;
  --muted: #8494ae;
  --ph: #50617d;
  --blue: #4a9bff;
  --blue-soft: rgba(74,155,255,.12);
  --green: #2ecc8f;
  --red: #ff6b7a;
  --red-soft: rgba(255,107,122,.09);
  --red-line: rgba(255,107,122,.3);
  --topbg: rgba(14,26,44,.92);
  --ghost: rgba(255,255,255,.05);
  --shadow: 0 10px 28px rgba(0,0,0,.28);
  --sheet: #0e1a2c;
  --dash: #2f4468;
  color-scheme: dark;
}

.dp button { font-family: inherit; outline: none; }
.dp input, .dp input:focus, .dp input:focus-visible { outline: none; box-shadow: none; -webkit-appearance: none; appearance: none; }
.dp input:-webkit-autofill {
  -webkit-text-fill-color: var(--text);
  -webkit-box-shadow: 0 0 0 100px var(--panel2) inset;
  caret-color: var(--text);
}

/* top bar */
.dp-top {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-between;
  height: 58px; padding: 0 10px;
  background: var(--topbg); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.dp-top h1 { margin: 0; font-size: 17px; font-weight: 600; color: var(--text); }
.dp-ibtn {
  width: 42px; height: 42px; border: 0; background: transparent; color: var(--text);
  cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; border-radius: 12px;
}
.dp-ibtn:active { background: var(--ghost); }
.dp-ibtn svg { width: 24px; height: 24px; }
.cx[dir=rtl] .dp-ibtn.back { transform: scaleX(-1); }

.dp-wrap { max-width: 520px; margin: 0 auto; padding: 18px 16px 0; }

/* progress (3 segments, no labels) */
.dp-prog { display: flex; gap: 6px; margin: 0 0 18px; }
.dp-prog i { flex: 1; height: 4px; border-radius: 4px; background: var(--line2); transition: background .2s; }
.dp-prog i.on { background: var(--blue); }

/* card */
.dp-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 20px; padding: 20px 18px; margin-bottom: 16px;
  box-shadow: var(--shadow);
}
.dp-h { margin: 0 0 14px; font-size: 15px; font-weight: 700; color: var(--text); }
.dp-h.sp { margin-top: 22px; }

/* coin grid */
.dp-coins { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.dp-coin {
  position: relative; display: flex; align-items: center; gap: 12px; text-align: start;
  background: var(--panel); border: 1.5px solid var(--line); border-radius: 14px;
  padding: 12px; cursor: pointer; color: var(--text);
  transition: border-color .15s, background .15s;
}
.dp-coin:active { background: var(--ghost); }
.dp-coin.on { border-color: var(--blue); background: var(--blue-soft); }
.dp-coin b { display: block; font-size: 15px; font-weight: 700; }
.dp-coin small { display: block; color: var(--muted); font-size: 11.5px; margin-top: 2px; }

/* amount field */
.dp-amount {
  display: flex; align-items: center; gap: 10px;
  background: var(--panel2); border: 1.5px solid var(--line); border-radius: 14px;
  padding: 0 14px; height: 62px; transition: border-color .15s;
}
.dp-amount:focus-within { border-color: var(--blue); }
.dp-amount input {
  flex: 1; min-width: 0; background: transparent; border: 0; border-radius: 0; padding: 0;
  color: var(--text); font-size: 24px; font-weight: 700; font-family: inherit;
}
.dp-amount input::placeholder { color: var(--ph); font-weight: 400; font-size: 15px; }
.dp-amount em { font-style: normal; font-size: 14px; font-weight: 700; color: var(--muted); flex-shrink: 0; }
.dp-limit { margin: 10px 2px 0; font-size: 13px; color: var(--muted); }
.dp-limit b { color: var(--text); font-weight: 700; }

/* buttons */
.dp-primary {
  width: 100%; height: 56px; border: 0; border-radius: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: var(--blue); color: #fff; font-size: 16px; font-weight: 700;
  transition: transform .12s, opacity .15s;
}
.cx.dark .dp-primary { color: #06101f; }
.dp-primary svg { width: 20px; height: 20px; }
.cx[dir=rtl] .dp-primary svg { transform: scaleX(-1); }
.dp-primary:active { transform: scale(.985); }
.dp-primary:disabled { opacity: .45; cursor: not-allowed; }

/* summary */
.dp-sum { display: flex; align-items: center; gap: 12px; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--line); }
.dp-sum b { display: block; font-size: 18px; }
.dp-sum small { display: block; color: var(--muted); font-size: 12px; margin-top: 2px; }

/* network tabs */
.dp-nets { display: flex; gap: 6px; padding: 4px; background: var(--panel2); border: 1px solid var(--line); border-radius: 14px; margin-bottom: 18px; }
.dp-net {
  flex: 1; height: 42px; border-radius: 10px; cursor: pointer; border: 0;
  background: transparent; color: var(--muted); font-size: 14px; font-weight: 700; text-align: center;
  transition: background .15s, color .15s;
}
.dp-net.on { background: var(--blue); color: #fff; }
.cx.dark .dp-net.on { color: #06101f; }

/* pay details */
.dp-qr {
  width: 100%; max-width: 220px; aspect-ratio: 1 / 1; margin: 0 auto;
  background: #fff; border-radius: 16px; padding: 10px; overflow: hidden;
  border: 1px solid var(--line);
}
.dp-qr img { width: 100%; height: 100%; object-fit: contain; display: block; }
.dp-kv { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
.dp-kv:first-of-type { margin-top: 18px; border-top: 1px solid var(--line); }
.dp-kv span { color: var(--muted); }
.dp-kv b { font-weight: 700; }
.dp-lbl { margin-top: 16px; font-size: 13px; color: var(--muted); font-weight: 600; }
.dp-addr {
  margin-top: 8px; display: flex; align-items: center; gap: 10px;
  background: var(--panel2); border: 1px solid var(--line); border-radius: 12px; padding: 10px 10px 10px 14px;
}
.cx[dir=rtl] .dp-addr { padding: 10px 14px 10px 10px; }
.dp-addr span {
  flex: 1; min-width: 0; word-break: break-all; direction: ltr; text-align: start;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px; line-height: 1.5;
}
.dp-copy {
  flex-shrink: 0; border: 0; cursor: pointer; padding: 9px 14px; border-radius: 9px;
  background: var(--blue); color: #fff; font-size: 13px; font-weight: 700; text-align: center;
}
.cx.dark .dp-copy { color: #06101f; }
.dp-copy.done { background: var(--green); color: #052a1d; }
.dp-warn {
  margin-top: 16px; padding: 12px 14px; border-radius: 12px;
  display: flex; gap: 10px; align-items: flex-start;
  background: var(--red-soft); border: 1px solid var(--red-line);
  color: var(--red); font-size: 13px; line-height: 1.55; font-weight: 600;
}
.dp-warn svg { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
.dp-note { margin-top: 12px; font-size: 12.5px; line-height: 1.55; color: var(--muted); white-space: pre-wrap; }

/* submit form */
.dp-field + .dp-field { margin-top: 18px; }
.dp-flbl { font-size: 13px; color: var(--muted); font-weight: 600; margin-bottom: 8px; }
.dp-drop {
  position: relative; cursor: pointer; width: 100%; min-height: 150px;
  background: var(--panel2); border: 1.5px dashed var(--dash); border-radius: 14px; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  color: var(--muted); font-size: 13px; transition: border-color .15s;
}
.dp-drop:hover { border-color: var(--blue); }
.dp-drop svg { width: 32px; height: 32px; }
.dp-drop img { width: 100%; max-height: 280px; object-fit: contain; display: block; background: #000; }
.dp-rm {
  position: absolute; top: 8px; inset-inline-end: 8px; width: 30px; height: 30px; border: 0;
  border-radius: 50%; background: rgba(0,0,0,.7); color: #fff; font-size: 13px; cursor: pointer; text-align: center;
}
.dp-in {
  display: block; width: 100%; height: 52px; background: var(--panel2);
  border: 1.5px solid var(--line); border-radius: 12px;
  color: var(--text); font-size: 15px; padding: 0 14px; font-family: inherit;
  transition: border-color .15s;
}
.dp-in::placeholder { color: var(--ph); }
.dp-in:focus { border-color: var(--blue); }

.dp-msg { margin: 14px 0 0; padding: 12px 14px; border-radius: 12px; font-size: 13.5px; line-height: 1.5; }
.dp-msg.bad { background: var(--red-soft); color: var(--red); border: 1px solid var(--red-line); }

.dp-center { text-align: center; color: var(--muted); padding: 60px 10px; font-size: 15px; }

/* success */
.dp-done { text-align: center; padding: 56px 20px 40px; }
.dp-done-ic {
  width: 76px; height: 76px; margin: 0 auto 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(18,168,112,.12); color: var(--green);
}
.dp-done-ic svg { width: 38px; height: 38px; stroke-width: 2.6; }
.dp-done h2 { margin: 0; font-size: 20px; font-weight: 700; line-height: 1.4; }

/* support sheet */
.dp-ov { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.55); display: flex; align-items: flex-end; justify-content: center; }
.dp-sheet {
  width: 100%; max-width: 640px; background: var(--sheet); color: var(--text);
  border-radius: 24px 24px 0 0; padding: 18px 20px 28px; animation: dpUp .2s ease-out;
}
@keyframes dpUp { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .dp-sheet { animation: none; } .dp-primary, .dp-prog i { transition: none; } }
.dp-sh-head { display: flex; align-items: center; justify-content: space-between; min-height: 40px; }
.dp-sh-head h3 { margin: 0; font-size: 19px; font-weight: 700; flex: 1; text-align: center; }
.dp-svc {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  border: 0; border-top: 1px solid var(--line); background: transparent; color: var(--text);
  font-size: 17px; padding: 18px 2px; cursor: pointer; text-align: start; text-decoration: none;
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
const IcArrow = () => <Svg><line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></Svg>;
const IcShield = () => <Svg><path d="M12 3l7 3v5c0 4.500-3 8-7 10-4-2-7-5.500-7-10V6l7-3z" /><polyline points="9 12 11.200 14.200 15.200 10" /></Svg>;
const IcClose = () => <Svg><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></Svg>;
const IcAlert = () => <Svg><path d="M12 3.500 2.500 20h19L12 3.500z" /><line x1="12" y1="10" x2="12" y2="14" /><line x1="12" y1="17" x2="12" y2="17.010" /></Svg>;
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

/*
  Steps
  1 = select coin + enter amount
  2 = coin / QR / network / address / warning  -> "Confirm payment"
  3 = TxID + deposit slip screenshot           -> submit
  4 = success message
*/
export default function Deposit({ W, go }) {
  const t = useT();
  // সব অনুবাদ i18n.jsx থেকে আসে। কী না পাওয়া গেলে ইংরেজি fb দেখায়।
  const L = (key, fb) => {
    const s = t(key);
    return s && s !== key ? s : fb;
  };

  const [methods, setMethods] = useState([]);
  const [loadingM, setLoadingM] = useState(true);

  const [step, setStep] = useState(1);
  const [coin, setCoin] = useState("");
  const [amt, setAmt] = useState("");
  const [methodId, setMethodId] = useState(null);

  const [txid, setTxid] = useState("");
  const [proof, setProof] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [support, setSupport] = useState(false);
  const fileRef = useRef(null);

  const say = (text) => setMsg(text);
  const clearMsg = () => setMsg("");
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
        if (!alive) return;
        setMethods(list);
        const startCoin = list.some((m) => m.coin === "USDT") ? "USDT" : (list[0] && list[0].coin) || "";
        if (startCoin) {
          setCoin(startCoin);
          const pm = preferNet(list.filter((m) => m.coin === startCoin));
          setMethodId(pm ? pm.id : null);
        }
      } catch (e) {
        if (alive) say(errText(e));
      } finally {
        if (alive) setLoadingM(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // নতুন স্টেপে গেলে উপরে স্ক্রল
  useEffect(() => {
    try { window.scrollTo(0, 0); } catch { /* ignore */ }
  }, [step]);

  /* ---------- derived ---------- */
  const coins = useMemo(() => [...new Set(methods.map((m) => m.coin))], [methods]);
  const ofCoin = methods.filter((m) => m.coin === coin);
  const a = parseFloat(amt);

  // যে নেটওয়ার্কগুলোর রেঞ্জে amount মেলে (step 2-তে শুধু সেগুলোই দেখাবে)
  const fit = a > 0 ? ofCoin.filter((m) => inRange(m, a)) : ofCoin;
  const method = ofCoin.find((m) => m.id === methodId) || null;

  // সিলেক্ট করা কয়েনের লিমিট (যেমন 50 – 1000)
  const limit = ofCoin.length
    ? {
        min: Math.min(...ofCoin.map((m) => num(m.min_amount))),
        max: Math.max(...ofCoin.map((m) => num(m.max_amount))),
        cur: ofCoin[0].currency || ofCoin[0].coin,
      }
    : null;

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
    const pm = preferNet(methods.filter((m) => m.coin === c));   // USDT -> TRC20 অটো
    setMethodId(pm ? pm.id : null);
  };

  const pickNet = (id) => {
    setMethodId(id);
    clearMsg();
    setCopied(false);
  };

  // Step 1 -> 2
  const toPay = () => {
    if (!coin) return;
    if (!(a > 0)) return say(t("dpBadAmt"));
    const ok = ofCoin.filter((m) => inRange(m, a));
    if (!ok.length) return say(rangeMsg(ofCoin[0]));
    const pm = preferNet(ok);
    setMethodId(pm ? pm.id : null);
    clearMsg();
    setStep(2);
  };

  // Step 2 -> 3
  const toProof = () => {
    if (!method) return;
    clearMsg();
    setStep(3);
  };

  const backBtn = () => {
    clearMsg();
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else go("home");
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
      clearMsg();
    } catch {
      say(t("dpImgFail"));
    }
  };

  // Step 3 -> 4
  const submit = async () => {
    if (busy || !method) return;
    if (W.guest) return W.needLogin();

    if (!(a > 0)) return say(t("dpBadAmt"));
    if (!inRange(method, a)) return say(rangeMsg(method));
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
      setStep(4);
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
        <button className="dp-ibtn back" onClick={step === 4 ? () => go("home") : backBtn} aria-label="Back"><IcBack /></button>
        <h1>{t("dpTitle")}</h1>
        <button className="dp-ibtn" onClick={() => setSupport(true)} aria-label="Customer service"><IcHeadset /></button>
      </div>

      <div className="dp-wrap">
        {loadingM && <div className="dp-center">{t("dpLoading")}</div>}

        {!loadingM && !methods.length && (
          <div className="dp-center">
            {t("dpNone")}
            {msg && <div className="dp-msg bad">{msg}</div>}
          </div>
        )}

        {!loadingM && methods.length > 0 && (
          <>
            {step < 4 && (
              <div className="dp-prog" aria-hidden="true">
                <i className={step >= 1 ? "on" : ""} />
                <i className={step >= 2 ? "on" : ""} />
                <i className={step >= 3 ? "on" : ""} />
              </div>
            )}

            {/* ============ STEP 1 — select coin + amount ============ */}
            {step === 1 && (
              <>
                <div className="dp-card">
                  <h2 className="dp-h">{L("dpSelCoin", "Select coin")}</h2>
                  <div className="dp-coins">
                    {coins.map((c) => (
                      <button key={c} className={"dp-coin" + (c === coin ? " on" : "")} onClick={() => pickCoin(c)}>
                        <CoinLogo coin={c} url={logoUrl(c)} size={38} />
                        <span>
                          <b>{c}</b>
                          <small>{methods.filter((m) => m.coin === c).map((m) => m.network).filter(Boolean).join(" · ")}</small>
                        </span>
                      </button>
                    ))}
                  </div>

                  {coin && (
                    <>
                      <h2 className="dp-h sp">{L("dpEnterAmt", "Deposit amount")}</h2>
                      <div className="dp-amount">
                        <input
                          value={amt}
                          onChange={(e) => { setAmt(e.target.value); clearMsg(); }}
                          placeholder={L("dpQtyPh", "Please enter the quantity")}
                          inputMode="decimal"
                          onKeyDown={(e) => e.key === "Enter" && toPay()}
                        />
                        <em>{coin}</em>
                      </div>

                      {limit && (
                        <div className="dp-limit">
                          {L("dpLimit", "Limit")}: <b>{fmt(limit.min)} - {fmt(limit.max)} {limit.cur}</b>
                        </div>
                      )}
                    </>
                  )}

                  {msg && <div className="dp-msg bad">{msg}</div>}
                </div>

                <button className="dp-primary" onClick={toPay} disabled={!coin || !(a > 0)}>
                  <span>{L("dpNext", "Next")}</span><IcArrow />
                </button>
              </>
            )}

            {/* ============ STEP 2 — QR + network + address + warning ============ */}
            {step === 2 && (
              <>
                <div className="dp-card">
                  <div className="dp-sum">
                    <CoinLogo coin={coin} url={logoUrl(coin)} size={38} />
                    <div>
                      <b>{fmt(a)} {coin}</b>
                      <small>{L("dpEnterAmt", "Deposit amount")}</small>
                    </div>
                  </div>

                  {fit.length > 1 && (
                    <div className="dp-nets">
                      {fit.map((m) => (
                        <button key={m.id} className={"dp-net" + (m.id === methodId ? " on" : "")} onClick={() => pickNet(m.id)}>
                          {m.network || m.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {method ? (
                    <>
                      {qrSrc && <div className="dp-qr"><img src={qrSrc} alt="QR code" /></div>}

                      <div className="dp-kv"><span>{L("dpCoin", "Coin")}</span><b>{method.coin}</b></div>
                      <div className="dp-kv"><span>{L("dpNetwork", "Network")}</span><b>{method.network || method.name}</b></div>

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

                      <div className="dp-warn" role="alert">
                        <IcAlert />
                        <span>
                          {L(
                            "dpWarn",
                            "Send only {coin} on the {net} network to this address. Sending a different coin or using a different network or wallet will result in permanent loss of your funds."
                          )
                            .replace("{coin}", method.coin)
                            .replace("{net}", method.network || "")}
                        </span>
                      </div>

                      {method.instructions && <div className="dp-note">{method.instructions}</div>}
                    </>
                  ) : (
                    <div className="dp-msg bad">{t("dpUnavail")}</div>
                  )}
                </div>

                <button className="dp-primary" onClick={toProof} disabled={!method}>
                  <IcShield /><span>{L("dpConfirmPay", "Confirm payment")}</span>
                </button>
              </>
            )}

            {/* ============ STEP 3 — TxID + deposit slip ============ */}
            {step === 3 && (
              <>
                <div className="dp-card">
                  <div className="dp-field">
                    <div className="dp-flbl">{L("dpTxid", "Transaction ID (TxID)")}</div>
                    <input
                      className="dp-in"
                      value={txid}
                      onChange={(e) => { setTxid(e.target.value); clearMsg(); }}
                      placeholder={L("dpTxidPh", "Enter the transaction ID")}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>

                  <div className="dp-field">
                    <div className="dp-flbl">{L("dpVoucher", "Deposit slip screenshot")}</div>
                    <div className="dp-drop" onClick={() => fileRef.current && fileRef.current.click()}>
                      {proof ? (
                        <>
                          <img src={proof} alt="Deposit slip" />
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

                  {msg && <div className="dp-msg bad">{msg}</div>}
                </div>

                <button className="dp-primary" onClick={submit} disabled={busy}>
                  <span>{busy ? t("dpSubmitting") : t("dpSubmit")}</span>
                </button>
              </>
            )}

            {/* ============ STEP 4 — success ============ */}
            {step === 4 && (
              <div className="dp-done" role="status">
                <div className="dp-done-ic"><IcCheck /></div>
                <h2>{L("dpReqOk", "Payment request submitted successfully")}</h2>
              </div>
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
