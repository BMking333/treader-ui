import React, { useEffect, useState } from "react";
import {
  BLUE, GREEN, RED,
  store, TOKEN, setToken, setOn401, api,
} from "./pages/Home";

import { RTL, LangCtx, isLang, translate } from "./lib/i18n";
import Dashboard from "./pages/Dashboard";
import { Login, Register } from "./pages/Register_Login";

// Admin Pages (src/pages/admin/)
import Admin_Login from "./pages/admin/Admin_Login";
import Admin_Dashbord from "./pages/admin/Admin_Dashbord";
import Admin_PaymentMethod from "./pages/admin/Admin_PaymentMethod";
import Admin_Deposit from "./pages/admin/Admin_Deposit";
import Admin_Withdrew from "./pages/admin/Admin_Withdrew";
import AdminOptions from "./pages/admin/AdminOptions";

/* =========================================================
   APP ROUTING
   Admin base path:  example.com/v2/admin-dashbord
========================================================= */

const ADMIN_BASE = "/v2/admin-dashbord";

const AUTH_PATH = {
  login: "/login",
  register: "/register",
  forgot: "/forgot",
  adminLogin: ADMIN_BASE + "/login",
};

const ADMIN_PATH = {
  admin: ADMIN_BASE,
  adminPaymentMethods: ADMIN_BASE + "/payment-methods",
  adminDeposits: ADMIN_BASE + "/deposits",
  adminWithdrawals: ADMIN_BASE + "/withdrawals",
  adminOptions: ADMIN_BASE + "/options",
};

const cleanPath = () =>
  window.location.pathname.replace(/\/+$/, "") || "/";

const pathToView = (path) => {
  if (path === "/login") return "login";
  if (path === "/register") return "register";
  if (path === "/forgot") return "forgot";

  if (path === AUTH_PATH.adminLogin) return "adminLogin";

  if (path === ADMIN_PATH.admin) return "admin";
  if (path === ADMIN_PATH.adminPaymentMethods) return "adminPaymentMethods";
  if (path === ADMIN_PATH.adminDeposits) return "adminDeposits";
  if (path === ADMIN_PATH.adminWithdrawals) return "adminWithdrawals";
  if (path === ADMIN_PATH.adminOptions) return "adminOptions";

  return "app";
};

const isAuthPath = (path) =>
  path === "/login" ||
  path === "/register" ||
  path === "/forgot";

const isAdminLoginPath = (path) => path === AUTH_PATH.adminLogin;

// any path under /v2/admin-dashbord (login page included)
const isAdminArea = (path) =>
  path === ADMIN_BASE || path.startsWith(ADMIN_BASE + "/");

// protected admin pages (login page excluded)
const isAdminPath = (path) =>
  isAdminArea(path) && !isAdminLoginPath(path);

const pushUrl = (url) => {
  if (url !== window.location.pathname + window.location.search) {
    window.history.pushState(null, "", url);
  }
};

const replaceUrl = (url) => {
  if (url !== window.location.pathname + window.location.search) {
    window.history.replaceState(null, "", url);
  }
};

// Admin role check
const isAdmin = (user) => {
  const role = String(user?.role || "").toLowerCase();
  return role === "admin" && user?.is_active !== false;
};

/* লেখা/ইনপুট ছাড়া বাকি সব জায়গায় সিলেক্ট / কপি / কনটেক্সট মেনু বন্ধ।
   যেখানে কপি দরকার সেখানে class="sel" দিলে চালু থাকবে */
const isEditable = (node) => {
  const el = node && node.nodeType === 3 ? node.parentElement : node;
  return !!(el && el.closest && el.closest("input,textarea,[contenteditable='true'],.sel"));
};

