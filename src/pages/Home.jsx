
import React, { useContext, useEffect, useState } from "react";
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

/* ====================== CONFIG ====================== */

export const API = "https://tread-d84x.onrender.com";

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
};

export const MARKETS = [
  "USDT", "TRX", "BTC", "ETH", "USDD", "USDC", "NFT",
];

export const QTY = [10, 1000, 10000, 1000000];
export const SECS = [20, 30, 70, 90, 180];
export const YIELD = 0.2;

export const ASSET_COINS = ["USDT", "USDC", "ETH", "BTC"];
export const TOPUP = 1000;

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

export const CS_LINKS = [
  "https://t.me/Michaelgwebb",
  "https://t.me/Michaelgwebb",
];

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

/* ====================== HOME ====================== */

const BANNERS = [img1, img2, img3];

/* ====================== MARKET LIST ====================== */

export function List({ P = {}, go, names }) {
  const t = useT();

  return (
    <>
      <div className="cx-th">
        <span>{t("name")}</span>
        <span>{t("lp")}</span>
        <span>{t("chg")}</span>
      </div>

      {COINS.map((s) => {
        const fallback = FALL[s];

        const item = P[s] || {
          price: fallback[0],
          chg: fallback[1],
          vol: fallback[2],
        };

        const price = Number(item.price) || fallback[0];
        const change = Number(item.chg) || 0;
        const volume = Number(item.vol) || fallback[2];

        return (
          <button
            key={s}
            type="button"
            className="cx-row"
            onClick={() => go("options", s)}
          >
            <span className="cx-nm">
              <Coin
                s={s}
                size={names ? 38 : 42}
              />

              {names ? (
                <span>
                  <b>
                    {s}
                    <small>/USDT</small>
                  </b>
                  <small>24H {fmtV(volume)}</small>
                </span>
              ) : (
                <b>
                  {s}
                  <small>/USDT</small>
                </b>
              )}
            </span>

            <span className="cx-pr">
              {names ? (
                <>
                  <b>{fmt(price)}</b>
                  <small>$ {price.toFixed(2)}</small>
                </>
              ) : (
                <b>{fmt(price)}</b>
              )}
            </span>

            <span
              className="cx-pill"
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
    </>
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

  const [i, setI] = useState(0);
  const [k, setK] = useState(0);
  const [cs, setCs] = useState(false);

  /* Banner slider */
  useEffect(() => {
    const id = setInterval(() => {
      setI((x) => (x + 1) % BANNERS.length);
    }, 3500);

    return () => clearInterval(id);
  }, []);

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
    <>
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

      {/* Banner */}
      <div className="cx-banner">
        <div
          className="cx-slides"
          style={{
            transform: `translateX(-${i * 100}%)`,
          }}
        >
          {BANNERS.map((b, n) => (
            <img
              key={n}
              src={b}
              alt=""
              draggable="false"
            />
          ))}
        </div>

        <div className="cx-dots">
          {BANNERS.map((_, d) => (
            <i
              key={d}
              className={d === i ? "on" : ""}
              onClick={() => setI(d)}
            />
          ))}
        </div>
      </div>

      {/* Market ticker */}
      <div className="cx-tick">
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
      <div className="cx-grid">
        {grid.map(([ic, l, fn]) => (
          <button
            type="button"
            key={l}
            onClick={fn}
          >
            <span
              style={{
                color: "#17c3c9",
                display: "flex",
              }}
            >
              <Ic d={ic} s={30} />
            </span>

            {t(l)}
          </button>
        ))}
      </div>

      {/* Market title */}
      <h3 className="cx-h">
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
    </>
  );
}
