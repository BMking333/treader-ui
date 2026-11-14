
import React, { useEffect, useState } from "react";
import { useT, api, store, Ic, ICON, CSheet } from "./Home";
import { LangPicker } from "../lib/i18n";

/* =========================================================
   Register_Login.jsx
   Professional Login + Register
   Password: Minimum 6 / Maximum 12 characters
   ========================================================= */

const mailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const strength = (p) => {
  if (!p) return 0;
  let s = 1;
  if (p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p)) s++;
  if (p.length >= 10 && /[^A-Za-z0-9]/.test(p)) s++;
  return s;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FB = {
  loginOk: "Login successful",
  regOk: "Registration successful",
};

const NONE = { k: "", kind: "" };

/* ================= PROFESSIONAL CSS ================= */

const CSS = `
.cx-au,
.cx-au * {
  box-sizing: border-box;
}

.cx-au {
  -webkit-tap-highlight-color: transparent;
}

.cx-au input,
.cx-au button {
  outline: none !important;
  font-family: inherit;
}

.cx-au button {
  cursor: pointer;
}

.cx-au input {
  caret-color: #20b8cf;
}

.cx-au .cx-ai {
  width: 100%;
  height: 54px;
  padding: 0 16px;
  border: 1px solid rgba(130,150,180,.20);
  border-radius: 14px;
  background: rgba(255,255,255,.035);
  color: inherit;
  font-size: 14px;
  transition: .2s ease;
}

.cx-au .cx-ai:focus {
  border-color: #20b8cf !important;
  box-shadow: 0 0 0 4px rgba(32,184,207,.13) !important;
}

.cx-au .cx-ai::placeholder {
  color: #8995a9;
}

.cx-au .cx-fw {
  display: flex;
  align-items: center;
  min-height: 54px;
  padding: 0 14px;
  border: 1px solid rgba(130,150,180,.20);
  border-radius: 14px;
  background: rgba(255,255,255,.035);
  transition: .2s ease;
}

.cx-au .cx-fw:focus-within {
  border-color: #20b8cf;
  box-shadow: 0 0 0 4px rgba(32,184,207,.13);
}

.cx-au .cx-fw input {
  flex: 1;
  width: 0;
  min-width: 0;
  height: 50px;
  border: 0 !important;
  background: transparent !important;
  color: inherit;
  font-size: 14px;
  box-shadow: none !important;
}

.cx-au .cx-fi {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #20b8cf;
}

.cx-au .cx-fd {
  margin-bottom: 19px;
}

.cx-au .cx-fd label {
  display: block;
  margin-bottom: 9px;
  font-size: 13px;
  font-weight: 600;
  color: inherit;
}

.cx-au .cx-fe {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: #929fb3;
}

.cx-au .cx-fe:hover {
  color: #20b8cf;
}

.cx-au .cx-fw.err {
  border-color: #f0506e !important;
}

.cx-au .cx-fer {
  color: #f0506e;
  font-size: 11px;
  margin-top: 7px;
}

.cx-au .cx-ai:-webkit-autofill,
.cx-au .cx-fw input:-webkit-autofill {
  -webkit-text-fill-color: inherit;
  transition: background-color 99999s ease-in-out 0s;
  box-shadow: 0 0 0 1000px #172237 inset !important;
}

.cx-au .cx-pt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
}

.cx-au .cx-pt > button {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  border: 1px solid rgba(130,150,180,.18);
  background: rgba(255,255,255,.04);
  color: inherit;
  font-size: 26px;
}

.cx-au .cx-alogo {
  display: flex;
  justify-content: center;
  margin: 35px 0 26px;
}

.cx-au .cx-alogo i {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  border-radius: 23px;
  background: linear-gradient(145deg,rgba(32,184,207,.17),rgba(32,184,207,.04));
  border: 1px solid rgba(32,184,207,.25);
}

.cx-au .cx-alogo svg {
  width: 55px;
  height: 55px;
}

.cx-au .cx-login-title {
  text-align: center;
  margin-bottom: 27px;
}

.cx-au .cx-login-title h1 {
  font-size: 25px;
  font-weight: 800;
  margin: 0 0 8px;
  letter-spacing: -.5px;
}

.cx-au .cx-login-title p {
  color: #8995a9;
  font-size: 13px;
  margin: 0;
}

.cx-au .cx-acard {
  padding: 23px;
  border-radius: 21px;
  border: 1px solid rgba(130,150,180,.15);
  background: rgba(255,255,255,.025);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.cx-au .cx-rm {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12px;
  color: #a5b0c2;
  cursor: pointer;
  margin-top: 2px;
}

.cx-au .cx-rm input {
  width: 17px;
  height: 17px;
  accent-color: #20b8cf;
  cursor: pointer;
}

.cx-au .cx-a1,
.cx-au .cx-pbtn {
  width: 100%;
  height: 54px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(110deg,#19b7c7,#2689ef);
  color: white;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: .3px;
  box-shadow: 0 8px 24px rgba(32,155,220,.19);
  transition: .2s ease;
  margin-top: 20px;
}

.cx-au .cx-a1:active,
.cx-au .cx-pbtn:active {
  transform: scale(.98);
}

.cx-au .cx-a1:disabled,
.cx-au .cx-pbtn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.cx-au .cx-alinks {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 19px;
}

.cx-au .cx-alinks button {
  border: none;
  background: none;
  color: #20b8cf;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 0;
}

.cx-au .cx-alinks button:last-child {
  color: #929fb3;
}

.cx-au .cx-str {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -8px 0 17px;
  font-size: 11px;
}

.cx-au .cx-str > div {
  display: flex;
  gap: 5px;
  flex: 1;
  margin-right: 12px;
}

.cx-au .cx-str i {
  height: 4px;
  border-radius: 5px;
  background: #354258;
  flex: 1;
}

.cx-au .cx-str i.on.s1 { background: #f0506e; }
.cx-au .cx-str i.on.s2 { background: #e5ad40; }
.cx-au .cx-str i.on.s3 { background: #19c37d; }

.cx-au .cx-str .s1 { color: #f0506e; }
.cx-au .cx-str .s2 { color: #e5ad40; }
.cx-au .cx-str .s3 { color: #19c37d; }

.cx-au .cx-hero {
  text-align: center;
  margin: 20px 0 28px;
}

.cx-au .cx-plogo {
  width: 70px;
  height: 70px;
  margin: auto auto 17px;
  border-radius: 21px;
  background: linear-gradient(145deg,#19b7c7,#2689ef);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cx-au .cx-plogo svg {
  width: 53px;
}

.cx-au .cx-hero h1 {
  font-size: 25px;
  margin: 0 0 8px;
}

.cx-au .cx-hero p {
  color: #8995a9;
  font-size: 13px;
}

.cx-au .cx-pcard {
  padding: 22px;
  border: 1px solid rgba(130,150,180,.15);
  border-radius: 21px;
  background: rgba(255,255,255,.025);
}

.cx-au .cx-pdiv {
  height: 1px;
  background: rgba(130,150,180,.15);
  margin: 22px 0;
}

.cx-au .cx-pfoot {
  text-align: center;
  font-size: 13px;
  color: #929fb3;
}

.cx-au .cx-plink,
.cx-au .cx-pghost {
  border: 0;
  background: none;
  color: #20b8cf;
  font-weight: 700;
  margin-left: 7px;
}

.cx-au .cx-pghost {
  display: block;
  margin: 15px auto 0;
}

.cx-au .cx-pcs {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
  margin: 22px auto;
  border: 0;
  background: none;
  color: #20b8cf;
  font-size: 13px;
}

.cx-tov {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(2,6,14,.65);
  backdrop-filter: blur(5px);
  animation: cxtfade .16s ease-out;
}

.cx-tcard {
  width: min(86vw,320px);
  padding: 28px 22px 24px;
  border-radius: 20px;
  background: #131c2e;
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 24px 64px rgba(0,0,0,.55);
  text-align: center;
  color: #e8edf7;
  animation: cxtpop .2s ease-out;
}

.cx-tic {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cx-tic svg {
  width: 30px;
  height: 30px;
}

.cx-tcard.ok .cx-tic {
  background: rgba(25,195,125,.14);
  color: #19c37d;
}

.cx-tcard.bad .cx-tic {
  background: rgba(240,80,110,.14);
  color: #f0506e;
}

.cx-tcard.info .cx-tic,
.cx-tcard.load .cx-tic {
  background: rgba(47,140,255,.14);
  color: #2f8cff;
}

.cx-tspin {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid rgba(47,140,255,.25);
  border-top-color: #2f8cff;
  animation: cxtspin .8s linear infinite;
}

.cx-ttx {
  font-size: 15px;
  line-height: 1.5;
  font-weight: 600;
  overflow-wrap: anywhere;
}

@keyframes cxtfade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes cxtpop {
  from { transform: scale(.88); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes cxtspin {
  to { transform: rotate(360deg); }
}

@media(max-width:380px) {
  .cx-au .cx-acard,
  .cx-au .cx-pcard {
    padding: 17px;
  }
  .cx-au .cx-alogo {
    margin-top: 20px;
  }
}
`;

