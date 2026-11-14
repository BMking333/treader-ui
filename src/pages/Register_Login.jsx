import React, { useState } from "react";
import { useT, api, store, Ic, ICON, CSheet } from "./Home";
import { LangPicker } from "../lib/i18n";

/* =====================================================================
   src/pages/Register_Login.jsx — Login + Register (এক ফাইলে)
   export: { Login, Register } (named) + default Login
   Login    → POST /auth/login
   Register → POST /auth/register
   "Forgot password" এখন আর আলাদা পেজ নয়: ক্লিক করলে
   Customer service 1 / Customer service 2 শিট খুলবে (CSheet)।
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

/* ---------------- Login → POST /auth/login ---------------- */
export function Login({ onLogin, lang, setLang, go, flash = "" }) {
  const t = useT();
  const rem0 = store.get("cx_rem", "");
  const [email, setEmail] = useState(rem0);
  const [pw, setPw] = useState("");
  const [rem, setRem] = useState(!!rem0);
  const [busy, setBusy] = useState(false);
  const [cs, setCs] = useState(false);
  const [msg, setMsg] = useState({ k: flash, ok: true });
  const mail = email.trim().toLowerCase();

  const login = async () => {
    if (busy) return;
    setBusy(true); setMsg({ k: "wait2", ok: true });
    try {
      const r = await api("/auth/login", { method: "POST", body: { email: mail, password: pw } });
      store.set("cx_rem", rem ? mail : "");
      setMsg({ k: "", ok: true });
      await onLogin(r);
    } catch (e) { setMsg({ k: e.message, ok: false }); }
    setBusy(false);
  };
  const enter = (e) => { if (e.key === "Enter") login(); };
  const note = msg.k ? <p className={"cx-msg" + (msg.ok ? "" : " bad")}>{t(msg.k)}</p> : null;

  return (
    <div className="cx-pg cx-au">
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
      {note}
      <button className="cx-a1" style={{ opacity: busy ? 0.6 : 1 }} onClick={login}>{t("login")}</button>
      <div className="cx-alinks">
        <button onClick={() => go("register")}>{t("register")}</button>
        {/* Forgot password → Customer service 1 / 2 */}
        <button onClick={() => setCs(true)}>{t("forgot")}</button>
      </div>

      <CSheet open={cs} onClose={() => setCs(false)} />
    </div>
  );
}

/* ---------------- Register ---------------- */
export function Register({ onLogin, go, lang, setLang }) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", ok: true });
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
    setBusy(true); setMsg({ k: "wait2", ok: true });
    try {
      const r = await api("/auth/register", { method: "POST", body: { email: mail, password: pw, password2: pw2 } });
      setMsg({ k: "", ok: true });
      await onLogin(r);
    } catch (e) { setMsg({ k: e.message, ok: false }); }
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

        {msg.k && <p className={"cx-msg" + (msg.ok ? "" : " bad")}>{t(msg.k)}</p>}

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
      <CSheet open={cs} onClose={() => setCs(false)} />
    </div>
  );
}

export default Login;
