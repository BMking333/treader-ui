import React, { useMemo, useState } from "react";
import { LangCtx, T, T2, T3, RTL, CSS, store, api, getToken, setToken, setOn401, usePrices } from "./lib/cex";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

/* লগইন ছাড়া প্রথমে যে Home পেজ দেখাবে।
   Home-এর যেকোনো বাটনে (coin, deposit, menu ইত্যাদি) চাপলে Login পেজে যাবে। */
function GuestHome({ lang, setLang, goAuth }) {
  const P = usePrices();
  const to = (p) => goAuth(p === "register" ? "register" : "login");
  return <Home guest P={P} go={to} lang={lang} setLang={setLang} onMenu={() => to("login")} />;
}

/* App root: language, theme, login gate.
   ব্যবহার: main.jsx-এ <App /> রেন্ডার করুন (আগের HomePage এর জায়গায়) */
export default function App() {
  const [lang, setLangS] = useState(() => store.get("cx_lang", "en"));
  const [dark, setDarkS] = useState(() => store.get("cx_dark", false));
  const [sess, setSess] = useState(() => ({ token: store.get("cx_token", ""), email: store.get("cx_session", ""), uid: store.get("cx_uid", 0) }));
  const [auth, setAuth] = useState({ page: "home", flash: "" }); // home | login | register | forgot
  const goAuth = (page, flash = "") => setAuth({ page, flash });

  const syncSetting = (body) => { if (getToken()) api("/user/settings", { method: "PATCH", body }).catch(() => {}); };
  const setLang = (l) => { setLangS(l); store.set("cx_lang", l); syncSetting({ lang: l }); };
  const setDark = (v) => { setDarkS(v); store.set("cx_dark", v); syncSetting({ dark: v }); };
  const t = useMemo(() => (k) => (T[lang] && T[lang][k]) || (T2[lang] && T2[lang][k]) || (T3[lang] && T3[lang][k]) || T.en[k] || T2.en[k] || T3.en[k] || k, [lang]);

  const login = (r) => {
    setToken(r.access_token);
    store.set("cx_token", r.access_token); store.set("cx_session", r.email); store.set("cx_uid", r.uid);
    setSess({ token: r.access_token, email: r.email, uid: r.uid });
    window.scrollTo(0, 0);
  };
  const logout = () => {
    setToken("");
    store.set("cx_token", ""); store.set("cx_session", ""); store.set("cx_uid", 0);
    setSess({ token: "", email: "", uid: 0 });
    goAuth("home");
  };
  setOn401(logout);

  return (
    <LangCtx.Provider value={{ lang, t }}>
      <div className={"cx" + (dark ? " dark" : "")} dir={RTL.includes(lang) ? "rtl" : "ltr"}>
        <style>{CSS}</style>
        {sess.token ? (
          <Dashboard key={sess.email} me0={{ email: sess.email, uid: sess.uid, vip: 1, reputation: 100 }} logout={logout} lang={lang} setLang={setLang} dark={dark} setDark={setDark} />
        ) : auth.page === "register" || auth.page === "forgot" ? (
          <Register key={auth.page} mode={auth.page} onLogin={login} go={goAuth} />
        ) : auth.page === "home" ? (
          <GuestHome lang={lang} setLang={setLang} goAuth={goAuth} />
        ) : (
          <Login key={auth.flash} onLogin={login} lang={lang} setLang={setLang} go={goAuth} flash={auth.flash} />
        )}
      </div>
    </LangCtx.Provider>
  );
}
