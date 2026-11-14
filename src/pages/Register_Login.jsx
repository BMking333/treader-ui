import React, { useEffect, useState } from "react";
import { useT, api, store, Ic, ICON, CSheet } from "./Home";
import { LangPicker } from "../lib/i18n";

/* =====================================================================
   src/pages/Register_Login.jsx — Login + Register (এক ফাইলে)
   export: { Login, Register } (named) + default Login
   Login    → POST /auth/login
   Register → POST /auth/register
   - "Forgot password" ক্লিক করলে Customer service 1 / 2 শিট খোলে (CSheet)
   - ইনপুটে ক্লিক করলে ব্রাউজারের চারকোণা নীল বর্ডার (outline) নেই;
     তার বদলে সুন্দর নরম ফোকাস রিং
   - Login success / error / loading মেসেজ ডিভাইসের মাঝখানে কার্ড স্টাইলে
   ===================================================================== */

const mailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const strength = (p) => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p)) s++;
  if (p.length >= 10 && /[^A-Za-z0-9]/.test(p)) s++;
  return Math.max(s, 1);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* i18n এ key না থাকলে এই English লেখা দেখাবে */
const FB = { loginOk: "Login successful", regOk: "Registration successful" };
const NONE = { k: "", kind: "" };

/* ---------------- স্টাইল: ফোকাস রিং + মাঝখানের কার্ড ---------------- */
const CSS = `
/* চারকোণা নীল outline বন্ধ */
.cx-au input,
.cx-au input:focus,
.cx-au input:focus-visible,
.cx-au button,
.cx-au button:focus,
.cx-au button:focus-visible,
.cx-au label{outline:none!important;-webkit-tap-highlight-color:transparent}
.cx-au input{box-shadow:none;caret-color:#2f8cff}
.cx-au input::-moz-focus-inner{border:0}

/* Register ফিল্ড: বাইরের গোল বক্স ফোকাস হলে নরম নীল রিং */
.cx-au .cx-fw{transition:border-color .18s ease,box-shadow .18s ease,background-color .18s ease}
.cx-au .cx-fw input{border:0!important;background:transparent!important;box-shadow:none!important;outline:none!important}
.cx-au .cx-fw:focus-within{border-color:#2f8cff!important;box-shadow:0 0 0 4px rgba(47,140,255,.16)!important}
.cx-au .cx-fw.err{border-color:#f0506e!important}
.cx-au .cx-fw.err:focus-within{box-shadow:0 0 0 4px rgba(240,80,110,.16)!important}

/* Login ইনপুট: নিজের গোল কোণ ধরে নরম রিং */
.cx-au .cx-ai{transition:border-color .18s ease,box-shadow .18s ease}
.cx-au .cx-ai:focus{border-color:#2f8cff!important;box-shadow:0 0 0 4px rgba(47,140,255,.16)!important}

/* ব্রাউজার autofill এর হলুদ/নীল ব্যাকগ্রাউন্ড বন্ধ */
.cx-au input:-webkit-autofill,
.cx-au input:-webkit-autofill:hover,
.cx-au input:-webkit-autofill:focus{
  -webkit-text-fill-color:inherit;
  caret-color:#2f8cff;
  transition:background-color 99999s ease-in-out 0s;
  box-shadow:0 0 0 1000px transparent inset!important;
}

/* মাঝখানের মেসেজ কার্ড */
.cx-tov{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(2,6,14,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:cxtfade .16s ease-out}
.cx-tcard{width:min(86vw,320px);padding:28px 22px 24px;border-radius:20px;background:#131c2e;border:1px solid rgba(255,255,255,.08);box-shadow:0 24px 64px rgba(0,0,0,.55);text-align:center;color:#e8edf7;animation:cxtpop .2s cubic-bezier(.2,.9,.3,1.2)}
.cx-tic{width:60px;height:60px;margin:0 auto 16px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.cx-tic svg{width:30px;height:30px}
.cx-tcard.ok .cx-tic{background:rgba(25,195,125,.14);color:#19c37d}
.cx-tcard.bad .cx-tic{background:rgba(240,80,110,.14);color:#f0506e}
.cx-tcard.info .cx-tic{background:rgba(47,140,255,.14);color:#2f8cff}
.cx-tcard.load .cx-tic{background:rgba(47,140,255,.14);color:#2f8cff}
.cx-tspin{width:28px;height:28px;border-radius:50%;border:3px solid rgba(47,140,255,.25);border-top-color:#2f8cff;animation:cxtspin .8s linear infinite}
.cx-ttx{font-size:16px;line-height:1.45;font-weight:500;overflow-wrap:anywhere}
@keyframes cxtfade{from{opacity:0}to{opacity:1}}
@keyframes cxtpop{from{transform:scale(.88);opacity:0}to{transform:none;opacity:1}}
@keyframes cxtspin{to{transform:rotate(360deg)}}
`;

