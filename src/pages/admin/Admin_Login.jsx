import React, { useCallback, useEffect, useRef, useState } from "react";
import { useT, api, store } from "../Home";
import { LANGS } from "../../lib/i18n";


const mailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const pwOk = (p) => p.length >= 6;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FB = {
  email: "Email",
  acc: "Enter admin email",
  pwLbl: "Password",
  pw: "Enter your password",
  rem: "Remember me",
  bEmail: "Enter a valid email address",
  pwRule: "Password must be at least 6 characters",
  wait2: "Please wait…",
  err: "Something went wrong. Please try again.",
  loginOk: "Login successful",
  adminTitle: "Admin Panel",
  adminSub: "Sign in with your admin account.",
  adminLogin: "Admin Login",
};

const NONE = { k: "", kind: "" };
const THEME_KEY = "cx_theme";

/* ---------- theme ---------- */
function readTheme() {
  let v = "light";
  try {
    v = store.get(THEME_KEY, "light");
  } catch (_) {
    v = "light";
  }
  return v === "dark" ? "dark" : "light";
}

function useTheme() {
  const [theme, setTheme] = useState(readTheme);
  const toggle = useCallback(() => {
    setTheme((cur) => {
      const next = cur === "dark" ? "light" : "dark";
      try {
        store.set(THEME_KEY, next);
      } catch (_) {
        /* ignore */
      }
      return next;
    });
  }, []);
  return [theme, toggle];
}

/* ---------- translate with fallback ---------- */
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

