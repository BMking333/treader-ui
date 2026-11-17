import React, { useContext, useEffect, useRef, useState } from "react";
import img1 from "../assets/Image1.png";
import img2 from "../assets/Image2.png";
import img3 from "../assets/Image3.png";
import {
  LANGS,
  RTL,
  T,
  LangCtx,
  LangPicker,
  translate,
  isLang,
} from "../lib/i18n";

/* ====================== EXPORTS ====================== */

export {
  LANGS,
  RTL,
  T,
  LangCtx,
  LangPicker,
  translate,
  isLang,
};

export const T2 = T;
export const T3 = T;

/* ====================== DEVICE VIEW (zoom lock) ====================== */

(function lockZoom() {
  if (typeof document === "undefined") return;
  const content =
    "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
  let m = document.querySelector('meta[name="viewport"]');
  if (!m) {
    m = document.createElement("meta");
    m.name = "viewport";
    document.head.appendChild(m);
  }
  m.setAttribute("content", content);
  if (!document.getElementById("cx-nozoom")) {
    const s = document.createElement("style");
    s.id = "cx-nozoom";
    s.textContent =
      "html,body{touch-action:manipulation;-webkit-text-size-adjust:100%;text-size-adjust:100%}";
    document.head.appendChild(s);
  }
  if (!window.__cxGesture) {
    window.__cxGesture = true;
    ["gesturestart", "gesturechange", "gestureend"].forEach((ev) =>
      document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
    );
  }
})();

/* ====================== CONFIG ====================== */

export const API = "https://api.cexcn.com";

export const BLUE = "#1f7acb";
export const GREEN = "#00c087";
export const RED = "#d84d5a";

export const CUP = "#0ecb81";
export const CDN = "#f6465d";

export const COINS = [
  "BTC", "ETH", "DOGE", "BCH", "LTC", "TRX",
  "SHIB", "ADA", "BSV", "ICP", "XRP", "ETC",
];

export const COL = {
  BTC: "#f7931a",
  ETH: "#627eea",
  DOGE: "#c2a633",
  BCH: "#8dc351",
  LTC: "#345d9d",
  TRX: "#eb0029",
  SHIB: "#e42d04",
  ADA: "#2563eb",
  BSV: "#eab300",
  ICP: "#7b3fe4",
  XRP: "#111",
  ETC: "#328332",
  USDT: "#26a17b",
  USDC: "#2775ca",
  PYUSD: "#0070e0",
  SOL: "#9945ff",
};

export const FALL = {
  BTC: [73618.71, -0.27, 1.4e8],
  ETH: [2046.75, -1.04, 9e7],
  DOGE: [0.067128, -1.58, 1e7],
  BCH: [228.86, -0.97, 16285],
  LTC: [49.77, -2.43, 164530],
  TRX: [0.317486, -0.04, 1.7e7],
  SHIB: [0.00000434, -2.91, 6.9e9],
  ADA: [0.172924, -1.28, 3.3e7],
  BSV: [15.8364, -2.52, 177887],
  ICP: [2.57, 0, 2008],
  XRP: [1.04406, -1.48, 2.7e7],
  ETC: [6.6095, -1.69, 124280],
  SOL: [150.0, 0, 1e6], 
};

export const MARKETS = [
  "USDT", "TRX", "BTC", "ETH", "USDD", "USDC", "NFT",
];

export const QTY = [10, 1000, 10000, 1000000];
export const SECS = [20, 30, 70, 90, 180];
export const YIELD = 0.2;

export const ASSET_COINS = ["USDT", "USDC", "ETH", "BTC"];
export const TOPUP = 1000;

/* ====================== NFT DATA ====================== */

