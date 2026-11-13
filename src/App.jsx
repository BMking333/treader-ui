import React, { useEffect, useState } from "react";
import {
  BLUE, GREEN, RED, LANGS, RTL, T, T2, T3, LangCtx,
  store, TOKEN, setToken, setOn401, api,
} from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import { Login, Register } from "./pages/Register_Login";

/* =====================================================================
   src/App.jsx — Root: ভাষা, ডার্ক মোড, লগইন স্টেট, পেজ রাউটিং + CSS
   URL: /login /register /forgot  → auth পেজ, বাকি সব → Dashboard
   ===================================================================== */

const AUTH_PATH = { login: "/login", register: "/register", forgot: "/forgot" };
const cleanPath = () => (window.location.pathname.replace(/\/+$/, "") || "/");
const pathToView = (p) => (p === "/login" ? "login" : p === "/register" ? "register" : p === "/forgot" ? "forgot" : "app");
const isAuthPath = (p) => p === "/login" || p === "/register" || p === "/forgot";
const pushUrl = (url) => { if (url !== window.location.pathname + window.location.search) window.history.pushState(null, "", url); };
const replaceUrl = (url) => { if (url !== window.location.pathname + window.location.search) window.history.replaceState(null, "", url); };

export default function App() {
  const [lang, setLangS] = useState(() => store.get("cx_lang", "en"));
  const [dark, setDarkS] = useState(() => store.get("cx_dark", true));
  const [me, setMe] = useState(null);
  const [view, setView] = useState(() => (TOKEN ? "boot" : pathToView(cleanPath())));
  const [flash, setFlash] = useState("");

  const patchSettings = (b) => { if (TOKEN) api("/user/settings", { method: "PATCH", body: b }).catch(() => {}); };
  const setLang = (l) => { setLangS(l); store.set("cx_lang", l); patchSettings({ lang: l }); };
  const setDark = (v) => { setDarkS(v); store.set("cx_dark", v); patchSettings({ dark: v }); };
  const t = (k) => (T[lang]?.[k] ?? T2[lang]?.[k] ?? T3[lang]?.[k] ?? T.en[k] ?? T2.en[k] ?? T3.en[k] ?? k);

  /* পেজ বদলালে URL-ও বদলায় */
  const go = (v, f = "") => {
    setFlash(f);
    setView(v);
    if (AUTH_PATH[v]) pushUrl(AUTH_PATH[v]);
    else if (v === "app" && isAuthPath(cleanPath())) pushUrl("/");
  };

  const logout = () => { setToken(""); setMe(null); setFlash(""); setView("app"); replaceUrl("/"); };
  setOn401(logout);

  /* সার্ভারে সেভ করা lang/dark ইউজারের সেটিং হিসেবে বসায় */
  const applyMe = (u) => {
    if (!u) return;
    if (u.lang && LANGS.some((l) => l[0] === u.lang)) { setLangS(u.lang); store.set("cx_lang", u.lang); }
    if (typeof u.dark === "boolean") { setDarkS(u.dark); store.set("cx_dark", u.dark); }
  };

  /* login/register রেসপন্স = {access_token, token_type, email, uid} → তারপর /auth/me দিয়ে পুরো প্রোফাইল */
  const onLogin = async (r) => {
    const tok = r && (r.token || r.access_token);
    if (tok) setToken(tok);
    let u = { email: r?.email, uid: r?.uid, vip: 0, reputation: 0 };
    try { u = await api("/auth/me"); applyMe(u); } catch {}
    setMe(u);
    setView("app");
    replaceUrl("/");
  };

  useEffect(() => {
    if (!TOKEN) return;
    api("/auth/me")
      .then((j) => { applyMe(j); setMe(j); setView("app"); if (isAuthPath(cleanPath())) replaceUrl("/"); })
      .catch(() => { setToken(""); setView("app"); });
  }, []); // eslint-disable-line

  /* ব্রাউজারের Back / Forward বাটন */
  useEffect(() => {
    const onPop = () => {
      const p = cleanPath();
      if (TOKEN && isAuthPath(p)) { replaceUrl("/"); setView("app"); return; }
      setView((cur) => (cur === "boot" ? cur : pathToView(p)));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <LangCtx.Provider value={{ lang, t }}>
      <div className={"cx" + (dark ? " dark" : "")} dir={RTL.includes(lang) ? "rtl" : "ltr"}>
        <style>{CSS}</style>
        {view === "boot" && <div className="cx-pg" />}
        {view === "login" && <Login onLogin={onLogin} lang={lang} setLang={setLang} go={go} flash={flash} />}
        {view === "register" && <Register mode="register" onLogin={onLogin} go={go} lang={lang} setLang={setLang} />}
        {view === "forgot" && <Register mode="forgot" onLogin={onLogin} go={go} lang={lang} setLang={setLang} />}
        {view === "app" && <Dashboard key={me ? (me.uid ?? me.email) : "guest"} me0={me} logout={logout} askLogin={(v = "login", f = "") => go(v, f)} lang={lang} setLang={setLang} dark={dark} setDark={setDark} />}
      </div>
    </LangCtx.Provider>
  );
}

/* ====================== CSS ====================== */
/* ⬇️ এখান থেকে নিচে আগের const CSS = `...`; হুবহু থাকবে, কিছু বদলাবে না */
