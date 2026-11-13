import React, { useState } from "react";
import { useT, api, AuBar } from "../lib/cex";

/* ---------------- Register / Forgot password
   mode="register" → POST /auth/register
   mode="forgot"   → POST /auth/forgot  ---------------- */
export default function Register({ mode = "register", onLogin, go }) {
  const t = useT();
  const isReg = mode === "register";
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
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
    onLogin(r);
  });
  const reset = () => run(async () => {
    await api("/auth/forgot", { method: "POST", body: { email: mail, password: pw, password2: pw2 } });
    go("login", "resetOk"); // Login পেজে ফিরে "Password updated" মেসেজ দেখাবে
  });
  const submit = isReg ? reg : reset;
  const enter = (e) => { if (e.key === "Enter") submit(); };
  const note = msg.k ? <p className={"cx-msg" + (msg.ok ? "" : " bad")}>{t(msg.k)}</p> : null;

  return (
    <div className="cx-pg cx-au">
      <AuBar title={t(isReg ? "register" : "reset")} onBack={() => go("login")} onHelp={() => setMsg({ k: "demo", ok: true })} />
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