/* ---------- icons ---------- */
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
  shield: (
    <>
      <path d="M12 3 5 6v5.5c0 4.4 2.9 7.9 7 9.5 4.1-1.6 7-5.1 7-9.5V6l-7-3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
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

/* ---------- language picker ---------- */
function LangPicker({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cur = LANGS.find((l) => l[0] === lang) || LANGS[1] || LANGS[0];

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
    <div className="al-lg" ref={ref}>
      <button
        type="button"
        className="al-lgb"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{cur[1]}</span>
        <span className="al-fl">{cur[2]}</span>
      </button>

      {open && (
        <div className="al-lgm" role="listbox">
          {LANGS.map(([code, name, flag]) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={code === cur[0]}
              className={"al-lgi" + (code === cur[0] ? " on" : "")}
              onClick={() => {
                setLang && setLang(code);
                setOpen(false);
              }}
            >
              <span>{name}</span>
              <span className="al-fl">{flag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- toast ---------- */
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
      <i className="al-spin" />
    ) : (
      <Icon n="info" s={30} w={2.6} />
    );

  return (
    <div
      className="al-tov"
      onClick={kind === "load" ? undefined : onClose}
      role="alert"
    >
      <div className={"al-tcard " + kind} onClick={(e) => e.stopPropagation()}>
        <div className="al-tic">{icon}</div>
        <div className="al-ttx">{tx(k)}</div>
      </div>
    </div>
  );
}

/* ---------- field ---------- */
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
  inputMode,
}) {
  return (
    <div className="al-fd">
      <label htmlFor={id}>{label}</label>
      <div className={"al-fw" + (error ? " err" : "")}>
        <span className="al-fi">
          <Icon n={icon} s={19} />
        </span>
        <input
          id={id}
          className="al-in"
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          autoComplete={autoComplete}
          placeholder={placeholder}
          inputMode={inputMode}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        {right}
      </div>
      {error && <div className="al-er">{error}</div>}
    </div>
  );
}

/* ================= ADMIN LOGIN ================= */

export default function Admin_Login({ onLogin, lang, setLang, go, flash = "" }) {
  const tx = useTx();
  const [theme, toggleTheme] = useTheme();

  const rem0 = store.get("cx_admin_rem", "");

  const [email, setEmail] = useState(rem0);
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [rem, setRem] = useState(!!rem0);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
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

      store.set("cx_admin_rem", rem ? mail : "");

      setMsg({ k: "loginOk", kind: "ok" });
      await sleep(700);
      setMsg(NONE);

      // App.jsx checks the role; non-admin accounts are rejected there
      await onLogin(r);
    } catch (e) {
      setMsg({ k: (e && e.message) || "err", kind: "bad" });
    }

    setBusy(false);
  };

  const enter = (e) => {
    if (e.key === "Enter") login();
  };

  const dark = theme === "dark";

  return (
    <div className="al" data-theme={theme}>
      <style>{CSS}</style>

      <div className="al-box">
        <div className="al-top">
          <button
            type="button"
            className="al-ib"
            onClick={() => go("app")}
            aria-label="Back"
          >
            <Icon n="back" s={22} w={2.2} />
          </button>

          <div className="al-topr">
            <button
              type="button"
              className="al-ib al-accent"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <Icon n={dark ? "sun" : "moon"} s={20} w={2} />
            </button>
            <LangPicker lang={lang} setLang={setLang} />
          </div>
        </div>

        <div className="al-logo">
          <Icon n="shield" s={38} w={1.8} />
        </div>

        <div className="al-head">
          <h1>{tx("adminTitle")}</h1>
          <p>{tx("adminSub")}</p>
        </div>

        <div className="al-card">
          <Field
            id="al-email"
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
            id="al-pw"
            label={tx("pwLbl")}
            icon="lock"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder={tx("pw")}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={enter}
            error={ePw}
            right={
              <button
                type="button"
                className={"al-eye" + (show ? " on" : "")}
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
              >
                <Icon n={show ? "eyeOff" : "eye"} s={21} />
              </button>
            }
          />

          <label className="al-rm">
            <input
              type="checkbox"
              checked={rem}
              onChange={(e) => setRem(e.target.checked)}
            />
            <span className="al-ck">
              <Icon n="check" s={14} w={3} />
            </span>
            {tx("rem")}
          </label>

          <button
            type="button"
            className="al-btn"
            onClick={login}
            disabled={busy}
          >
            {busy ? tx("wait2") : tx("adminLogin")}
          </button>
        </div>

        <Toast msg={msg} onClose={closeToast} tx={tx} />
      </div>
    </div>
  );
}

/* ================= CSS ================= */

const CSS = `
.al, .al * { box-sizing: border-box; }

.al {
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
  --glow1: rgba(38,191,214,.22);
  --glow2: rgba(40,120,224,.14);
  --btn-sh: 0 12px 26px rgba(40,125,225,.30);
  --ghost-bg: rgba(15,30,60,.04);
  --ck-line: #b5c2d9;
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

.al[data-theme="dark"] {
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
  --glow1: rgba(38,191,214,.22);
  --glow2: rgba(40,120,224,.18);
  --btn-sh: 0 12px 28px rgba(40,125,225,.35);
  --ghost-bg: rgba(255,255,255,.04);
  --ck-line: #3a4c6b;
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

.al::before, .al::after {
  content: "";
  position: fixed;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(70px);
  z-index: 0;
}
.al::before {
  width: 320px; height: 320px;
  top: -140px; left: 50%;
  margin-left: -160px;
  background: var(--glow1);
}
.al::after {
  width: 260px; height: 260px;
  bottom: -120px; right: -90px;
  background: var(--glow2);
}

.al-box {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 0 20px calc(32px + env(safe-area-inset-bottom, 0px));
}

.al button, .al input { font-family: inherit; }
.al button { cursor: pointer; -webkit-appearance: none; appearance: none; }

.al-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 0 0;
}
.al-topr { display: flex; align-items: center; gap: 10px; }
.al .al-ib {
  width: 42px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--ghost-bg);
  color: var(--text);
  outline: none;
}
.al .al-ib.al-accent { color: var(--accent); }
.al .al-ib:active { transform: scale(.94); }

.al-lg { position: relative; }
.al .al-lgb {
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
.al-fl { font-size: 24px; line-height: 1; }
.al-lgm {
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
.al .al-lgi {
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
.al .al-lgi:last-child { border-bottom: 0; }
.al .al-lgi:active { background: var(--menu-hover); }
.al .al-lgi.on { color: var(--menu-active); font-weight: 700; }

.al-logo {
  width: 68px; height: 68px;
  margin: 22px auto 18px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 21px;
  background: var(--logo-bg);
  color: #19b0c8;
  box-shadow: var(--logo-ring);
}

.al-head { text-align: center; margin-bottom: 22px; }
.al-head h1 {
  margin: 0 0 6px;
  font-size: 27px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -.5px;
  color: var(--text);
}
.al-head p { margin: 0; font-size: 14px; color: var(--muted); }

.al-card {
  padding: 22px 18px 20px;
  border-radius: 24px;
  border: 1px solid var(--card-line);
  background: var(--card);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  box-shadow: var(--card-shadow);
}

.al-fd { margin-bottom: 16px; }
.al-fd label {
  display: block;
  margin: 0 0 8px 2px;
  font-size: 13px;
  font-weight: 600;
  color: var(--label);
}
.al-fw {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 6px 0 10px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--field);
  transition: border-color .18s, background .18s;
}
.al-fw:focus-within { border-color: var(--line-focus); background: var(--field-focus); }
.al-fw.err { border-color: var(--danger); }

.al-fi {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  margin-right: 10px;
  border-radius: 11px;
  background: var(--accent-bg);
  color: var(--accent);
  flex-shrink: 0;
}

.al .al-in,
.al .al-in:focus,
.al .al-in:active {
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
.al .al-in::placeholder {
  color: var(--placeholder);
  -webkit-text-fill-color: var(--placeholder);
  opacity: 1;
}
.al .al-in:-webkit-autofill,
.al .al-in:-webkit-autofill:hover,
.al .al-in:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--text) !important;
  caret-color: var(--accent);
  -webkit-box-shadow: 0 0 0 1000px var(--autofill) inset !important;
  box-shadow: 0 0 0 1000px var(--autofill) inset !important;
  transition: background-color 99999s ease-in-out 0s;
}

.al .al-eye {
  width: 42px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--muted);
  outline: none;
  flex-shrink: 0;
}
.al .al-eye.on { color: var(--accent); }

.al-er { margin: 7px 0 0 2px; font-size: 12px; color: var(--danger); }

.al-rm {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 20px;
  font-size: 13px;
  color: var(--label);
  cursor: pointer;
  user-select: none;
}
.al-rm input { position: absolute; opacity: 0; width: 0; height: 0; }
.al-ck {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px;
  border: 1.5px solid var(--ck-line);
  background: var(--field);
  color: transparent;
  transition: .15s;
}
.al-rm input:checked + .al-ck {
  background: linear-gradient(135deg, #22bcd3, #2878e0);
  border-color: transparent;
  color: #fff;
}

.al .al-btn {
  position: relative;
  overflow: hidden;
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 100% !important;
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
  box-shadow: var(--btn-sh), inset 0 1px 0 rgba(255,255,255,.28);
  transition: transform .15s, opacity .15s;
}
.al .al-btn:active { transform: scale(.98); }
.al .al-btn:disabled { opacity: .6; cursor: not-allowed; }

.al-tov {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: var(--ov);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
  animation: alfade .16s ease-out;
}
.al-tcard {
  width: min(86vw, 320px);
  padding: 28px 22px 24px;
  border-radius: 22px;
  background: var(--tcard-bg);
  border: 1px solid var(--tcard-line);
  box-shadow: var(--tcard-shadow);
  text-align: center;
  color: var(--tcard-text);
  animation: alpop .2s ease-out;
}
.al-tic {
  width: 60px; height: 60px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.al-tcard.ok .al-tic   { background: rgba(25,195,125,.14); color: var(--ok); }
.al-tcard.bad .al-tic  { background: rgba(240,98,125,.14); color: var(--danger); }
.al-tcard.info .al-tic,
.al-tcard.load .al-tic { background: var(--info-bg); color: var(--info); }
.al-spin {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 3px solid var(--info-ring);
  border-top-color: var(--info);
  animation: alspin .8s linear infinite;
}
.al-ttx { font-size: 15px; line-height: 1.5; font-weight: 600; overflow-wrap: anywhere; }

@keyframes alfade { from { opacity: 0; } to { opacity: 1; } }
@keyframes alpop  { from { transform: scale(.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes alspin { to { transform: rotate(360deg); } }

@media (max-width: 380px) {
  .al-box { padding-left: 14px; padding-right: 14px; }
  .al-card { padding: 18px 14px 16px; }
  .al-logo { margin-top: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .al *, .al-tov, .al-tcard { animation: none !important; transition: none !important; }
}
`;