/* ---------------- মাঝখানের কার্ড মেসেজ ---------------- */
function Toast({ msg, onClose, tx }) {
  const { k, kind } = msg;

  useEffect(() => {
    if (!k || kind === "load") return undefined;
    const id = setTimeout(onClose, kind === "bad" ? 2800 : 1800);
    return () => clearTimeout(id);
    // eslint-disable-next-line
  }, [k, kind]);

  if (!k) return null;

  const icon =
    kind === "ok" ? (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    ) : kind === "bad" ? (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v7.5" /><path d="M12 17.5v.01" /></svg>
    ) : kind === "load" ? (
      <i className="cx-tspin" />
    ) : (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 11v6" /><path d="M12 7.5v.01" /></svg>
    );

  return (
    <div className="cx-tov" onClick={kind === "load" ? undefined : onClose} role="alert">
      <div className={"cx-tcard " + kind} onClick={(e) => e.stopPropagation()}>
        <div className="cx-tic">{icon}</div>
        <div className="cx-ttx">{tx(k)}</div>
      </div>
    </div>
  );
}

/* ---------------- ইনপুট ফিল্ড (Register) ---------------- */
function Field({ label, icon, type = "text", value, onChange, error, right, onKeyDown, autoComplete, placeholder }) {
  return (
    <div className="cx-fd">
      <label>{label}</label>
      <div className={"cx-fw" + (error ? " err" : "")}>
        <span className="cx-fi"><Ic d={icon} s={20} /></span>
        <input type={type} value={value} onChange={onChange} onKeyDown={onKeyDown} autoComplete={autoComplete} placeholder={placeholder} />
        {right}
      </div>
      {error && <div className="cx-fer">{error}</div>}
    </div>
  );
}

/* key না থাকলে fallback দেখানোর helper */
function useTx() {
  const t = useT();
  return (k) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : (FB[k] || k);
  };
}