/* ================= TOAST ================= */

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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    ) : kind === "bad" ? (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M12 6v7.5" />
        <path d="M12 17.5v.01" />
      </svg>
    ) : kind === "load" ? (
      <i className="cx-tspin" />
    ) : (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M12 11v6" />
        <path d="M12 7.5v.01" />
      </svg>
    );

  return (
    <div
      className="cx-tov"
      onClick={kind === "load" ? undefined : onClose}
      role="alert"
    >
      <div
        className={"cx-tcard " + kind}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cx-tic">{icon}</div>
        <div className="cx-ttx">{tx(k)}</div>
      </div>
    </div>
  );
}

/* ================= FIELD ================= */

function Field({
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
}) {
  return (
    <div className="cx-fd">
      <label>{label}</label>
      <div className={"cx-fw" + (error ? " err" : "")}>
        <span className="cx-fi">
          <Ic d={icon} s={20} />
        </span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
        />
        {right}
      </div>
      {error && <div className="cx-fer">{error}</div>}
    </div>
  );
}

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

/* ================= LOGIN ================= */

export function Login({ onLogin, lang, setLang, go, flash = "" }) {
  const t = useT();
  const tx = useTx();

  const rem0 = store.get("cx_rem", "");

  const [email, setEmail] = useState(rem0);
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [rem, setRem] = useState(!!rem0);
  const [busy, setBusy] = useState(false);
  const [cs, setCs] = useState(false);
  const [msg, setMsg] = useState(
    flash ? { k: flash, kind: "info" } : NONE
  );

  const mail = email.trim().toLowerCase();

  const closeToast = () => setMsg(NONE);

  const login = async () => {
    if (busy) return;

    if (!mailOk(mail)) {
      setMsg({ k: "bEmail", kind: "bad" });
      return;
    }

    if (pw.length < 6 || pw.length > 12) {
      setMsg({
        k: "Password must be 6 to 12 characters",
        kind: "bad",
      });
      return;
    }

    setBusy(true);
    setMsg({ k: "wait2", kind: "load" });

    try {
      const r = await api("/auth/login", {
        method: "POST",
        body: {
          email: mail,
          password: pw,
        },
      });

      store.set("cx_rem", rem ? mail : "");

      setMsg({ k: "loginOk", kind: "ok" });

      await sleep(900);
      setMsg(NONE);

      await onLogin(r);
    } catch (e) {
      setMsg({
        k: (e && e.message) || "err",
        kind: "bad",
      });
    }

    setBusy(false);
  };

  const enter = (e) => {
    if (e.key === "Enter") login();
  };

  return (
    <div className="cx-pg cx-au">
      <style>{CSS}</style>

      {/* Header */}
      <div className="cx-pt">
        <button
          type="button"
          onClick={() => go("app")}
          aria-label="Back"
        >
          ‹
        </button>

        <div className="cx-pt2">
          <LangPicker lang={lang} setLang={setLang} />
        </div>
      </div>

      {/* Logo */}
      <div className="cx-alogo">
        <i>
          <svg viewBox="0 0 100 100">
            <g fill="none" stroke="#20b8cf" strokeWidth="6.5">
              <path d="M76 16H50a34 34 0 000 68h26V66" />
              <path d="M76 33H50a17 17 0 000 34h26V54" />
              <path d="M76 49H54a3 3 0 000 6h22" />
            </g>
          </svg>
        </i>
      </div>

      {/* Title */}
      <div className="cx-login-title">
        <h1>{t("login")}</h1>
        <p>Welcome back! Sign in to continue.</p>
      </div>

      {/* Login Card */}
      <div className="cx-acard">
        <Field
          label={t("email")}
          icon={ICON.user}
          type="text"
          autoComplete="username"
          placeholder={t("acc")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={enter}
        />

        <Field
          label={t("pwLbl")}
          icon={ICON.lock}
          type={show ? "text" : "password"}
          autoComplete="current-password"
          placeholder={t("pw")}
          value={pw}
          onChange={(e) => setPw(e.target.value.slice(0, 12))}
          onKeyDown={enter}
          maxLength={12}
          right={
            <button
              type="button"
              className="cx-fe"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
            >
              <Ic
                d={show ? ICON.eyeOff || ICON.eye : ICON.eye}
                s={20}
              />
            </button>
          }
        />

        <label className="cx-rm">
          <input
            type="checkbox"
            checked={rem}
            onChange={(e) => setRem(e.target.checked)}
          />
          {t("rem")}
        </label>
      </div>

      {/* Login Button */}
      <button
        className="cx-a1"
        onClick={login}
        disabled={busy}
      >
        {busy ? "Please wait..." : t("login")}
      </button>

      {/* Links */}
      <div className="cx-alinks">
        <button onClick={() => go("register")}>
          {t("register")}
        </button>

        <button onClick={() => setCs(true)}>
          {t("forgot")}
        </button>
      </div>

      <Toast
        msg={msg}
        onClose={closeToast}
        tx={tx}
      />

      <CSheet
        open={cs}
        onClose={() => setCs(false)}
      />
    </div>
  );
}

/* ================= REGISTER ================= */

export function Register({ onLogin, go, lang, setLang }) {
  const t = useT();
  const tx = useTx();

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

  const eMail = tried && !mailOk(mail) ? t("bEmail") : "";
  const ePw = tried && (pw.length < 6 || pw.length > 12)
    ? "Password must be 6 to 12 characters"
    : "";
  const ePw2 = tried && pw2 !== pw ? t("bMatch") : "";

  const submit = async () => {
    if (busy) return;

    setTried(true);

    if (
      !mailOk(mail) ||
      pw.length < 6 ||
      pw.length > 12 ||
      pw !== pw2
    ) return;

    setBusy(true);
    setMsg({ k: "wait2", kind: "load" });

    try {
      const r = await api("/auth/register", {
        method: "POST",
        body: {
          email: mail,
          password: pw,
          password2: pw2,
        },
      });

      setMsg({ k: "regOk", kind: "ok" });

      await sleep(900);
      setMsg(NONE);

      await onLogin(r);
    } catch (e) {
      setMsg({
        k: (e && e.message) || "err",
        kind: "bad",
      });
    }

    setBusy(false);
  };

  const enter = (e) => {
    if (e.key === "Enter") submit();
  };

  const eye = (
    <button
      type="button"
      className="cx-fe"
      onClick={() => setShow((v) => !v)}
      aria-label="Toggle password"
    >
      <Ic d={show ? ICON.eyeOff || ICON.eye : ICON.eye} s={20} />
    </button>
  );

  return (
    <div className="cx-pg cx-au">
      <style>{CSS}</style>

      <div className="cx-pt">
        <button onClick={() => go("app")} aria-label="Back">
          ‹
        </button>
        <div className="cx-pt2">
          <LangPicker lang={lang} setLang={setLang} />
        </div>
      </div>

      <div className="cx-hero">
        <div className="cx-plogo">
          <svg viewBox="0 0 100 100">
            <g fill="none" stroke="#fff" strokeWidth="7">
              <path d="M76 16H50a34 34 0 000 68h26V66" />
              <path d="M76 33H50a17 17 0 000 34h26V54" />
              <path d="M76 49H54a3 3 0 000 6h22" />
            </g>
          </svg>
        </div>

        <h1>{t("createAcc")}</h1>
        <p>{t("createSub")}</p>
      </div>

      <div className="cx-pcard">
        <Field
          label={t("email")}
          icon={ICON.user}
          type="text"
          autoComplete="username"
          placeholder={t("acc")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={eMail}
        />

        <Field
          label={t("pwLbl")}
          icon={ICON.lock}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder={t("pw")}
          value={pw}
          onChange={(e) => setPw(e.target.value.slice(0, 12))}
          error={ePw}
          right={eye}
          maxLength={12}
        />

        {pw && (
          <div className="cx-str">
            <div>
              {[1, 2, 3].map((n) => (
                <i
                  key={n}
                  className={"s" + sc + (n <= sc ? " on" : "")}
                />
              ))}
            </div>

            <span className={"s" + sc}>
              {sc === 1
                ? t("strWeak")
                : sc === 2
                ? t("strMid")
                : t("strStrong")}
            </span>
          </div>
        )}

        <Field
          label={t("pw2Lbl")}
          icon={ICON.lock}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder={t("pw2")}
          value={pw2}
          onChange={(e) => setPw2(e.target.value.slice(0, 12))}
          onKeyDown={enter}
          error={ePw2}
          right={eye}
          maxLength={12}
        />

        <button
          className="cx-pbtn"
          onClick={submit}
          disabled={busy}
        >
          {busy ? "Please wait..." : t("register")}
        </button>

        <div className="cx-pdiv"><span /></div>

        <p className="cx-pfoot">
          {t("haveAcc")}
          <button
            className="cx-plink"
            onClick={() => go("login")}
          >
            {t("login")}
          </button>
        </p>

        <button
          className="cx-pghost"
          onClick={() => go("app")}
        >
          {t("guest")}
        </button>
      </div>

      <button
        className="cx-pcs"
        onClick={() => setCs(true)}
      >
        <Ic d={ICON.chat} s={18} />
        {t("csHelp")}
      </button>

      <Toast
        msg={msg}
        onClose={() => setMsg(NONE)}
        tx={tx}
      />

      <CSheet
        open={cs}
        onClose={() => setCs(false)}
      />
    </div>
  );
}

export default Login;
