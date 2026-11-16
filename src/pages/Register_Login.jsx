import React, { useCallback, useEffect, useRef, useState } from "react";
import { useT, api, store, CSheet } from "./Home";
import { LANGS } from "../lib/i18n";

/* =========================================================
   Register_Login.jsx  (Premium UI)
   - Light + Dark theme (default: LIGHT), toggle in top bar
   - Language picker uses ALL languages from ../lib/i18n (theme-aware)
   - Customer service sheet follows light / dark theme
   - Theme choice is remembered (store key: cx_theme)
   - No blue focus border on inputs
   - Login / Register buttons always visible (page scrolls itself)
   - Custom SVG icons
   - Password: minimum 6 / maximum 12 characters
   ========================================================= */

const mailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const pwOk = (p) => p.length >= 6 && p.length <= 12;

const strength = (p) => {
  if (!p) return 0;
  let s = 1;
  if (p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p)) s++;
  if (p.length >= 10 && /[^A-Za-z0-9]/.test(p)) s++;
  return s;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Fallback text: used when the translation file returns the key itself */
const FB = {
  login: "Log in",
  register: "Create account",
  email: "Email",
  acc: "Enter your email",
  pwLbl: "Password",
  pw: "Enter your password",
  pw2Lbl: "Confirm password",
  pw2: "Re-enter your password",
  rem: "Remember me",
  forgot: "Forgot password?",
  bEmail: "Enter a valid email address",
  bMatch: "Passwords do not match",
  pwRule: "Password must be 6 to 12 characters",
  wait2: "Please wait…",
  err: "Something went wrong. Please try again.",
  loginOk: "Login successful",
  regOk: "Registration successful",
  loginTitle: "Welcome back",
  loginSub: "Sign in to continue to your account.",
  createAcc: "Create your account",
  createSub: "It only takes a minute to get started.",
  haveAcc: "Already have an account?",
  noAcc: "New here?",
  or: "or",
  guest: "Continue as guest",
  csHelp: "Need help? Contact support",
  strWeak: "Weak",
  strMid: "Medium",
  strStrong: "Strong",
};

const NONE = { k: "", kind: "" };

/* ================= THEME ================= */

const THEME_KEY = "cx_theme";

function readTheme() {
  let v = "light";
  try {
    v = store.get(THEME_KEY, "light");
  } catch (_) {
    v = "light";
  }
  return v === "dark" ? "dark" : "light"; // default = light
}