/* ---------------- Login → POST /auth/login ---------------- */
export function Login({ onLogin, lang, setLang, go, flash = "" }) {
  const t = useT();
  const tx = useTx();
  const rem0 = store.get("cx_rem", "");
  const [email, setEmail] = useState(rem0);
  const [pw, setPw] = useState("");
  const [rem, setRem] = useState(!!rem0);
  const [busy, setBusy] = useState(false);
  const [cs, setCs] = useState(false);
  const [msg, setMsg] = useState(flash ? { k: flash, kind: "info" } : NONE);
  const mail = email.trim().toLowerCase();

  const login = async () => {
    if (busy) return;
    setBusy(true); setMsg({ k: "wait2", kind: "load" });
    try {
      const r = await api("/auth/login", { method: "POST", body: { email: mail, password: pw } });
      store.set("cx_rem", rem ? mail : "");
      setMsg({ k: "loginOk", kind: "ok" });
      await sleep(900);
      setMsg(NONE);
      await onLogin(r);
    } catch (e) { setMsg({ k: (e && e.message) || "err", kind: "bad" }); }
    setBusy(false);
  };
  const enter = (e) => { if (e.key === "Enter") login(); };

  return (
    <div className="cx-pg cx-au">
      <style>{CSS}</style>

      {/* উপরের বার: ব্যাক বাটন + ভাষা (Register এর মতো) */}
      <div className="cx-pt">
        <button onClick={() => go("app")} aria-label="back">‹</button>
        <div className="cx-pt2"><LangPicker lang={lang} setLang={setLang} /></div>
      </div>

      <div className="cx-alogo">
        <i>
          <svg viewBox="0 0 100 100"><g fill="none" stroke="#06c9c9" strokeWidth="6.5">
            <path d="M76 16H50a34 34 0 000 68h26V66" /><path d="M76 33H50a17 17 0 000 34h26V54" /><path d="M76 49H54a3 3 0 000 6h22" />
          </g></svg>
        </i>
      </div>
      <div className="cx-acard">
        <input className="cx-ai" type="text" autoComplete="username" placeholder={t("acc")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="cx-ai" type="password" autoComplete="current-password" placeholder={t("pw")} value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={enter} />
        <label className="cx-rm"><input type="checkbox" checked={rem} onChange={(e) => setRem(e.target.checked)} />{t("rem")}</label>
      </div>
      <button className="cx-a1" style={{ opacity: busy ? 0.6 : 1 }} onClick={login}>{t("login")}</button>
      <div className="cx-alinks">
        <button onClick={() => go("register")}>{t("register")}</button>
        {/* Forgot password → Customer service 1 / 2 */}
        <button onClick={() => setCs(true)}>{t("forgot")}</button>
      </div>

      <Toast msg={msg} onClose={() => setMsg(NONE)} tx={tx} />
      <CSheet open={cs} onClose={() => setCs(false)} />
    </div>
  );
}

/* ---------------- Register ---------------- */
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
  const ePw = tried && pw.length < 6 ? t("bPw") : "";
  const ePw2 = tried && pw2 !== pw ? t("bMatch") : "";

  const submit = async () => {
    if (busy) return;
    setTried(true);
    if (!mailOk(mail) || pw.length < 6 || pw !== pw2) return;
    setBusy(true); setMsg({ k: "wait2", kind: "load" });
    try {
      const r = await api("/auth/register", { method: "POST", body: { email: mail, password: pw, password2: pw2 } });
      setMsg({ k: "regOk", kind: "ok" });
      await sleep(900);
      setMsg(NONE);
      await onLogin(r);
    } catch (e) { setMsg({ k: (e && e.message) || "err", kind: "bad" }); }
    setBusy(false);
  };
  const enter = (e) => { if (e.key === "Enter") submit(); };

  const eye = (
    <button type="button" className="cx-fe" onClick={() => setShow(!show)} aria-label="toggle password">
      <Ic d={ICON.eye} s={20} />
    </button>
  );

  return (
    <div className="cx-pg cx-au">
      <style>{CSS}</style>

      <div className="cx-pt">
        <button onClick={() => go("app")} aria-label="back">‹</button>
        <div className="cx-pt2"><LangPicker lang={lang} setLang={setLang} /></div>
      </div>

      <div className="cx-hero">
        <div className="cx-plogo">
          <svg viewBox="0 0 100 100"><g fill="none" stroke="#fff" strokeWidth="7">
            <path d="M76 16H50a34 34 0 000 68h26V66" /><path d="M76 33H50a17 17 0 000 34h26V54" /><path d="M76 49H54a3 3 0 000 6h22" />
          </g></svg>
        </div>
        <h1>{t("createAcc")}</h1>
        <p>{t("createSub")}</p>
      </div>

      <div className="cx-pcard">
        <Field label={t("email")} icon={ICON.user} type="text" autoComplete="username" placeholder={t("acc")}
          value={email} onChange={(e) => setEmail(e.target.value)} error={eMail} />
        <Field label={t("pwLbl")} icon={ICON.lock} type={show ? "text" : "password"} autoComplete="new-password"
          placeholder={t("pw")} value={pw} onChange={(e) => setPw(e.target.value)} error={ePw} right={eye} />
        {pw && (
          <div className="cx-str">
            <div>{[1, 2, 3].map((n) => <i key={n} className={"s" + sc + (n <= sc ? " on" : "")} />)}</div>
            <span className={"s" + sc}>{sc === 1 ? t("strWeak") : sc === 2 ? t("strMid") : t("strStrong")}</span>
          </div>
        )}
        <Field label={t("pw2Lbl")} icon={ICON.lock} type={show ? "text" : "password"} autoComplete="new-password"
          placeholder={t("pw2")} value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={enter} error={ePw2} />

        <button className="cx-pbtn" style={{ opacity: busy ? 0.6 : 1 }} onClick={submit}>
          {t("register")}
        </button>

        <div className="cx-pdiv"><span /></div>
        <p className="cx-pfoot">
          {t("haveAcc")}
          <button className="cx-plink" onClick={() => go("login")}>{t("login")}</button>
        </p>
        <button className="cx-pghost" onClick={() => go("app")}>{t("guest")}</button>
      </div>

      <button className="cx-pcs" onClick={() => setCs(true)}>
        <Ic d={ICON.chat} s={18} />{t("csHelp")}
      </button>

      <Toast msg={msg} onClose={() => setMsg(NONE)} tx={tx} />
      <CSheet open={cs} onClose={() => setCs(false)} />
    </div>
  );
}

export default Login;