export default function App() {
  const [lang, setLangS] = useState(() => {
    const l = store.get("cx_lang", "en");
    return isLang(l) ? l : "en";
  });

  const [dark, setDarkS] = useState(() =>
    store.get("cx_dark", true)
  );

  const [me, setMe] = useState(null);

  const [view, setView] = useState(() =>
    TOKEN ? "boot" : pathToView(cleanPath())
  );

  const [flash, setFlash] = useState("");

  /* =====================================================
     NO SELECT / NO COPY MENU (long-press)
  ===================================================== */

  useEffect(() => {
    const block = (e) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };
    const noDragImg = (e) => {
      if (e.target && e.target.tagName === "IMG") e.preventDefault();
    };

    document.addEventListener("contextmenu", block);
    document.addEventListener("selectstart", block);
    document.addEventListener("dragstart", noDragImg);

    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("dragstart", noDragImg);
    };
  }, []);

  /* =====================================================
     LANGUAGE / THEME
  ===================================================== */

  const patchSettings = (body) => {
    if (TOKEN) {
      api("/user/settings", {
        method: "PATCH",
        body,
      }).catch(() => {});
    }
  };

  const setLang = (value) => {
    if (!isLang(value)) return;

    setLangS(value);
    store.set("cx_lang", value);

    patchSettings({ lang: value });
  };

  const setDark = (value) => {
    setDarkS(value);
    store.set("cx_dark", value);

    patchSettings({ dark: value });
  };

  const t = (key) => translate(lang, key);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL.includes(lang) ? "rtl" : "ltr";
  }, [lang]);

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const go = (target, message = "") => {
    setFlash(message);

    // Admin pages require an authenticated admin
    if (ADMIN_PATH[target]) {
      if (!TOKEN || !isAdmin(me)) {
        setView("adminLogin");
        pushUrl(AUTH_PATH.adminLogin);
        setFlash("Please login with an admin account.");
        return;
      }

      setView(target);
      pushUrl(ADMIN_PATH[target]);
      return;
    }

    setView(target);

    if (AUTH_PATH[target]) {
      pushUrl(AUTH_PATH[target]);
    } else if (target === "app") {
      pushUrl("/");
    }
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const logout = () => {
    // admin area থেকে logout করলে admin login পেজে যাবে
    const fromAdmin = isAdminArea(cleanPath());

    setToken("");
    setMe(null);
    setFlash("");

    if (fromAdmin) {
      setView("adminLogin");
      replaceUrl(AUTH_PATH.adminLogin);
    } else {
      setView("login");
      replaceUrl("/login");
    }
  };

  useEffect(() => {
    setOn401(logout);
  });

  /* =====================================================
     USER SETTINGS
  ===================================================== */

  const applyMe = (user) => {
    if (!user) return;

    if (user.lang && isLang(user.lang)) {
      setLangS(user.lang);
      store.set("cx_lang", user.lang);
    }

    if (typeof user.dark === "boolean") {
      setDarkS(user.dark);
      store.set("cx_dark", user.dark);
    }
  };

  /* =====================================================
     LOGIN / REGISTER SUCCESS
  ===================================================== */

  const onLogin = async (response) => {
    const token =
      response?.token ||
      response?.access_token;

    if (!token) {
      throw new Error("Login token missing");
    }

    setToken(token);

    const isNew = view === "register";
    const fromAdminLogin = view === "adminLogin";

    if (isNew) {
      await api("/user/settings", {
        method: "PATCH",
        body: { lang, dark },
      }).catch(() => {});
    } else {
      applyMe(response);
    }

    let user = {
      email: response?.email,
      uid: response?.uid,
      role: response?.role,
      vip: 0,
      reputation: 0,
    };

    // Always verify user role from backend
    try {
      const result = await api("/auth/me");
      user = result?.user || result;

      if (!isNew) applyMe(user);
    } catch (error) {
      setToken("");
      setMe(null);
      setView(fromAdminLogin ? "adminLogin" : "login");
      replaceUrl(fromAdminLogin ? AUTH_PATH.adminLogin : "/login");
      throw error;
    }

    // Admin login page: only admin accounts are allowed
    if (fromAdminLogin && !isAdmin(user)) {
      setToken("");
      setMe(null);
      setView("adminLogin");
      replaceUrl(AUTH_PATH.adminLogin);
      throw new Error("Admin access only");
    }

    setMe(user);

    if (isAdmin(user)) {
      setView("admin");
      replaceUrl(ADMIN_PATH.admin);
    } else {
      setView("app");
      replaceUrl("/");
    }
  };

  /* =====================================================
     RESTORE LOGIN SESSION
  ===================================================== */

  useEffect(() => {
    if (!TOKEN) {
      if (isAdminPath(cleanPath())) {
        replaceUrl(AUTH_PATH.adminLogin);
        setView("adminLogin");
      }
      return;
    }

    api("/auth/me")
      .then((result) => {
        const user = result?.user || result;

        applyMe(user);
        setMe(user);

        const currentPath = cleanPath();

        if (isAdminPath(currentPath)) {
          if (isAdmin(user)) {
            setView(pathToView(currentPath));
          } else {
            replaceUrl("/");
            setView("app");
          }
        } else if (isAdminLoginPath(currentPath) || isAuthPath(currentPath)) {
          if (isAdmin(user)) {
            replaceUrl(ADMIN_PATH.admin);
            setView("admin");
          } else {
            replaceUrl("/");
            setView("app");
          }
        } else {
          setView("app");
        }
      })
      .catch(() => {
        setToken("");
        setMe(null);

        if (isAdminPath(cleanPath())) {
          replaceUrl(AUTH_PATH.adminLogin);
          setView("adminLogin");
        } else {
          setView("app");
        }
      });
  }, []);

  /* =====================================================
     BROWSER BACK / FORWARD
  ===================================================== */

  useEffect(() => {
    const onPop = () => {
      const path = cleanPath();

      if (TOKEN && (isAuthPath(path) || isAdminLoginPath(path))) {
        if (isAdmin(me)) {
          replaceUrl(ADMIN_PATH.admin);
          setView("admin");
        } else {
          replaceUrl("/");
          setView("app");
        }
        return;
      }

      if (isAdminPath(path)) {
        if (!TOKEN) {
          replaceUrl(AUTH_PATH.adminLogin);
          setView("adminLogin");
          return;
        }
        if (!isAdmin(me)) {
          replaceUrl("/");
          setView("app");
          return;
        }
      }

      setView((current) =>
        current === "boot" ? current : pathToView(path)
      );
    };

    window.addEventListener("popstate", onPop);

    return () =>
      window.removeEventListener("popstate", onPop);
  }, [me]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <LangCtx.Provider value={{ lang, t }}>
      <div
        className={"cx" + (dark ? " dark" : "")}
        dir={RTL.includes(lang) ? "rtl" : "ltr"}
      >
        <style>{CSS}</style>

        {view === "boot" && (
          <div className="cx-pg" />
        )}

        {view === "login" && (
          <Login
            onLogin={onLogin}
            lang={lang}
            setLang={setLang}
            go={go}
            flash={flash}
          />
        )}

        {view === "register" && (
          <Register
            mode="register"
            onLogin={onLogin}
            go={go}
            lang={lang}
            setLang={setLang}
          />
        )}

        {view === "forgot" && (
          <Register
            mode="forgot"
            onLogin={onLogin}
            go={go}
            lang={lang}
            setLang={setLang}
          />
        )}

        {view === "adminLogin" && (
          <Admin_Login
            onLogin={onLogin}
            lang={lang}
            setLang={setLang}
            go={go}
            flash={flash}
          />
        )}

        {view === "app" && (
          <Dashboard
            key={me ? (me.uid ?? me.email) : "guest"}
            me0={me}
            logout={logout}
            askLogin={(v = "login", f = "") => go(v, f)}
            lang={lang}
            setLang={setLang}
            dark={dark}
            setDark={setDark}
          />
        )}

        {view === "admin" && isAdmin(me) && (
          <Admin_Dashbord
            me={me}
            go={go}
            logout={logout}
          />
        )}

        {view === "adminPaymentMethods" && isAdmin(me) && (
          <Admin_PaymentMethod
            me={me}
            go={go}
            logout={logout}
          />
        )}

        {view === "adminDeposits" && isAdmin(me) && (
          <Admin_Deposit
            me={me}
            go={go}
            logout={logout}
          />
        )}

        {view === "adminWithdrawals" && isAdmin(me) && (
          <Admin_Withdrew
            me={me}
            go={go}
            logout={logout}
          />
        )}

        {view === "adminOptions" && isAdmin(me) && (
          <AdminOptions
            me={me}
            go={go}
            logout={logout}
          />
        )}
      </div>
    </LangCtx.Provider>
  );
}