function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  const toggle = useCallback(() => {
    setTheme((cur) => {
      const next = cur === "dark" ? "light" : "dark";
      try {
        store.set(THEME_KEY, next);
      } catch (_) {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  return [theme, toggle];
}

/* ================= LANGUAGE PICKER (theme-aware) ================= */

function LangPicker({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cur = LANGS.find((l) => l[0] === lang) || LANGS[1];

  useEffect(() => {
    if (!open) return;
    const away = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("touchstart", away);
    };
  }, [open]);

  return (
    <div className="ax-lg" ref={ref}>
      <button
        type="button"
        className="ax-lgb"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{cur[1]}</span>
        <span className="ax-fl">{cur[2]}</span>
      </button>

      {open && (
        <div className="ax-lgm" role="listbox">
          {LANGS.map(([code, name, flag]) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={code === cur[0]}
              className={"ax-lgi" + (code === cur[0] ? " on" : "")}
              onClick={() => {
                setLang && setLang(code);
                setOpen(false);
              }}
            >
              <span>{name}</span>
              <span className="ax-fl">{flag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= ICONS ================= */

const PATHS = {
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3.5" />
      <path d="m4.5 8.5 7.5 5 7.5-5" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="3" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 4l16 16" />
      <path d="M10.2 6a9 9 0 0 1 1.8-.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8" />
      <path d="M6.5 7.5C4 9.2 2.5 12 2.5 12S6 18.5 12 18.5c1.4 0 2.7-.3 3.8-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  chat: <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4A8 8 0 1 1 20 12Z" />,
  back: <path d="m15 5-7 7 7 7" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 7v6" />
      <path d="M12 17v.01" />
    </>
  ),
  info: (
    <>
      <path d="M12 11v6" />
      <path d="M12 7v.01" />
    </>
  ),
};

function Icon({ n, s = 20, w = 1.8 }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[n]}
    </svg>
  );
}

/* ================= CSS ================= */

const CSS = `
.ax, .ax * { box-sizing: border-box; }

/* ---------- LIGHT theme (default) ---------- */
.ax {
  --bg: #f3f6fb;
  --card: rgba(255,255,255,.92);
  --card-line: rgba(15,30,60,.08);
  --card-shadow: 0 20px 50px rgba(30,60,110,.12), inset 0 1px 0 rgba(255,255,255,.9);
  --field: #f6f8fc;
  --field-focus: #ffffff;
  --line: #d9e1ee;
  --line-focus: #9fb2d0;
  --text: #0f1b30;
  --label: #3b4a65;
  --muted: #6b7a93;
  --placeholder: #9aa7bd;
  --accent: #129fb6;
  --accent-bg: rgba(18,159,182,.10);
  --danger: #e0415f;
  --ok: #0fa968;
  --warn: #d89a1f;
  --glow1: rgba(38,191,214,.22);
  --glow2: rgba(40,120,224,.14);
  --btn-sh: 0 12px 26px rgba(40,125,225,.30);
  --btn2-bg: #ffffff;
  --btn2-bg-active: #eef2f9;
  --btn2-line: #cfd9ea;
  --btn2-text: #14233d;
  --ghost-bg: rgba(15,30,60,.04);
  --or-line: rgba(15,30,60,.12);
  --ck-line: #b5c2d9;
  --track: #dde4f0;
  --autofill: #f6f8fc;
  --logo-bg: linear-gradient(160deg, #ffffff, #e9f7fa);
  --logo-ring: 0 0 0 6px rgba(38,191,214,.12), 0 12px 30px rgba(38,191,214,.28);
  --ov: rgba(20,32,56,.40);
  --tcard-bg: #ffffff;
  --tcard-line: rgba(15,30,60,.08);
  --tcard-text: #0f1b30;
  --tcard-shadow: 0 24px 60px rgba(20,40,80,.25);
  --info: #2f8cff;
  --info-bg: rgba(47,140,255,.12);
  --info-ring: rgba(47,140,255,.25);
  --menu-bg: #ffffff;
  --menu-line: rgba(15,30,60,.08);
  --menu-text: #14233d;
  --menu-hover: #eef3fa;
  --menu-active: #129fb6;
  --menu-shadow: 0 18px 44px rgba(20,40,80,.22);

  position: fixed;
  inset: 0;
  z-index: 40;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: var(--bg);
  color: var(--text);
  color-scheme: light;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
  transition: background .25s, color .25s;
}

/* ---------- DARK theme ---------- */
.ax[data-theme="dark"] {
  --bg: #070d1a;
  --card: rgba(18,28,48,.78);
  --card-line: rgba(255,255,255,.07);
  --card-shadow: 0 24px 60px rgba(0,0,0,.40), inset 0 1px 0 rgba(255,255,255,.05);
  --field: #0b1424;
  --field-focus: #0d172a;
  --line: #22314b;
  --line-focus: #3a5278;
  --text: #f1f5fb;
  --label: #c4d0e3;
  --muted: #8392ab;
  --placeholder: #5f6f8a;
  --accent: #26bfd6;
  --accent-bg: rgba(38,191,214,.10);
  --danger: #f0627d;
  --ok: #19c37d;
  --warn: #e5ad40;
  --glow1: rgba(38,191,214,.22);
  --glow2: rgba(40,120,224,.18);
  --btn-sh: 0 12px 28px rgba(40,125,225,.35);
  --btn2-bg: rgba(255,255,255,.04);
  --btn2-bg-active: rgba(255,255,255,.08);
  --btn2-line: #2d4163;
  --btn2-text: #e6edf9;
  --ghost-bg: rgba(255,255,255,.04);
  --or-line: rgba(255,255,255,.09);
  --ck-line: #3a4c6b;
  --track: #2a3a55;
  --autofill: #0b1424;
  --logo-bg: linear-gradient(160deg, #ffffff, #e6f6fa);
  --logo-ring: 0 0 0 6px rgba(38,191,214,.10), 0 14px 34px rgba(38,191,214,.30);
  --ov: rgba(2,6,14,.65);
  --tcard-bg: #131c2e;
  --tcard-line: rgba(255,255,255,.08);
  --tcard-text: #e8edf7;
  --tcard-shadow: 0 24px 64px rgba(0,0,0,.55);
  --menu-bg: #131d33;
  --menu-line: rgba(255,255,255,.07);
  --menu-text: #e6edf9;
  --menu-hover: rgba(255,255,255,.06);
  --menu-active: #4aa3ff;
  --menu-shadow: 0 18px 44px rgba(0,0,0,.55);
  color-scheme: dark;
}

/* soft ambient glow */
.ax::before, .ax::after {
  content: "";
  position: fixed;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(70px);
  z-index: 0;
}
.ax::before {
  width: 320px; height: 320px;
  top: -140px; left: 50%;
  margin-left: -160px;
  background: var(--glow1);
}
.ax::after {
  width: 260px; height: 260px;
  bottom: -120px; right: -90px;
  background: var(--glow2);
}

.ax-box {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 0 20px calc(32px + env(safe-area-inset-bottom, 0px));
}

.ax button, .ax input { font-family: inherit; }
.ax button { cursor: pointer; -webkit-appearance: none; appearance: none; }

/* ---------- top bar ---------- */
.ax-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 0 0;
}
.ax-topr { display: flex; align-items: center; gap: 10px; }
.ax .ax-back,
.ax .ax-theme {
  width: 42px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--ghost-bg);
  color: var(--text);
  outline: none;
  transition: background .2s, border-color .2s, color .2s;
}
.ax .ax-theme { color: var(--accent); }
.ax .ax-back:active,
.ax .ax-theme:active { transform: scale(.94); }


/* ---------- language picker ---------- */
.ax-lg { position: relative; }
.ax .ax-lgb {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 4px 0 8px;
  border: 0;
  background: transparent;
  color: var(--text);
  font-size: 17px;
  font-weight: 500;
  outline: none;
}
.ax-fl { font-size: 24px; line-height: 1; }
.ax-lgm {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 60;
  width: 240px;
  max-width: calc(100vw - 28px);
  max-height: min(62vh, 440px);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 18px;
  border: 1px solid var(--menu-line);
  background: var(--menu-bg);
  box-shadow: var(--menu-shadow);
}
.ax .ax-lgi {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 54px;
  padding: 0 18px;
  border: 0;
  border-bottom: 1px solid var(--menu-line);
  background: transparent;
  color: var(--menu-text);
  font-size: 16px;
  font-weight: 500;
  text-align: left;
  outline: none;
}
.ax .ax-lgi:last-child { border-bottom: 0; }
.ax .ax-lgi:active { background: var(--menu-hover); }
.ax .ax-lgi.on { color: var(--menu-active); font-weight: 700; }


/* ---------- customer service sheet (follows theme) ---------- */
.ax-csw { position: fixed; inset: 0; z-index: 900; }
/* the sheet itself is dark by design: in LIGHT mode flip it to a light look */
.ax[data-theme="light"] .ax-csw { filter: invert(1) hue-rotate(180deg); }

/* ---------- brand ---------- */
.ax-logo {
  width: 68px; height: 68px;
  margin: 22px auto 18px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 21px;
  background: var(--logo-bg);
  box-shadow: var(--logo-ring);
}
.ax-logo svg { width: 42px; height: 42px; }

.ax-head { text-align: center; margin-bottom: 22px; }
.ax-head h1 {
  margin: 0 0 6px;
  font-size: 27px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -.5px;
  color: var(--text);
}
.ax-head p { margin: 0; font-size: 14px; color: var(--muted); }

/* ---------- card ---------- */
.ax-card {
  padding: 22px 18px 20px;
  border-radius: 24px;
  border: 1px solid var(--card-line);
  background: var(--card);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  box-shadow: var(--card-shadow);
}

/* ---------- field ---------- */
.ax-fd { margin-bottom: 16px; }
.ax-fd label {
  display: block;
  margin: 0 0 8px 2px;
  font-size: 13px;
  font-weight: 600;
  color: var(--label);
}
.ax-fw {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 6px 0 10px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--field);
  transition: border-color .18s, background .18s;
}
/* focus: only a soft border change, NO blue ring / glow */
.ax-fw:focus-within { border-color: var(--line-focus); background: var(--field-focus); }
.ax-fw.err { border-color: var(--danger); }

.ax-fi {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  margin-right: 10px;
  border-radius: 11px;
  background: var(--accent-bg);
  color: var(--accent);
  flex-shrink: 0;
}

.ax .ax-in,
.ax .ax-in:focus,
.ax .ax-in:active {
  flex: 1;
  width: 0;
  min-width: 0;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0 !important;
  border-radius: 0;
  outline: none !important;
  box-shadow: none !important;
  -webkit-appearance: none;
  appearance: none;
  background: transparent !important;
  color: var(--text);
  -webkit-text-fill-color: var(--text);
  caret-color: var(--accent);
  font-size: 15px;
  letter-spacing: .2px;
}
.ax .ax-in::placeholder {
  color: var(--placeholder);
  -webkit-text-fill-color: var(--placeholder);
  opacity: 1;
}
/* autofill: no coloured box behind saved email / password */
.ax .ax-in:-webkit-autofill,
.ax .ax-in:-webkit-autofill:hover,
.ax .ax-in:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--text) !important;
  caret-color: var(--accent);
  -webkit-box-shadow: 0 0 0 1000px var(--autofill) inset !important;
  box-shadow: 0 0 0 1000px var(--autofill) inset !important;
  transition: background-color 99999s ease-in-out 0s;
}

.ax .ax-eye {
  width: 42px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--muted);
  outline: none;
  flex-shrink: 0;
}
.ax .ax-eye.on { color: var(--accent); }

.ax-er { margin: 7px 0 0 2px; font-size: 12px; color: var(--danger); }

/* ---------- remember + forgot ---------- */
.ax-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 4px 0 20px;
}
.ax-rm {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--label);
  cursor: pointer;
  user-select: none;
}
.ax-rm input { position: absolute; opacity: 0; width: 0; height: 0; }
.ax-ck {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px;
  border: 1.5px solid var(--ck-line);
  background: var(--field);
  color: transparent;
  transition: .15s;
}
.ax-rm input:checked + .ax-ck {
  background: linear-gradient(135deg, #22bcd3, #2878e0);
  border-color: transparent;
  color: #fff;
}

.ax .ax-link {
  border: 0;
  background: none;
  padding: 6px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  outline: none;
}

/* ---------- main button ---------- */
.ax .ax-btn {
  position: relative;
  overflow: hidden;
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 100% !important;
  max-width: 100%;
  min-height: 56px;
  margin: 0;
  padding: 0 16px;
  border: 0;
  border-radius: 16px;
  outline: none;
  background: linear-gradient(110deg, #1fbad0 0%, #2a7de1 100%) !important;
  color: #fff !important;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: .2px;
  box-shadow:
    var(--btn-sh),
    inset 0 1px 0 rgba(255,255,255,.28);
  transition: transform .15s, opacity .15s;
}
.ax .ax-btn::after {
  content: "";
  position: absolute;
  inset: 0 0 50% 0;
  background: linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,0));
  pointer-events: none;
}
.ax .ax-btn:active { transform: scale(.98); }
.ax .ax-btn:disabled { opacity: .6; cursor: not-allowed; }

/* ---------- secondary (outline) button ---------- */
.ax-or {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 22px 0 18px;
  font-size: 12px;
  color: var(--muted);
}
.ax-or::before, .ax-or::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--or-line);
}
.ax .ax-btn2 {
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 100% !important;
  min-height: 54px;
  margin: 0;
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid var(--btn2-line);
  background: var(--btn2-bg) !important;
  color: var(--btn2-text) !important;
  font-size: 15px;
  font-weight: 600;
  outline: none;
  transition: transform .15s, background .15s;
}
.ax .ax-btn2:active { transform: scale(.98); background: var(--btn2-bg-active) !important; }

.ax .ax-ghost {
  display: block;
  margin: 14px auto 0;
  border: 0;
  background: none;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--muted);
  outline: none;
}
.ax .ax-help {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 6px auto 0;
  border: 0;
  background: none;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--accent);
  outline: none;
}

/* ---------- strength ---------- */
.ax-str {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: -4px 2px 16px;
  font-size: 12px;
}
.ax-str > div { display: flex; gap: 5px; flex: 1; }
.ax-str i { flex: 1; height: 4px; border-radius: 4px; background: var(--track); }
.ax-str i.on.s1 { background: var(--danger); }
.ax-str i.on.s2 { background: var(--warn); }
.ax-str i.on.s3 { background: var(--ok); }
.ax-str .s1 { color: var(--danger); }
.ax-str .s2 { color: var(--warn); }
.ax-str .s3 { color: var(--ok); }

/* ---------- toast ---------- */
.ax-tov {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: var(--ov);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
  animation: axfade .16s ease-out;
}
.ax-tcard {
  width: min(86vw, 320px);
  padding: 28px 22px 24px;
  border-radius: 22px;
  background: var(--tcard-bg);
  border: 1px solid var(--tcard-line);
  box-shadow: var(--tcard-shadow);
  text-align: center;
  color: var(--tcard-text);
  animation: axpop .2s ease-out;
}
.ax-tic {
  width: 60px; height: 60px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.ax-tcard.ok .ax-tic   { background: rgba(25,195,125,.14); color: var(--ok); }
.ax-tcard.bad .ax-tic  { background: rgba(240,98,125,.14); color: var(--danger); }
.ax-tcard.info .ax-tic,
.ax-tcard.load .ax-tic { background: var(--info-bg); color: var(--info); }
.ax-spin {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 3px solid var(--info-ring);
  border-top-color: var(--info);
  animation: axspin .8s linear infinite;
}
.ax-ttx { font-size: 15px; line-height: 1.5; font-weight: 600; overflow-wrap: anywhere; }

@keyframes axfade { from { opacity: 0; } to { opacity: 1; } }
@keyframes axpop  { from { transform: scale(.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes axspin { to { transform: rotate(360deg); } }

@media (max-width: 380px) {
  .ax-box { padding-left: 14px; padding-right: 14px; }
  .ax-card { padding: 18px 14px 16px; }
  .ax-logo { margin-top: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .ax *, .ax-tov, .ax-tcard { animation: none !important; transition: none !important; }
}
`;

/* ================= SHARED PIECES ================= */

function useTx() {
  const t = useT();
  return (k) => {
    let v;
    try {
      v = t(k);
    } catch (_) {
      v = k;
    }
    return v && v !== k ? v : FB[k] || k;
  };
}

function Logo() {
  return (
    <div className="ax-logo">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <g fill="none" stroke="#19b0c8" strokeWidth="7">
          <path d="M76 16H50a34 34 0 000 68h26V66" />
          <path d="M76 33H50a17 17 0 000 34h26V54" />
          <path d="M76 49H54a3 3 0 000 6h22" />
        </g>
      </svg>
    </div>
  );
}

function TopBar({ go, lang, setLang, theme, onTheme }) {
  const dark = theme === "dark";
  return (
    <div className="ax-top">
      <button
        type="button"
        className="ax-back"
        onClick={() => go("app")}
        aria-label="Back"
      >
        <Icon n="back" s={22} w={2.2} />
      </button>

      <div className="ax-topr">
        <button
          type="button"
          className="ax-theme"
          onClick={onTheme}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          title={dark ? "Light mode" : "Dark mode"}
        >
          <Icon n={dark ? "sun" : "moon"} s={20} w={2} />
        </button>
        <LangPicker lang={lang} setLang={setLang} />
      </div>
    </div>
  );
}

function Toast({ msg, onClose, tx }) {
  const { k, kind } = msg;

  useEffect(() => {
    if (!k || kind === "load") return;
    const id = setTimeout(onClose, kind === "bad" ? 2800 : 1800);
    return () => clearTimeout(id);
  }, [k, kind, onClose]);

  if (!k) return null;

  const icon =
    kind === "ok" ? (
      <Icon n="check" s={30} w={2.6} />
    ) : kind === "bad" ? (
      <Icon n="alert" s={30} w={2.6} />
    ) : kind === "load" ? (
      <i className="ax-spin" />
    ) : (
      <Icon n="info" s={30} w={2.6} />
    );

  return (
    <div
      className="ax-tov"
      onClick={kind === "load" ? undefined : onClose}
      role="alert"
    >
      <div className={"ax-tcard " + kind} onClick={(e) => e.stopPropagation()}>
        <div className="ax-tic">{icon}</div>
        <div className="ax-ttx">{tx(k)}</div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  type = "text",
  value,
  onChange,
  error,
  right,
  onKeyDown,
  autoComplete,
  placeholder,
  maxLength,
  inputMode,
}) {
  return (
    <div className="ax-fd">
      <label htmlFor={id}>{label}</label>
      <div className={"ax-fw" + (error ? " err" : "")}>
        <span className="ax-fi">
          <Icon n={icon} s={19} />
        </span>
        <input
          id={id}
          className="ax-in"
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        {right}
      </div>
      {error && <div className="ax-er">{error}</div>}
    </div>
  );
}

function EyeBtn({ show, onToggle }) {
  return (
    <button
      type="button"
      className={"ax-eye" + (show ? " on" : "")}
      onClick={onToggle}
      aria-label={show ? "Hide password" : "Show password"}
      aria-pressed={show}
    >
      <Icon n={show ? "eyeOff" : "eye"} s={21} />
    </button>
  );
}

/* ================= LOGIN ================= */

export function Login({ onLogin, lang, setLang, go, flash = "" }) {
  const tx = useTx();
  const [theme, toggleTheme] = useTheme();

  const rem0 = store.get("cx_rem", "");

  const [email, setEmail] = useState(rem0);
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [rem, setRem] = useState(!!rem0);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const [cs, setCs] = useState(false);
  const [msg, setMsg] = useState(flash ? { k: flash, kind: "info" } : NONE);

  const mail = email.trim().toLowerCase();
  const closeToast = useCallback(() => setMsg(NONE), []);

  const eMail = tried && !mailOk(mail) ? tx("bEmail") : "";
  const ePw = tried && !pwOk(pw) ? tx("pwRule") : "";

  const login = async () => {
    if (busy) return;
    setTried(true);
    if (!mailOk(mail) || !pwOk(pw)) return;

    setBusy(true);
    setMsg({ k: "wait2", kind: "load" });

    try {
      const r = await api("/auth/login", {
        method: "POST",
        body: { email: mail, password: pw },
      });

      store.set("cx_rem", rem ? mail : "");

      setMsg({ k: "loginOk", kind: "ok" });
      await sleep(900);
      setMsg(NONE);

      await onLogin(r);
    } catch (e) {
      setMsg({ k: (e && e.message) || "err", kind: "bad" });
    }

    setBusy(false);
  };

  const enter = (e) => {
    if (e.key === "Enter") login();
  };

  return (
    <div className="ax" data-theme={theme}>
      <style>{CSS}</style>

      <div className="ax-box">
        <TopBar
          go={go}
          lang={lang}
          setLang={setLang}
          theme={theme}
          onTheme={toggleTheme}
        />
        <Logo />

        <div className="ax-head">
          <h1>{tx("loginTitle")}</h1>
          <p>{tx("loginSub")}</p>
        </div>

        <div className="ax-card">
          <Field
            id="ax-email"
            label={tx("email")}
            icon="mail"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder={tx("acc")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={enter}
            error={eMail}
          />

          <Field
            id="ax-pw"
            label={tx("pwLbl")}
            icon="lock"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder={tx("pw")}
            value={pw}
            onChange={(e) => setPw(e.target.value.slice(0, 12))}
            onKeyDown={enter}
            maxLength={12}
            error={ePw}
            right={<EyeBtn show={show} onToggle={() => setShow((v) => !v)} />}
          />

          <div className="ax-row">
            <label className="ax-rm">
              <input
                type="checkbox"
                checked={rem}
                onChange={(e) => setRem(e.target.checked)}
              />
              <span className="ax-ck">
                <Icon n="check" s={14} w={3} />
              </span>
              {tx("rem")}
            </label>

            <button type="button" className="ax-link" onClick={() => setCs(true)}>
              {tx("forgot")}
            </button>
          </div>

          <button
            type="button"
            className="ax-btn"
            onClick={login}
            disabled={busy}
          >
            {busy ? tx("wait2") : tx("login")}
          </button>
        </div>

        <div className="ax-or">{tx("noAcc")}</div>

        <button type="button" className="ax-btn2" onClick={() => go("register")}>
          {tx("register")}
        </button>

        <Toast msg={msg} onClose={closeToast} tx={tx} />
        {cs && (
          <div className="ax-csw">
            <CSheet open={cs} onClose={() => setCs(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= REGISTER ================= */

export function Register({ onLogin, go, lang, setLang }) {
  const tx = useTx();
  const [theme, toggleTheme] = useTheme();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(NONE);
  const [tried, setTried] = useState(false);
  const [cs, setCs] = useState(false);

  const mail = email.trim().toLowerCase();
  const sc = strength(pw);
  const closeToast = useCallback(() => setMsg(NONE), []);

  const eMail = tried && !mailOk(mail) ? tx("bEmail") : "";
  const ePw = tried && !pwOk(pw) ? tx("pwRule") : "";
  const ePw2 = tried && pw2 !== pw ? tx("bMatch") : "";

  const submit = async () => {
    if (busy) return;
    setTried(true);
    if (!mailOk(mail) || !pwOk(pw) || pw !== pw2) return;

    setBusy(true);
    setMsg({ k: "wait2", kind: "load" });

    try {
      const r = await api("/auth/register", {
        method: "POST",
        body: { email: mail, password: pw, password2: pw2 },
      });

      setMsg({ k: "regOk", kind: "ok" });
      await sleep(900);
      setMsg(NONE);

      await onLogin(r);
    } catch (e) {
      setMsg({ k: (e && e.message) || "err", kind: "bad" });
    }

    setBusy(false);
  };

  const enter = (e) => {
    if (e.key === "Enter") submit();
  };

  const eye = <EyeBtn show={show} onToggle={() => setShow((v) => !v)} />;

  return (
    <div className="ax" data-theme={theme}>
      <style>{CSS}</style>

      <div className="ax-box">
        <TopBar
          go={go}
          lang={lang}
          setLang={setLang}
          theme={theme}
          onTheme={toggleTheme}
        />
        <Logo />

        <div className="ax-head">
          <h1>{tx("createAcc")}</h1>
          <p>{tx("createSub")}</p>
        </div>

        <div className="ax-card">
          <Field
            id="ax-r-email"
            label={tx("email")}
            icon="mail"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder={tx("acc")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={eMail}
          />

          <Field
            id="ax-r-pw"
            label={tx("pwLbl")}
            icon="lock"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder={tx("pw")}
            value={pw}
            onChange={(e) => setPw(e.target.value.slice(0, 12))}
            maxLength={12}
            error={ePw}
            right={eye}
          />

          {pw && (
            <div className="ax-str">
              <div>
                {[1, 2, 3].map((n) => (
                  <i key={n} className={"s" + sc + (n <= sc ? " on" : "")} />
                ))}
              </div>
              <span className={"s" + sc}>
                {sc === 1
                  ? tx("strWeak")
                  : sc === 2
                  ? tx("strMid")
                  : tx("strStrong")}
              </span>
            </div>
          )}

          <Field
            id="ax-r-pw2"
            label={tx("pw2Lbl")}
            icon="lock"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder={tx("pw2")}
            value={pw2}
            onChange={(e) => setPw2(e.target.value.slice(0, 12))}
            onKeyDown={enter}
            maxLength={12}
            error={ePw2}
            right={eye}
          />

          <button
            type="button"
            className="ax-btn"
            onClick={submit}
            disabled={busy}
            style={{ marginTop: 8 }}
          >
            {busy ? tx("wait2") : tx("register")}
          </button>
        </div>

        <div className="ax-or">{tx("haveAcc")}</div>

        <button type="button" className="ax-btn2" onClick={() => go("login")}>
          {tx("login")}
        </button>

        <button type="button" className="ax-ghost" onClick={() => go("app")}>
          {tx("guest")}
        </button>

        <button type="button" className="ax-help" onClick={() => setCs(true)}>
          <Icon n="chat" s={18} />
          {tx("csHelp")}
        </button>

        <Toast msg={msg} onClose={closeToast} tx={tx} />
        {cs && (
          <div className="ax-csw">
            <CSheet open={cs} onClose={() => setCs(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