export const NFTS = [
  { id: "cosmic-apes",  name: "Cosmic Apes",   floor: 2.35,  chg: 3.42,  items: 10000, owners: 5210, vol: 1280.5 },
  { id: "pixel-punks",  name: "Pixel Punks",   floor: 1.18,  chg: -1.27, items: 8888,  owners: 4120, vol: 842.3 },
  { id: "moon-cats",    name: "Moon Cats",     floor: 0.62,  chg: 5.81,  items: 6000,  owners: 3015, vol: 516.9 },
  { id: "neon-samurai", name: "Neon Samurai",  floor: 0.94,  chg: 0.35,  items: 7777,  owners: 3688, vol: 402.7 },
  { id: "zen-pandas",   name: "Zen Pandas",    floor: 0.41,  chg: -2.64, items: 5555,  owners: 2470, vol: 233.4 },
  { id: "cyber-foxes",  name: "Cyber Foxes",   floor: 0.27,  chg: 1.92,  items: 9999,  owners: 4302, vol: 188.1 },
  { id: "astro-owls",   name: "Astro Owls",    floor: 0.186, chg: -0.48, items: 4444,  owners: 1986, vol: 97.6 },
  { id: "lava-lions",   name: "Lava Lions",    floor: 0.092, chg: 7.15,  items: 3333,  owners: 1410, vol: 54.2 },
];

/* ====================== TRANSLATION ====================== */

export const useT = () => useContext(LangCtx).t;

/* ====================== FORMATTERS ====================== */

export const fmt = (p) => {
  const value = Number(p) || 0;

  return value >= 100
    ? value.toFixed(2)
    : value >= 1
      ? value.toFixed(4)
      : value >= 0.01
        ? value.toFixed(6)
        : value.toFixed(8);
};

export const fmtV = (v) => {
  const value = Number(v) || 0;

  return value >= 1e9
    ? (value / 1e9).toFixed(2) + "B"
    : value >= 1e6
      ? (value / 1e6).toFixed(2) + "M"
      : value >= 1e3
        ? (value / 1e3).toFixed(2) + "K"
        : value.toFixed(2);
};

/* ====================== LOCAL STORAGE ====================== */

export const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : d;
    } catch {
      return d;
    }
  },

  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

/* ====================== API HELPER ====================== */

export let TOKEN = store.get("cx_token", "");

let ON401 = () => {};

export const setOn401 = (fn) => {
  ON401 = typeof fn === "function" ? fn : () => {};
};

export const setToken = (v) => {
  TOKEN = v || "";
  store.set("cx_token", TOKEN);
};

const AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot",
];

export async function api(path, opt = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(opt.headers || {}),
  };

  if (TOKEN) {
    headers.Authorization = "Bearer " + TOKEN;
  }

  let r;

  try {
    r = await fetch(API + path, {
      method: opt.method || "GET",
      headers,
      body: opt.body !== undefined
        ? JSON.stringify(opt.body)
        : undefined,
    });
  } catch {
    throw new Error("neterr");
  }

  let j = null;

  try {
    j = await r.json();
  } catch {}

  if (!r.ok) {
    const d = j && j.detail;
    const code = typeof d === "string" ? d : "err";

    if (
      r.status === 401 &&
      !AUTH_PATHS.includes(path)
    ) {
      ON401();
      throw new Error("unauthorized");
    }

    throw new Error(code);
  }

  return j;
}

/* ====================== PRICE DATA ====================== */

const makeFallbackPrices = () =>
  Object.fromEntries(
    Object.entries(FALL).map(([k, v]) => [
      k,
      {
        price: v[0],
        chg: v[1],
        vol: v[2],
        hi: v[0] * 1.01,
        lo: v[0] * 0.99,
      },
    ])
  );

