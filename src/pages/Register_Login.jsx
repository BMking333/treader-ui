import React, { useState } from "react";
import { useT, store, api, Ic, ICON, LangPicker } from "./Home";

/* =====================================================================
   src/pages/Register_Login.jsx — Login, Register, Forgot (আলাদা পেজ)
   ব্যবহার: import { Login, Register } from "./pages/Register_Login";
   ===================================================================== */

function AuBar({ title, onBack, onHelp }) {
  return (
    <div className="cx-ab">
      <button onClick={onBack} aria-label="back">‹</button>
      <h1>{title}</h1>
      <button onClick={onHelp} aria-label="support"><Ic d={ICON.headset} s={28} /></button>
    </div>
  );
}

/* ---------------- LOGIN PAGE ---------------- */
export function Login({ onLogin, lang, setLang, go, flash = "" }) {
  const t = useT();
  const rem0 = store.get("cx_rem", "");
  const [email, setEmail] = useState(rem0), [pw, setPw] = useState(""), [rem, setRem] = useState(!!rem0), [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: flash, ok: true });
  const mail = email.trim().toLowerCase();
  const login = async () => {
    if (busy) return;
    setBusy(true); setMsg({ k: "wait2", ok: true });
    try {
      const r = await api("/auth/login", { method: "POST", body: { email: mail, password: pw } });
      store.set("cx_rem", rem ? mail : "");
      await onLogin(r);
    } catch (e) { setMsg({ k: e.message, ok: false }); }
    setBusy(false);
  };
  const enter = (e) => { if (e.key === "Enter") login(); };
  const note = msg.k ? <p className={"cx-msg" + (msg.ok ? "" : " bad")}>{t(msg.k)}</p> : null;
  return (
    <div className="cx-pg cx-au">
      <AuBar title={t("login")} onBack={() => go("app")} onHelp={() => {}} />
      <div className="cx-alogo"><i><svg viewBox="0 0 100 100"><g fill="none" stroke="#06c9c9" strokeWidth="6.5"><path d="M76 16H50a34 34 0 000 68h26V66" /><path d="M76 33H50a17 17 0 000 34h26V54" /><path d="M76 49H54a3 3 0 000 6h22" /></g></svg></i></div>
      <div className="cx-acard">
        <input className="cx-ai" type="text" autoComplete="username" placeholder={t("acc")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="cx-ai" type="password" autoComplete="current-password" placeholder={t("pw")} value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={enter} />
        <label className="cx-rm"><input type="checkbox" checked={rem} onChange={(e) => setRem(e.target.checked)} />{t("rem")}</label>
      </div>
      {note}
      <button className="cx-a1" style={{ opacity: busy ? 0.6 : 1 }} onClick={login}>{t("login")}</button>
      <div className="cx-alinks"><button onClick={() => go("register")}>{t("register")}</button><button onClick={() => go("forgot")}>{t("forgot")}</button></div>
      <div className="cx-alang"><LangPicker lang={lang} setLang={setLang} /></div>
    </div>
  );
}

/* ---------------- REGISTER / FORGOT PAGE ---------------- */
export function Register({ mode = "register", onLogin, go }) {
  const t = useT();
  const isReg = mode === "register";
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [pw2, setPw2] = useState(""), [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ k: "", ok: false });
  const mail = email.trim().toLowerCase();
  const run = async (fn) => {
    if (busy) return;
    setBusy(true); setMsg({ k: "wait2", ok: true });
    try { await fn(); } catch (e) { setMsg({ k: e.message, ok: false }); }
    setBusy(false);
  };
  const reg = () => run(async () => {
    const r = await api("/auth/register", { method: "POST", body: { email: mail, password: pw, password2: pw2 } });
    await onLogin(r);
  });
  const reset = () => run(async () => {
    await api("/auth/forgot", { method: "POST", body: { email: mail, password: pw, password2: pw2 } });
    go("login", "resetOk");
  });
  const submit = isReg ? reg : reset;
  const enter = (e) => { if (e.key === "Enter") submit(); };
  const note = msg.k ? <p className={"cx-msg" + (msg.ok ? "" : " bad")}>{t(msg.k)}</p> : null;
  return (
    <div className="cx-pg cx-au">
      <AuBar title={t(isReg ? "register" : "reset")} onBack={() => go("login")} onHelp={() => {}} />
      <div className="cx-atab"><span>{t("email")}</span></div>
      <div className="cx-acard flat">
        <input className="cx-ai" type="text" autoComplete="username" placeholder={t("acc")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="cx-ai" type="password" autoComplete="new-password" placeholder={t(isReg ? "pw" : "newPw")} value={pw} onChange={(e) => setPw(e.target.value)} />
        <input className="cx-ai" type="password" autoComplete="new-password" placeholder={t("pw2")} value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={enter} />
      </div>
      {note}
      <button className="cx-a1" style={{ opacity: busy ? 0.6 : 1 }} onClick={submit}>{t(isReg ? "register" : "reset")}</button>
      <div className="cx-alinks"><button onClick={() => go("login")}>{t("hasAcc")}</button></div>
    </div>
  );
}

export default Login;