/* ====================== CSS ====================== */
const CSS = `
/* Your entire CSS styles from the code you provided here... */
.cx{min-height:100vh;background:#e0e1ea;color:#111;font-family:Roboto,system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;justify-content:center;overflow-x:hidden}
.cx *{box-sizing:border-box}
/* চাপ ধরলে Copy / Select all / Web search / Share মেনু আসবে না; ইনপুটে টাইপ ও পেস্ট ঠিক থাকবে */
.cx,.cx *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
.cx input,.cx textarea,.cx [contenteditable="true"],.cx .sel,.cx .sel *{-webkit-user-select:text;user-select:text;-webkit-touch-callout:default}
.cx img,.cx svg{-webkit-user-drag:none;user-drag:none}
.cx button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:start}
.cx small{color:#8a8d99;font-size:13px;display:block}
.cx-pg{width:100%;min-width:0;max-width:520px;background:#fff;min-height:100vh;padding-bottom:90px;box-shadow:0 0 40px rgba(0,0,0,.08);overflow-x:hidden}
.cx-bar{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 14px;position:relative;z-index:40}
.cx-logo{width:42px;height:42px;flex:none;padding:0;border-radius:13px;border:0!important;background:#fff!important;display:grid;place-items:center;text-align:center!important;box-shadow:0 4px 14px rgba(25,176,200,.28);transition:transform .15s}
.cx-logo:active{transform:scale(.94)}
.cx-logo svg{display:block}
.cx-bauth{display:flex;align-items:center;gap:8px;margin-inline-start:auto}
.cx-lang{font-size:17px;display:flex;align-items:center;gap:10px}
.cx-fl{font-size:22px;line-height:1}
.cx-lgw{position:relative}
.cx-lgback{position:fixed;inset:0;z-index:45}
.cx-lgm{position:absolute;top:calc(100% + 8px);inset-inline-end:0;width:240px;max-height:62vh;overflow-y:auto;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.25);z-index:46}
.cx-lgm button{display:flex;justify-content:space-between;align-items:center;width:100%;padding:16px 14px;font-size:19px;border-bottom:1px solid #eceef3}
.cx-lgm button.on{color:${BLUE};font-weight:600}
.cx-banner{position:relative;overflow:hidden;background:#0f2230;aspect-ratio:15/6}
.cx-slides{display:flex;height:100%;transition:transform .6s ease;direction:ltr}
.cx-slides img{flex:none;width:100%;height:100%;object-fit:cover;user-select:none}
.cx-dots{position:absolute;bottom:14px;left:50%;display:flex;gap:10px;transform:translateX(-50%)}
.cx-dots i{width:10px;height:10px;border-radius:50%;background:#7a8a92;cursor:pointer}.cx-dots i.on{background:#fff}
.cx-tick{display:grid;grid-template-columns:repeat(3,1fr);text-align:center;padding:22px 0}
.cx-tick button{text-align:center!important}
.cx-tick span{display:block;font-size:17px}
.cx-tick b{display:block;font-size:26px;margin:4px 0}
.cx-tick em{font-style:normal;font-size:17px}
.cx-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#e0e1ea;padding:14px 10px}
.cx-grid button{display:flex;align-items:center;gap:14px;background:#fff;border-radius:10px;padding:16px 18px;font-size:19px}
.cx-h{margin:0;padding:16px 14px 10px;font-size:24px}
.cx-th,.cx-row{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,1.1fr) 84px;align-items:center;gap:8px;padding:0 14px;width:100%}
.cx-th{color:#8a8d99;font-size:14px;padding-top:12px;padding-bottom:12px;border-top:1px solid #e5e6ec}
.cx-th span:last-child{text-align:end}
.cx-row{padding-top:14px;padding-bottom:14px;border-top:1px solid #e5e6ec}
.cx-row b{font-size:17px;font-weight:600;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-row>span{min-width:0}
.cx-nm>span{min-width:0;display:block}
.cx-nm small,.cx-pr small{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.cx-pr{text-align:start}
.cx-row .cx-nm b small{display:inline;font-size:12px;font-weight:400;margin:0}
.cx-nm{display:flex;align-items:center;gap:10px;min-width:0}
.cx-coin{border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;flex:none;object-fit:cover}
.cx-coin.img{background:#fff;display:block}
.cx-dn{display:flex;align-items:center;gap:10px}
.cx-pill{justify-self:end;width:84px;text-align:center;color:#fff;padding:9px 0;border-radius:6px;font-size:15px;font-weight:600}
.cx-top{display:grid;grid-template-columns:48px 1fr auto;align-items:center;padding:12px 14px;border-bottom:1px solid #e5e6ec;gap:6px}
.cx-top h1{margin:0;font-size:24px;text-align:center;font-weight:500}
.cx-top h1 small{display:inline;font-size:18px;margin-inline-start:8px}
.cx-top button{font-size:34px;line-height:1}
.cx-top .cx-link{font-size:17px;display:flex;align-items:center;gap:8px;padding:0 4px;line-height:1.2}
.cx-tabs{display:flex;overflow-x:auto;scrollbar-width:none;padding:6px 10px 0}
.cx-tabs button{padding:16px 16px 12px;font-size:21px;white-space:nowrap;color:#444;border-bottom:4px solid transparent}
.cx-tabs button.on{border-color:${BLUE};color:#000}
.cx-tabs.two{padding-inline-start:0}.cx-tabs.two button{flex:1;text-align:center}
.cx-tabs.big button{flex:1;color:#777;text-align:center}.cx-tabs.big button.on{color:#000}
.cx-empty{padding:40px;text-align:center;color:#8a8d99;background:#e0e1ea}
.cx-ex{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:12px;padding:14px 10px}
.cx-bh,.cx-bk{display:flex;justify-content:space-between;gap:6px;font-size:16px;padding:12px 0}
.cx-bh{color:#8a8d99;font-size:18px}
.cx-bk b{font-weight:400}
.cx-mid{font-size:28px;font-weight:700;padding:16px 0}
.cx-bs{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cx-bs button{text-align:center;padding:14px 4px;font-size:18px;font-weight:600;border-radius:6px;border:2px solid transparent!important}
.cx-bs .bb{background:rgba(0,192,135,.15);color:#00c087;border-color:#00c087!important}
.cx-bs .sb{background:rgba(216,77,90,.15);color:#ff6b78;border-color:#d84d5a!important}
.cx-bs .bb.on{background:#00c087;color:#fff}
.cx-bs .sb.on{background:#d84d5a;color:#fff}
.cx-sel{font-size:21px;padding:18px 14px}
.cx-in{display:flex;align-items:center;border:1px solid #ccd;margin:10px 0 6px;padding:8px;gap:8px;height:68px}
.cx-in input{flex:1;min-width:0;border:0;border-bottom:1px solid #999;outline:0;font-size:18px;padding:6px 2px;background:transparent;color:inherit}
.cx-in button{width:40px;height:44px;border:1px solid #ccd!important;border-radius:4px;text-align:center!important;font-size:22px}
.cx-in b{font-weight:500;font-size:19px}
.cx-form small{margin:4px 0 8px;font-size:16px}
.cx-pc{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.cx-pc button{border:1px solid #555!important;padding:10px 0;text-align:center!important;font-size:17px}
.cx-cta{width:100%;color:#fff!important;padding:18px;margin-top:22px;text-align:center!important;font-size:22px;border-radius:4px}
.cx-msg{margin:8px 10px;padding:10px;background:#eef6ff;color:${BLUE};border-radius:6px;font-size:14px}
.cx-form .cx-msg{margin:10px 0 0}
.cx-ent{display:flex;justify-content:space-between;padding:20px 14px;font-size:26px;border-top:12px solid #e0e1ea}
.cx-ent b{font-size:22px;font-weight:500}
.cx-over{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:50;display:flex}
.cx-over.end{align-items:flex-end;justify-content:center}
.cx-drawer{width:70%;max-width:360px;background:#fff;overflow-y:auto;padding:30px 0}
.cx-drawer h2{font-weight:400;font-size:34px;margin:30px 28px}
.cx-drawer h3{color:${BLUE};font-size:34px;margin:50px 28px 30px}
.cx-drawer button{display:flex;justify-content:space-between;align-items:center;width:calc(100% - 56px);margin:0 28px;padding:20px 0;border-top:1px solid #ddd;font-size:22px}
.cx-drawer button b small{display:inline;color:#666;font-weight:400}
.cx-opt-h{display:flex;justify-content:space-between;padding:18px 14px;align-items:flex-start}
.cx-opt-h>b{font-size:28px;font-weight:600}
.cx-opt-h>b small{color:inherit;font-size:18px;font-weight:400;margin-top:8px}
.cx-opt-h div{display:grid;grid-template-columns:auto auto;gap:8px 30px;font-size:17px;color:#999}
.cx-opt-h i{font-style:normal;color:#222;text-align:end}
.cx-chartw{direction:ltr;border-top:1px solid #dcdfe6;position:relative}
.cx-ctool{display:flex;align-items:center;gap:6px;border-bottom:1px solid #eceef3;height:40px;padding:0 6px}
.cx-ctool>*{display:flex;align-items:center}
.cx-ctool button{padding:6px 14px;font-size:15px;border-inline-end:1px solid #eceef3}
.cx-cti{padding:0 10px;font-size:15px;gap:6px;color:#333}
.cx-ivw{position:relative}
.cx-ivm{position:absolute;top:36px;left:0;background:#fff;border:1px solid #dcdfe6;border-radius:6px;z-index:5;box-shadow:0 6px 20px rgba(0,0,0,.15);display:flex;flex-direction:column;min-width:70px}
.cx-ivm button{border:0;text-align:center;padding:10px 16px}
.cx-ivm button.on{color:${BLUE};font-weight:600}
.cx-cwrap{position:relative;width:100%}
.cx-chead{position:absolute;top:6px;left:8px;font-size:12px;line-height:1.6;z-index:2;pointer-events:none;max-width:calc(100% - 80px)}
.cx-gt2{color:#555}
.cx-gl{stroke:#eef0f4;stroke-width:1}
.cx-ax{stroke:#c9ccd4;stroke-width:1}
.cx-gt{fill:#555}
.cx-ch{stroke:#778;stroke-width:1;stroke-dasharray:4 4}
.cx-zoom{position:absolute;left:50%;bottom:34px;transform:translateX(-50%);display:flex;gap:8px;z-index:3}
.cx-zoom button{width:30px;height:30px;border-radius:50%;background:#fff!important;box-shadow:0 1px 6px rgba(0,0,0,.25);text-align:center!important;font-size:17px;line-height:30px;color:#444!important;padding:0}
.cx-gear{position:absolute;right:20px;bottom:5px;color:#555!important;z-index:3}
.cx-ptabs button{font-size:19px}
.cx-tbl{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:6px;padding:12px 14px;border-bottom:1px solid #eceef3;font-size:15px;align-items:center}
.cx-tbl>span:first-child{display:block;word-break:break-word}
.cx-tbl>span:first-child .cx-coin{vertical-align:middle}
.cx-tbl>span:first-child small{font-size:12px;margin-top:2px}
.cx-tbl>span:not(:first-child){text-align:end}
.cx-tbh{font-size:16px;border-bottom:1px solid #999;padding:16px 14px}
.cx-norec{text-align:center;padding:60px 20px;color:#9aa0ad;font-size:20px}
.cx-norec p{margin:20px 0 0}
.cx-obar{position:fixed;bottom:76px;left:50%;transform:translateX(-50%);width:100%;max-width:520px;background:#fff;display:grid;grid-template-columns:1fr 1fr 1.1fr 1.1fr;gap:8px;padding:10px;z-index:20;border-top:1px solid #e5e6ec}
.cx-obar button{text-align:center!important;font-size:19px}
.cx-obar b{display:block;font-weight:500;font-size:22px}
.cx-obar .g,.cx-two .g{background:${GREEN};color:#fff;border-radius:12px}
.cx-obar .r,.cx-two .r{background:${RED};color:#fff;border-radius:12px}
.cx-obar button.g,.cx-obar button.r{font-weight:700;color:#fff!important;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.cx-sheet{width:100%;max-width:520px;background:#fff;border-radius:26px 26px 0 0;padding:34px 26px 26px}
.cx-sheet h4{margin:20px 0 18px;font-weight:400;font-size:25px}
.cx-chs{display:flex;gap:14px;flex-wrap:wrap}
.cx-chs button{border:1px solid #888!important;padding:14px 0;min-width:78px;flex:1;text-align:center!important;font-size:21px}
.cx-chs button.on{border-color:${BLUE}!important;box-shadow:inset -22px -22px 0 -18px ${BLUE}}
.cx-line{display:flex;align-items:center;gap:10px;margin:22px 0}
.cx-line input{flex:1;font-size:26px;border:0;border-bottom:1px solid #888;outline:0;padding:10px 4px;min-width:0;background:transparent;color:inherit}
.cx-line button{color:${BLUE}!important;font-size:23px;padding:0 16px}
.cx-info{display:flex;justify-content:space-between;color:${GREEN};font-size:22px;margin:18px 0;gap:8px;flex-wrap:wrap}
.cx-two{display:grid;grid-template-columns:1fr 1fr;gap:34px;margin-top:30px}
.cx-two button{padding:26px 0;text-align:center!important;font-size:24px;border-radius:12px}
.cx-cards{display:flex;flex-direction:column;gap:14px;background:#e0e1ea;padding:14px 20px;min-height:600px}
.cx-ac{background:#fff;border-radius:16px;padding:26px}
.cx-ac h3{margin:0 0 20px;color:${BLUE};font-size:28px;display:flex;justify-content:space-between;align-items:center}
.cx-ac h3 i{font-style:normal;color:#111}
.cx-ac small{font-size:20px}
.cx-ac>b{display:block;font-size:26px;font-weight:500;margin-top:10px}
.cx-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:24px}
.cx-3 span:nth-child(2){text-align:center}.cx-3 span:last-child{text-align:end}
.cx-3 small{font-size:18px;margin-bottom:12px}
.cx-sum{display:grid;grid-template-columns:1fr auto;padding:24px 22px 40px;row-gap:12px}
.cx-sum h2{margin:0 0 10px;font-weight:400;font-size:28px}
.cx-sum span{font-size:18px}
.cx-sum>b{font-size:26px}.cx-sum small{font-size:20px}
.cx-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;background:#fff;display:flex;z-index:30;border-top:1px solid #e5e6ec;padding:10px 0 calc(8px + env(safe-area-inset-bottom))}
.cx-nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:19px;color:#111;text-align:center}
.cx-nav svg{color:#5f7a96}
.cx-nav button.on{color:${BLUE}}.cx-nav button.on svg{color:${BLUE}}
.cx-toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:90;background:#14323f;color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:92%}
.cx button:focus-visible,.cx input:focus-visible{outline:2px solid ${BLUE};outline-offset:2px}
.cx-row:active,.cx-grid button:active{background:#f3f4f8}
.cx-mo{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,0);pointer-events:none;transition:background .3s}
.cx-mo.open{background:rgba(0,0,0,.55);pointer-events:auto}
.cx-md{position:absolute;top:0;bottom:0;inset-inline-start:0;width:80%;max-width:380px;background:#fff;transform:translateX(-100%);transition:transform .3s ease;overflow-y:auto;padding:22px 22px 30px}
.cx[dir=rtl] .cx-md{transform:translateX(100%)}
.cx-mo.open .cx-md,.cx[dir=rtl] .cx-mo.open .cx-md{transform:none}
.cx-mp{padding:8px 0 18px;border-bottom:1px solid #e5e6ec}
.cx-mp p{margin:0;font-size:19px;line-height:2;word-break:break-all}
.cx-mr{display:flex;align-items:center;gap:14px;width:100%;padding:20px 0;border-bottom:1px solid #e5e6ec;font-size:19px}
.cx-mi{color:${BLUE};display:flex;flex:none}
.cx-ml{flex:1;min-width:0}
.cx-mv{font-size:inherit;text-align:end;max-width:42%}
.cx-mv.red{color:${RED}}
.cx-ar{color:#8a8d99;font-size:26px;line-height:1}
.cx[dir=rtl] .cx-ar{transform:scaleX(-1)}
.cx-sw{width:60px;height:32px;border-radius:16px;background:#e3e4ea;position:relative;flex:none;transition:background .2s}
.cx-sw i{position:absolute;top:3px;inset-inline-start:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.35);transition:inset-inline-start .2s}
.cx-sw.on{background:${BLUE}}.cx-sw.on i{inset-inline-start:31px}
.cx-lo{display:block;width:100%;margin-top:30px;padding:20px 0;background:#1a82d6!important;color:#fff!important;border-radius:16px;text-align:center!important;font-size:21px}
.cx.dark{background:#080f1c;color:#e8ecf3}
.cx.dark .cx-pg{background:#121e2f;box-shadow:0 0 40px rgba(0,0,0,.4)}
.cx.dark small{color:#8d98ad}
.cx.dark .cx-th,.cx.dark .cx-row,.cx.dark .cx-top,.cx.dark .cx-nav,.cx.dark .cx-obar,.cx.dark .cx-mr,.cx.dark .cx-mp,.cx.dark .cx-lgm button,.cx.dark .cx-tbl,.cx.dark .cx-ctool,.cx.dark .cx-ctool button,.cx.dark .cx-chartw{border-color:#22304a}
.cx.dark .cx-tbh{border-bottom-color:#5b6b88}
.cx.dark .cx-th{color:#8d98ad}
.cx.dark .cx-grid,.cx.dark .cx-cards,.cx.dark .cx-empty{background:#0b1424}
.cx.dark .cx-grid button,.cx.dark .cx-ac{background:#17263d}
.cx.dark .cx-ent{border-top-color:#0b1424}
.cx.dark .cx-nav,.cx.dark .cx-obar{background:#121e2f}
.cx.dark .cx-nav button{color:#e8ecf3}.cx.dark .cx-nav button.on{color:#4aa3f0}
.cx.dark .cx-nav button.on svg{color:#4aa3f0}
.cx.dark .cx-drawer,.cx.dark .cx-sheet,.cx.dark .cx-lgm,.cx.dark .cx-md,.cx.dark .cx-ivm{background:#17263d;border-color:#22304a}
.cx.dark .cx-tabs button{color:#aab4c6}.cx.dark .cx-tabs button.on,.cx.dark .cx-tabs.big button.on{color:#fff}
.cx.dark .cx-tabs.big button{color:#8d98ad}
.cx.dark .cx-in,.cx.dark .cx-in button{border-color:#3a4a66!important}
.cx.dark .cx-in input,.cx.dark .cx-line input{border-bottom-color:#5b6b88}
.cx.dark .cx-pc button,.cx.dark .cx-chs button{border-color:#5b6b88!important}
.cx.dark .cx-chs button.on{border-color:${BLUE}!important}
.cx.dark .cx-msg{background:#17304f}
.cx.dark .cx-opt-h i,.cx.dark .cx-ac h3 i{color:#e8ecf3}
.cx.dark .cx-drawer button{border-color:#2a3a56}
.cx.dark .cx-sw{background:#3a4a66}.cx.dark .cx-sw.on{background:${BLUE}}
.cx.dark .cx-row:active,.cx.dark .cx-grid button:active{background:#1d2e49}
.cx.dark .cx-gl{stroke:#1d2b42}.cx.dark .cx-ax{stroke:#3a4a66}.cx.dark .cx-gt{fill:#9aa6bb}.cx.dark .cx-gt2{color:#9aa6bb}
.cx.dark .cx-cti{color:#cfd6e4}
.cx.dark .cx-zoom button{background:#2a3a56!important;color:#e8ecf3!important}
.cx.dark .cx-gear{color:#9aa6bb!important}
.cx-pg:has(.cx-op){max-width:none;padding-bottom:0;box-shadow:none}
.cx:has(.cx-op) .cx-nav{max-width:none}
`;