export function usePrices() {
  const [P, setP] = useState(makeFallbackPrices);

  useEffect(() => {
    let stop = false;

    const load = async () => {
      try {
        const j = await api("/market/tickers");

        if (stop || !j) return;

        const data = j.tickers || j;

        setP((old) => {
          const next = { ...old };

          Object.keys(FALL).forEach((symbol) => {
            const item = data[symbol];

            if (!item) return;

            const price = Number(item.price);
            const chg = Number(item.chg);
            const vol = Number(item.vol);

            next[symbol] = {
              ...old[symbol],
              ...item,
              price: Number.isFinite(price)
                ? price
                : old[symbol].price,
              chg: Number.isFinite(chg)
                ? chg
                : old[symbol].chg,
              vol: Number.isFinite(vol)
                ? vol
                : old[symbol].vol,
              hi: Number(item.hi) || old[symbol].hi,
              lo: Number(item.lo) || old[symbol].lo,
            };
          });

          return next;
        });
      } catch (err) {
        // Keep fallback prices if API is unavailable.
      }
    };

    load();

    const id = setInterval(load, 4000);

    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  return P;
}

/* ====================== ICON ====================== */

export const Ic = ({ d, s = 24 }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

export const ICON = {
  home: "M12 3l10 9h-3v9h-5v-6h-4v6H5v-9H2z",

  market:
    "M3 21v-8h4v8zm6 0V9h4v12zm6 0V4h4v17z",

  trade:
    "M12 5V1L7 6l5 5V7a6 6 0 11-6 6H4a8 8 0 108-8z",

  options:
    "M6 2h9l5 5v15H6zm3 9v2h8v-2zm0 4v2h8v-2z",

  assets:
    "M3 6a2 2 0 012-2h13v3h3v13H5a2 2 0 01-2-2zm14 8a1.5 1.5 0 100 3 1.5 1.5 0 000-3z",

  card:
    "M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm1 4v2h16V9z",

  chat:
    "M12 3a9 9 0 00-7.6 13.8L3 21l4.4-1.3A9 9 0 1012 3z",

  swap:
    "M7 7h11l-3-3 1.4-1.4L22 8l-5.6 5.4L15 12l3-3H7zm10 10H6l3 3-1.4 1.4L2 16l5.6-5.4L9 12l-3 3h11z",

  loan:
    "M12 22l-7-8h4V3h6v11h4z",

  eye:
    "M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 3a4 4 0 110 8 4 4 0 010-8z",

  menu:
    "M3 6h2v2H3zm4 0h14v2H7zM3 11h2v2H3zm4 0h14v2H7zM3 16h2v2H3zm4 0h14v2H7z",

  idcard:
    "M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm3 3v4h5V8zm7 0v2h5V8zm0 4v2h5v-2zM6 14v2h5v-2z",

  pin:
    "M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",

  share:
    "M18 16a3 3 0 00-2.2 1l-7-3.6a3 3 0 000-2.8l7-3.6A3 3 0 1015 6l-7 3.6a3 3 0 100 4.8l7 3.6a3 3 0 103-2z",

  bell:
    "M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1z",

  moon:
    "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",

  lock:
    "M6 10V8a6 6 0 1112 0v2h1a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V11a1 1 0 011-1zm2 0h8V8a4 4 0 10-8 0z",

  user:
    "M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z",

  doc:
    "M6 2h9l5 5v15H6zm3 9v2h8v-2zm0 4v2h8v-2z",

  candle:
    "M7 2h2v4h2v10H9v6H7v-6H5V6h2zm9 4h2v3h2v8h-2v3h-2v-3h-2V9h2z",

  headset:
    "M12 2a9 9 0 00-9 9v7a3 3 0 003 3h2v-8H5v-2a7 7 0 0114 0v2h-3v8h3a3 3 0 003-3v-7a9 9 0 00-9-9z",

  gear:
    "M12 8a4 4 0 100 8 4 4 0 000-8zm9 5v-2l-2.2-.6a7 7 0 00-.7-1.6l1.1-2-1.4-1.4-2 1.1a7 7 0 00-1.6-.7L13 3h-2l-.6 2.2a7 7 0 00-1.6.7l-2-1.1L5.4 6.2l1.1 2a7 7 0 00-.7 1.6L3.6 11v2l2.2.6c.2.6.4 1.1.7 1.6l-1.1 2 1.4 1.4 2-1.1c.5.3 1 .5 1.6.7L11 21h2l.6-2.2c.6-.2 1.1-.4 1.6-.7l2 1.1 1.4-1.4-1.1-2c.3-.5.5-1 .7-1.6z",
};

/* ====================== BRAND LOGO ====================== */

export const BrandMark = ({
  size = 26,
  color = "#19b0c8",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    aria-hidden="true"
  >
    <g
      fill="none"
      stroke={color}
      strokeWidth="8"
    >
      <path d="M76 16H50a34 34 0 000 68h26V66" />
      <path d="M76 33H50a17 17 0 000 34h26V54" />
      <path d="M76 49H54a3 3 0 000 6h22" />
    </g>
  </svg>
);

/* ====================== COIN LOGO ====================== */

const logoSrc = (s) => {
  const l = String(s || "").toLowerCase();

  return [
    `https://assets.coincap.io/assets/icons/${l}@2x.png`,
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${l}.png`,
    `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${l}.png`,
  ];
};

export function Coin({ s, size = 42 }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    setN(0);
  }, [s]);

  const src = logoSrc(s);

  if (n >= src.length) {
    return (
      <span
        className="cx-coin"
        style={{
          background: COL[s] || BLUE,
          width: size,
          height: size,
        }}
      >
        {String(s || "?")[0]}
      </span>
    );
  }

  return (
    <img
      key={s + n}
      className="cx-coin img"
      src={src[n]}
      width={size}
      height={size}
      alt={s}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setN((old) => old + 1)}
    />
  );
}

/* ====================== CUSTOMER SERVICE ====================== */
/* ====================== CUSTOMER SERVICE ====================== */

// Telegram username (@ chara). Dorkar hole 2nd agent-er alada username dao.
export const CS_USERS = ["cexcn_service", "cexcn_service"];

// Click korle chat-e age theke likha message (chaile "" rakhte paro)
export const CS_MSG = "Hello, I need help.";

export const tgLink = (user, msg = CS_MSG) => {
  const u = String(user || "").replace(/^@/, "").trim();
  return (
    "https://t.me/" +
    u +
    (msg ? "?text=" + encodeURIComponent(msg) : "")
  );
};

export const CS_LINKS = CS_USERS.map((u) => tgLink(u));

export function CSheet({ open, onClose }) {
  const t = useT();

  if (!open) return null;

  return (
    <div
      className="cx-over end"
      style={{ zIndex: 100 }}
      onClick={onClose}
    >
      <div
        className="cx-csh"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cx-csh-h">
          <b>{t("cs")}</b>

          <button
            type="button"
            onClick={onClose}
            aria-label="close"
          >
            ✕
          </button>
        </div>

        {CS_LINKS.map((u, i) => (
          <a
            key={i}
            className="cx-csh-r"
            href={u}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{t("cs")}-{i + 1}</span>
            <i>›</i>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ====================== PREMIUM STYLES (Home + Market list + NFT list) ====================== */


const HM_CSS = `
.hm{
  --bg:#ffffff;--card:#f5f7fa;--tx:#1b2433;--mu:#8e99ab;--ln:#e8ebf0;
  --up:#00c087;--dn:#e0485c;--ac:#17c3c9;--acbg:rgba(23,195,201,.12);
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Noto Sans","Noto Sans Bengali","Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
  text-rendering:optimizeLegibility;font-kerning:normal;
  color:var(--tx);background:var(--bg);touch-action:manipulation;
}
.cx.dark .hm{--bg:#11203a;--card:#0e1b30;--tx:#eaf0f8;--mu:#8795ac;--ln:#1e2e49;--acbg:rgba(23,195,201,.14)}
.hm *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.hm button{font-family:inherit;-webkit-font-smoothing:antialiased;cursor:pointer}
.hm .num{font-variant-numeric:tabular-nums}

/* banner (swipe) */
.hm-bn{position:relative;width:100%;margin:0;border-radius:0;overflow:hidden;background:var(--card);
  touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:grab;transition:height .3s ease}
.hm-bn:active{cursor:grabbing}
.hm-sl{display:flex;align-items:flex-start;width:100%;will-change:transform}
.hm-sl img{flex:0 0 100%;width:100%;height:auto;pointer-events:none;-webkit-user-drag:none;display:block}
.hm-dots{display:flex;justify-content:center;gap:6px;padding:10px 0 0}
.hm-dots i{display:block;width:6px;height:6px;border-radius:3px;background:rgba(138,150,172,.45);transition:width .28s ease,background .28s ease}
.hm-dots i.on{width:18px;background:var(--ac)}

/* ticker */
.hm-tk{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:14px 12px 0}
.hm-tk button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:11px 4px 10px;background:var(--card);
  border:1px solid var(--ln);border-radius:12px;color:var(--tx);transition:transform .12s ease}
.hm-tk button:active{transform:scale(.97)}
.hm-tk span{font-size:11.5px;font-weight:500;color:var(--mu);letter-spacing:.1px}
.hm-tk b{font-size:15px;font-weight:600;letter-spacing:-.2px;line-height:1.1;font-variant-numeric:tabular-nums}
.hm-tk em{font-style:normal;font-size:11.5px;font-weight:500;font-variant-numeric:tabular-nums}

/* quick menu */
.hm-gr{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:12px}
.hm-gr button{display:flex;align-items:center;gap:10px;min-height:52px;padding:8px 12px;min-width:0;text-align:left;
  background:var(--card);border:1px solid var(--ln);border-radius:12px;color:var(--tx);font-size:13px;font-weight:500;letter-spacing:.1px;
  transition:transform .12s ease,background .15s ease}
.hm-gr button:active{transform:scale(.975)}
.hm-gr .ic{display:flex;align-items:center;justify-content:center;flex:none;width:32px;height:32px;border-radius:10px;background:var(--acbg);color:var(--ac)}
.hm-gr .ic svg{width:19px;height:19px}
.hm-gr .tx{flex:1;min-width:0;white-space:normal;overflow-wrap:break-word;line-height:1.25}

/* list */
.hm-h{margin:8px 16px 6px;font-size:15px;font-weight:600;letter-spacing:-.1px}
.ls-th,.ls-row{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) 68px;align-items:center;gap:8px;padding:0 16px}
.ls-th{height:32px;font-size:11.5px;color:var(--mu);font-weight:500;border-top:1px solid var(--ln);border-bottom:1px solid var(--ln)}
.ls-th span:last-child{text-align:right}
.ls-row{width:100%;height:56px;background:transparent;border:0;border-bottom:1px solid var(--ln);color:var(--tx);text-align:left;
  transition:background .15s ease}
.ls-row:active{background:var(--card)}
.ls-nm{display:flex;align-items:center;gap:10px;min-width:0}
.ls-nm>span{display:flex;flex-direction:column;gap:3px;min-width:0}
.ls-nm b{font-size:13.5px;font-weight:600;letter-spacing:-.1px;white-space:nowrap}
.ls-nm b small{font-size:11px;font-weight:400;color:var(--mu);margin-left:1px}
.ls-nm>span>small{font-size:11px;color:var(--mu);font-variant-numeric:tabular-nums}
.ls-pr{display:flex;flex-direction:column;gap:3px;min-width:0}
.ls-pr b{font-size:13.5px;font-weight:500;font-variant-numeric:tabular-nums;white-space:nowrap}
.ls-pr small{font-size:11px;color:var(--mu);font-variant-numeric:tabular-nums}
.ls-pill{display:flex;align-items:center;justify-content:center;height:26px;border-radius:6px;color:#fff;font-size:12px;font-weight:500;
  font-variant-numeric:tabular-nums;letter-spacing:.1px}

/* NFT list */
.nft-av{flex:none;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;color:#fff;font-size:11.5px;font-weight:700;
  letter-spacing:.3px;text-shadow:0 1px 2px rgba(0,0,0,.28);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
.ls-row.nft{cursor:default}


.hm .cx-top h1{font-size:16px;font-weight:600;letter-spacing:-.1px}
.hm .cx-tabs button{font-size:12.5px!important;font-weight:500;letter-spacing:.1px}
.hm .cx-tabs button.on{font-weight:600}
.hm .cx-tabs.two button{font-size:12px!important}
.hm .cx-empty{font-size:12.5px;color:var(--mu)}
@media(max-width:360px){
  .hm-tk b{font-size:14px}.hm-gr button{font-size:12.5px;padding:0 10px;gap:8px}.ls-th,.ls-row{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) 64px}
}
@media(prefers-reduced-motion:reduce){.hm *{transition:none!important}}
`;

/* ====================== HOME ====================== */

const BANNERS = [img1, img2, img3];

/* ====================== SWIPE BANNER ====================== */


function Banner({ items }) {
  const n = items.length;
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [drag, setDrag] = useState(false);
  const box = useRef(null);
  const g = useRef({ on: false, x: 0, t: 0, raw: 0, lock: false });
  const [w, setW] = useState(0);
  const [rt, setRt] = useState({}); 

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setW(el.offsetWidth));
    ro.observe(el);
    setW(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const hgt = w && rt[i] ? Math.round(w / rt[i]) : undefined;

  useEffect(() => {
    if (drag || n < 2) return undefined;
    const id = setInterval(() => setI((x) => (x + 1) % n), 3500);
    return () => clearInterval(id);
  }, [drag, n, i]);

  const down = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    g.current = { on: true, x: e.clientX, t: Date.now(), raw: 0, lock: false };
  };

  const move = (e) => {
    const s = g.current;
    if (!s.on) return;
    const raw = e.clientX - s.x;
    if (!s.lock && Math.abs(raw) > 6) {
      s.lock = true;
      setDrag(true);
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    }
    if (!s.lock) return;
    s.raw = raw;
    const atEdge = (i === 0 && raw > 0) || (i === n - 1 && raw < 0);
    setDx(atEdge ? raw * 0.35 : raw);
  };

  const up = () => {
    const s = g.current;
    if (!s.on) return;
    s.on = false;
    const w = (box.current && box.current.offsetWidth) || 360;
    const dt = Math.max(1, Date.now() - s.t);
    const vel = s.raw / dt;
    if (s.lock) {
      if ((s.raw < -w * 0.18 || vel < -0.5) && i < n - 1) setI(i + 1);
      else if ((s.raw > w * 0.18 || vel > 0.5) && i > 0) setI(i - 1);
    }
    setDx(0);
    setDrag(false);
  };

  return (
    <>
      <div
        className="hm-bn"
        ref={box}
        style={hgt ? { height: hgt } : undefined}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onDragStart={(e) => e.preventDefault()}
      >
        <div
          className="hm-sl"
          style={{
            transform: `translate3d(calc(${-i * 100}% + ${dx}px),0,0)`,
            transition: drag ? "none" : "transform .42s cubic-bezier(.22,.8,.25,1)",
          }}
        >
          {items.map((b, k) => (
            <img
              key={k}
              src={b}
              alt=""
              draggable="false"
              onLoad={(e) => {
                const a = e.currentTarget.naturalWidth;
                const h = e.currentTarget.naturalHeight;
                if (a && h) setRt((o) => (o[k] === a / h ? o : { ...o, [k]: a / h }));
              }}
            />
          ))}
        </div>
      </div>

      <div className="hm-dots">
        {items.map((_, d) => (
          <i key={d} className={d === i ? "on" : ""} />
        ))}
      </div>
    </>
  );
}

/* ====================== MARKET LIST ====================== */


const STABLE_Q = { USDT: 1, USDC: 1, USDD: 1 };

const fq = (v) => {
  const x = Number(v) || 0;
  return x >= 100
    ? x.toFixed(2)
    : x >= 1
      ? x.toFixed(4)
      : x >= 0.01
        ? x.toFixed(6)
        : x >= 0.0001
          ? x.toFixed(8)
          : x.toFixed(10);
};

export function List({ P = {}, go, names, quote = "USDT" }) {
  const t = useT();

  const usd = (s) => {
    const it = P[s];
    const f = FALL[s];
    return Number(it && it.price) || (f ? f[0] : 0);
  };

  const chgOf = (s) => {
    const it = P[s];
    return Number(it && it.chg) || 0;
  };

  const isStable = STABLE_Q[quote] !== undefined;
  const baseUsd = isStable ? STABLE_Q[quote] : usd(quote) || 1;
  const baseChg = isStable ? 0 : chgOf(quote);

  const rows = COINS.filter((s) => s !== quote);

  return (
    <div className="hm">
      <style>{HM_CSS}</style>

      <div className="ls-th">
        <span>{t("name")}</span>
        <span>{t("lp")}</span>
        <span>{t("chg")}</span>
      </div>

      {rows.map((s) => {
        const fallback = FALL[s];

        const priceUsd = usd(s);
        const price = priceUsd / baseUsd;
        const change = chgOf(s) - baseChg;
        const volume = Number((P[s] && P[s].vol) || fallback[2]) || fallback[2];

        return (
          <button
            key={s}
            type="button"
            className="ls-row"
            onClick={() => go("options", s)}
          >
            <span className="ls-nm">
              <Coin
                s={s}
                size={names ? 34 : 36}
              />

              {names ? (
                <span>
                  <b>
                    {s}
                    <small>/{quote}</small>
                  </b>
                  <small className="num">24H {fmtV(volume)}</small>
                </span>
              ) : (
                <b>
                  {s}
                  <small>/{quote}</small>
                </b>
              )}
            </span>

            <span className="ls-pr">
              {names ? (
                <>
                  <b>{fq(price)}</b>
                  <small>$ {priceUsd >= 1 ? priceUsd.toFixed(2) : fmt(priceUsd)}</small>
                </>
              ) : (
                <b>{fq(price)}</b>
              )}
            </span>

            <span
              className="ls-pill"
              style={{
                background: change >= 0 ? GREEN : RED,
              }}
            >
              {change >= 0 ? "+" : ""}
              {Math.abs(change) < 0.005
                ? "0"
                : change.toFixed(2)}
              %
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ====================== NFT LIST ====================== */

const nftHue = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

const nftInit = (name) =>
  String(name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const kfmt = (n) => {
  const v = Number(n) || 0;
  return v >= 1e3 ? (v / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(v);
};

const nftFloor = (v) => (v >= 1 ? v.toFixed(2) : v.toFixed(3));

export function NftList({ P = {} }) {
  const t = useT();
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };

  const eth = Number(P.ETH && P.ETH.price) || FALL.ETH[0];

  return (
    <div className="hm">
      <style>{HM_CSS}</style>

      <div className="ls-th">
        <span>{tt("collection", "Collection")}</span>
        <span>{tt("floor", "Floor price")}</span>
        <span>{t("chg")}</span>
      </div>

      {NFTS.map((n) => {
        const h = nftHue(n.id);
        return (
          <div key={n.id} className="ls-row nft">
            <span className="ls-nm">
              <i
                className="nft-av"
                style={{ background: `linear-gradient(135deg,hsl(${h} 72% 56%),hsl(${(h + 45) % 360} 78% 44%))` }}
              >
                {nftInit(n.name)}
              </i>
              <span>
                <b>{n.name}</b>
                <small className="num">{kfmt(n.items)} {tt("items", "items")} · {kfmt(n.owners)} {tt("owners", "owners")}</small>
              </span>
            </span>

            <span className="ls-pr">
              <b>{nftFloor(n.floor)} ETH</b>
              <small>≈ $ {(n.floor * eth).toFixed(2)}</small>
            </span>

            <span
              className="ls-pill"
              style={{ background: n.chg >= 0 ? GREEN : RED }}
            >
              {n.chg >= 0 ? "+" : ""}
              {n.chg.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ====================== HOME PAGE ====================== */

export default function Home({
  P = {},
  go,
  lang,
  setLang,
  onMenu,
  notify,
  guest,
  askLogin,
  onRegister,
}) {
  const t = useT();

  const [k, setK] = useState(0);
  const [cs, setCs] = useState(false);

  /* Market ticker */
  useEffect(() => {
    const id = setInterval(() => {
      setK((x) => (x + 3) % COINS.length);
    }, 4000);

    return () => clearInterval(id);
  }, []);

  const tick = [0, 1, 2].map(
    (n) => COINS[(k + n) % COINS.length]
  );

  const grid = [
    [ICON.card, "rech", () => go("deposit")],
    [ICON.card, "wd", () => go("withdraw")],
    [ICON.chat, "cs", () => setCs(true)],
    [ICON.swap, "swap", () => go("exchangeb")],
    [ICON.loan, "loan", () => go("loans")],
    [ICON.card, "tf", () => go("changemoney")],
  ];

  const openReg = () => {
    if (onRegister) {
      onRegister();
    } else if (askLogin) {
      askLogin("register");
    }
  };

  return (
    <div className="hm">
      <style>{HM_CSS}</style>

      {/* Header */}
      <div className="cx-bar">
        <button
          type="button"
          className="cx-logo"
          onClick={onMenu}
          aria-label="menu"
        >
          <BrandMark size={28} />
        </button>

        {guest && (
          <div className="cx-bauth">
            <button
              type="button"
              className="cx-lgin"
              onClick={() => askLogin && askLogin("login")}
            >
              {t("login")}
            </button>

            <button
              type="button"
              className="cx-reg"
              onClick={openReg}
            >
              {t("register")}
            </button>
          </div>
        )}

        <LangPicker
          lang={lang}
          setLang={setLang}
        />
      </div>

      {/* Banner (swipe) */}
      <Banner items={BANNERS} />

      {/* Market ticker */}
      <div className="hm-tk">
        {tick.map((s) => {
          const fallback = FALL[s];

          const item = P[s] || {
            price: fallback[0],
            chg: fallback[1],
            vol: fallback[2],
          };

          const price = Number(item.price) || fallback[0];
          const change = Number(item.chg) || 0;

          return (
            <button
              type="button"
              key={s}
              onClick={() => go("options", s)}
            >
              <span>{s}/USDT</span>

              <b
                style={{
                  color: change >= 0 ? GREEN : RED,
                }}
              >
                {fmt(price)}
              </b>

              <em
                style={{
                  color: change >= 0 ? GREEN : RED,
                }}
              >
                {change >= 0 ? "+" : ""}
                {change.toFixed(2)}%
              </em>
            </button>
          );
        })}
      </div>

      {/* Quick menu */}
      <div className="hm-gr">
        {grid.map(([ic, l, fn]) => (
          <button
            type="button"
            key={l}
            onClick={fn}
          >
            <span className="ic">
              <Ic d={ic} s={22} />
            </span>

            <span className="tx">{t(l)}</span>
          </button>
        ))}
      </div>

      {/* Market title */}
      <h3 className="hm-h">
        {t("chg")}
      </h3>

      {/* Coin list */}
      <List
        P={P}
        go={go}
      />

      {/* Customer support */}
      <CSheet
        open={cs}
        onClose={() => setCs(false)}
      />
    </div>
  );
}
