import React, { useEffect, useState } from "react";
import {
  BLUE, GREEN, RED,
  store, TOKEN, setToken, setOn401, api,
} from "./pages/Home";

import { RTL, LangCtx, isLang, translate } from "./lib/i18n";
import {
  initTracking,
  identifyUser,
  trackPageview,
  trackEvent,
  bindClickTracking,
} from "./lib/tracking";
import Dashboard from "./pages/Dashboard";
import { Login, Register } from "./pages/Register_Login";

// Admin Pages (src/pages/admin/)
// Sidebar (src/pages/admin/Admin_sidbar.jsx) is rendered here, once, for every admin page.
import Admin_Login from "./pages/admin/Admin_Login";
import Admin_Dashbord from "./pages/admin/Admin_Dashbord";
import Admin_PaymentMethod from "./pages/admin/Admin_PaymentMethod";
import Admin_Deposit from "./pages/admin/Admin_Deposit";
import Admin_Withdrew from "./pages/admin/Admin_Withdrew";
import AdminOptions from "./pages/admin/AdminOptions";
import Admin_Kyclist from "./pages/admin/Admin_kyclist";
import Admin_Userlist from "./pages/admin/Admin_Userlist";
import AdminSidebar from "./pages/admin/Admin_sidbar";

/* =========================================================
   APP ROUTING
   Admin login:      example.com/V8/login
   Admin dashboard:  example.com/V8/dashboard

   To add a new admin page:
     1) add its path in ADMIN_PATH
     2) add its component in ADMIN_VIEWS
     3) add the same key in ADMIN_LINKS inside Admin_sidbar.jsx
========================================================= */

const ADMIN_BASE = "/V8";

const AUTH_PATH = {
  login: "/login",
  register: "/register",
  forgot: "/forgot",
  adminLogin: ADMIN_BASE + "/login",
};

const ADMIN_PATH = {
  admin: ADMIN_BASE + "/dashboard",
  adminUsers: ADMIN_BASE + "/users",
  adminKyc: ADMIN_BASE + "/kyc",
  adminDeposits: ADMIN_BASE + "/deposits",
  adminWithdrawals: ADMIN_BASE + "/withdrawals",
  adminPaymentMethods: ADMIN_BASE + "/payment-methods",
  adminOptions: ADMIN_BASE + "/options",
};

// view key -> page component (all receive me, go, logout)
const ADMIN_VIEWS = {
  admin: Admin_Dashbord,
  adminUsers: Admin_Userlist,
  adminKyc: Admin_Kyclist,
  adminDeposits: Admin_Deposit,
  adminWithdrawals: Admin_Withdrew,
  adminPaymentMethods: Admin_PaymentMethod,
  adminOptions: AdminOptions,
};

// current path, lowercased (so /V8/login and /v8/login both match)
const cleanPath = () =>
  (window.location.pathname.replace(/\/+$/, "") || "/").toLowerCase();

const low = (s) => s.toLowerCase();

// any path under /V8 (login page included)
const isAdminArea = (path) =>
  path === low(ADMIN_BASE) || path.startsWith(low(ADMIN_BASE) + "/");

const isAdminLoginPath = (path) => path === low(AUTH_PATH.adminLogin);

// protected admin pages (login page excluded)
const isAdminPath = (path) =>
  isAdminArea(path) && !isAdminLoginPath(path);

const isAuthPath = (path) =>
  path === "/login" ||
  path === "/register" ||
  path === "/forgot";

const pathToView = (path) => {
  if (path === "/login") return "login";
  if (path === "/register") return "register";
  if (path === "/forgot") return "forgot";

  if (isAdminLoginPath(path)) return "adminLogin";

  // exact admin pages
  const adminKey = Object.keys(ADMIN_PATH).find(
    (key) => path === low(ADMIN_PATH[key])
  );
  if (adminKey) return adminKey;

  // /V8 on its own, or any unknown /V8/... path -> dashboard
  if (isAdminArea(path)) return "admin";

  return "app";
};

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

// rows from an API response ({data:[..]}, {items:[..]}, [..] ...)
const rowsOf = (data) => {
  if (data?.data !== undefined) data = data.data;
  else if (data?.result !== undefined) data = data.result;
  if (Array.isArray(data)) return data;
  return data?.items || data?.deposits || data?.requests || data?.results || [];
};

const isEditable = (node) => {
  const el = node && node.nodeType === 3 ? node.parentElement : node;
  return !!(el && el.closest && el.closest("input,textarea,[contenteditable='true'],.sel"));
};

// opened from an email link: /?reset=TOKEN  or  /?verified=1|0
const FROM_MAIL = (() => {
  try {
    const q = new URLSearchParams(window.location.search);
    return q.has("reset") || q.has("verified");
  } catch (_) {
    return false;
  }
})();

/* =========================================================
   DEFAULT THEME = LIGHT
   - New visitors see light mode.
   - If the user picks dark, it is saved and stays dark.
   - One-time reset: old users who only had the old default
     (dark) are moved to light once. After that, their own
     choice is respected.
========================================================= */
const initialDark = () => {
  if (!store.get("cx_dark_v2", false)) {
    store.set("cx_dark_v2", true);
    store.set("cx_dark", false);
    return false;
  }
  return store.get("cx_dark", false);
};

export default function App() {
  const [lang, setLangS] = useState(() => {
    const l = store.get("cx_lang", "en");
    return isLang(l) ? l : "en";
  });

  const [dark, setDarkS] = useState(initialDark);

  const [me, setMe] = useState(null);

  const [view, setView] = useState(() => {
    if (FROM_MAIL) return "login";
    return TOKEN ? "boot" : pathToView(cleanPath());
  });

  const [flash, setFlash] = useState("");

  // admin sidebar (mobile drawer) + pending badges
  const [sideOpen, setSideOpen] = useState(false);
  const [badges, setBadges] = useState({});

  /* =====================================================
     TRACKING
  ===================================================== */

  useEffect(() => {
    initTracking();
    return bindClickTracking();
  }, []);

  useEffect(() => {
    if (view === "boot") return;
    trackPageview(cleanPath());
  }, [view]);

  useEffect(() => {
    identifyUser(me ? (me.uid ?? me.email ?? null) : null);
  }, [me]);

  /* =====================================================
     NO SELECT / NO COPY MENU (long-press)
     (not applied inside the admin area)
  ===================================================== */

  useEffect(() => {
    const block = (e) => {
      if (isAdminArea(cleanPath())) return;
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

    trackEvent("change_language", { lang: value });
    patchSettings({ lang: value });
  };

  const setDark = (value) => {
    setDarkS(value);
    store.set("cx_dark", value);

    trackEvent("change_theme", { dark: !!value });
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
      window.scrollTo(0, 0);
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
    const fromAdmin = isAdminArea(cleanPath());

    trackEvent("logout", { admin: fromAdmin });

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

    trackEvent(isNew ? "register_success" : "login_success", {
      admin: isAdmin(user),
    });

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
    if (FROM_MAIL) {
      if (TOKEN) setToken("");
      return;
    }

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
     ADMIN SIDEBAR (shared layout for every admin page)
  ===================================================== */

  const AdminView = ADMIN_VIEWS[view];
  const adminScreen = !!AdminView && isAdmin(me);

  const closeSide = () => setSideOpen(false);

  // drawer is always closed when leaving the admin area
  useEffect(() => {
    if (!adminScreen) setSideOpen(false);
  }, [adminScreen]);

  // pending badges: refresh on every page change + every 60s
  useEffect(() => {
    if (!adminScreen) return undefined;

    let alive = true;

    const loadBadges = async () => {
      const [dep, wc] = await Promise.allSettled([
        api("/admin/deposits"),
        api("/admin/withdraws/counts"),
      ]);
      if (!alive) return;

      const next = {};

      if (dep.status === "fulfilled") {
        next.adminDeposits = rowsOf(dep.value).filter(
          (x) => String(x?.status || "pending").toLowerCase() === "pending"
        ).length;
      }
      if (wc.status === "fulfilled") {
        const c = wc.value?.data ?? wc.value ?? {};
        next.adminWithdrawals = Number(c.pending || 0);
      }

      setBadges((old) => ({ ...old, ...next }));
    };

    loadBadges();
    const timer = setInterval(loadBadges, 60000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [adminScreen, view]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <LangCtx.Provider value={{ lang, t }}>
      <div
        className={"cx" + (dark ? " dark" : "") + (adminScreen ? " adm" : "")}
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

        {/* All admin pages: one sidebar + one 3-dot button for everything */}
        {adminScreen && (
          <>
            <AdminSidebar
              current={view}
              open={sideOpen}
              onClose={closeSide}
              onNavigate={(key) => go(key)}
              me={me}
              logout={logout}
              badges={badges}
            />

            <div className="as-content">
              <AdminView
                key={view}
                me={me}
                go={go}
                logout={logout}
              />
            </div>

            <button
              type="button"
              className={"adm-fab" + (sideOpen ? " open" : "")}
              onClick={() => setSideOpen((v) => !v)}
              aria-label={sideOpen ? "Close menu" : "Open menu"}
              aria-expanded={sideOpen}
            >
              <svg className="dots" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="5" r="2.2" />
                <circle cx="12" cy="12" r="2.2" />
                <circle cx="12" cy="19" r="2.2" />
              </svg>
              <svg className="x" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </>
        )}
      </div>
    </LangCtx.Provider>
  );
}

/* ====================== CSS ====================== */
const CSS = `
.cx{min-height:100vh;background:#e0e1ea;color:#111;font-family:Roboto,system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;justify-content:center;overflow-x:hidden}
.cx *{box-sizing:border-box}
/* চাপ ধরলে Copy / Select all / Web search / Share মেনু আসবে না; ইনপুটে টাইপ ও পেস্ট ঠিক থাকবে */
.cx,.cx *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
.cx input,.cx textarea,.cx [contenteditable="true"],.cx .sel,.cx .sel *{-webkit-user-select:text;user-select:text;-webkit-touch-callout:default}
.cx img,.cx svg{-webkit-user-drag:none;user-drag:none}
.cx:where(:not(.adm)) button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:start}
.cx:where(:not(.adm)) small{color:#8a8d99;font-size:13px;display:block}
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
.cx-au{background:#e0e1ea;padding-bottom:30px}
.cx-ab{display:grid;grid-template-columns:48px 1fr 48px;align-items:center;padding:12px 14px;background:#fff;border-bottom:1px solid #eceef3}
.cx-ab h1{margin:0;font-size:19px;font-weight:500;text-align:center}
.cx-ab button{font-size:32px;line-height:1;display:grid;place-items:center;height:40px;text-align:center!important}
.cx[dir=rtl] .cx-ab button:first-child{transform:scaleX(-1)}
.cx-alogo{display:grid;place-items:center;padding:28px 0 26px}
.cx-alogo i{display:block;width:150px;height:150px;background:#fff}
.cx-alogo svg{width:100%;height:100%;display:block}
.cx-atab{background:#fff;text-align:center;padding-top:16px;font-size:18px;border-bottom:12px solid #e0e1ea}
.cx-atab span{display:inline-block;padding:0 14px 12px;border-bottom:4px solid ${BLUE}}
.cx-acard{background:#fff;margin:0 12px;padding:4px 20px}
.cx-acard.flat{margin:0}
.cx-ai{display:block;width:100%;border:0;border-bottom:1px solid #ddd;outline:0;padding:22px 0 18px;font-size:17px;background:transparent;color:inherit}
.cx-rm{display:flex;align-items:center;gap:12px;padding:18px 0;font-size:17px}
.cx-rm input{width:22px;height:22px;accent-color:${BLUE}}
.cx-a1{display:block;width:calc(100% - 44px);margin:22px 22px 0;background:#1a82d6!important;color:#fff!important;border-radius:14px;padding:17px 0;text-align:center!important;font-size:19px}
.cx-a1.flat{width:100%;margin:18px 0 0}
.cx-alinks{display:flex;justify-content:space-between;align-items:center;padding:22px 24px 8px}
.cx-alinks button{color:${BLUE}!important;font-size:17px}
.cx-alang{display:flex;justify-content:center;padding:18px 0}
.cx-msg.bad{background:#fdecee;color:${RED}}
.cx-au .cx-msg{margin:12px 22px 0}
.cx-fm{padding:10px 18px 20px}
.cx-fm h4{margin:16px 0 8px;font-size:15px;font-weight:500;color:#6b6f7c}
.cx-fm .cx-in{height:56px;margin:4px 0}
.cx-fm .cx-in input{font-size:17px}
.cx-chips{display:flex;gap:10px;flex-wrap:wrap}
.cx-chips button{padding:10px 20px;border:1px solid #bbb!important;border-radius:8px;font-size:16px;text-align:center!important}
.cx-chips button.on{border-color:${BLUE}!important;color:${BLUE};background:rgba(31,122,203,.08)}
.cx-all{width:auto!important;padding:0 12px;color:${BLUE}!important;font-size:16px!important;border:0!important}
.cx-kv{display:flex;justify-content:space-between;gap:10px;font-size:15px;padding:7px 0;color:#6b6f7c}
.cx-kv b{font-weight:500;color:inherit;text-align:end}
.cx-hist h3{margin:8px 18px 4px;font-size:17px}
.cx-tx{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 18px;border-bottom:1px solid #eceef3;font-size:15px}
.cx-tx b{font-weight:600}
.cx-tx .st{font-size:13px;padding:4px 10px;border-radius:12px}
.cx-tx .st.dep{background:rgba(14,203,129,.15);color:#0a9b63}
.cx-tx .st.wd{background:rgba(232,145,79,.18);color:#c26d1c}
.cx-empty2{text-align:center;color:#9aa0ad;padding:30px 0}
.cx.dark .cx-au,.cx.dark .cx-atab{background:#0b1424}
.cx.dark .cx-ab,.cx.dark .cx-acard{background:#17263d}
.cx.dark .cx-alogo i{background:#fff}
.cx.dark .cx-atab{background:#121e2f;border-bottom-color:#0b1424}
.cx.dark .cx-ab,.cx.dark .cx-ai,.cx.dark .cx-tx{border-color:#22304a}
.cx.dark .cx-chips button{border-color:#5b6b88!important}
.cx.dark .cx-chips button.on{border-color:${BLUE}!important;color:#4aa3f0}
.cx.dark .cx-fm h4,.cx.dark .cx-kv{color:#9aa6bb}
.cx.dark .cx-msg.bad{background:#3b1a20}
.cx-cap{text-transform:capitalize}
.cx-lgin{border:1px solid #1a82d6!important;color:#1a82d6!important;border-radius:20px;padding:8px 18px;font-size:15px;text-transform:capitalize;text-align:center!important;white-space:nowrap}
.cx-reg{border:0!important;color:#fff!important;background:linear-gradient(110deg,#1fbad0,#2a7de1)!important;border-radius:20px;padding:9px 18px;font-size:15px;font-weight:600;text-transform:capitalize;text-align:center!important;white-space:nowrap;box-shadow:0 4px 12px rgba(40,125,225,.3)}
.cx-reg:active,.cx-lgin:active{transform:scale(.97)}
.cx-mp .cx-a1{width:100%;margin:8px 0 0}
.cx-sq{display:inline-block;width:11px;height:11px;border:1px solid #787b86;margin-right:8px;vertical-align:-1px}
.cx-pg.od{background:#0d1626;color:#e8ecf3}
.cx-pg.od small{color:#8d98ad}
.cx-pg.od .cx-top{border-color:#243148;color:#fff}
.cx-pg.od .cx-top h1{color:#fff;font-weight:700;font-size:22px}
.cx-pg.od .cx-opt-h{border-bottom:1px solid #243148}
.cx-pg.od .cx-opt-h i{color:#e8ecf3}
.cx-pg.od .cx-opt-h div{color:#aab3c5}
.cx-pg.od .cx-chartw{background:#131a2a;border-color:#2a3548}
.cx-pg.od .cx-ctool{background:#0d1626;border-color:#2a3548}
.cx-pg.od .cx-ctool button{border-color:#2a3548;color:#aab3c5}
.cx-pg.od .cx-cti{color:#c1c7d4}
.cx-pg.od .cx-ivm{background:#1c2639;border-color:#2a3548}
.cx-pg.od .cx-gl{stroke:#1e2a3f}
.cx-pg.od .cx-ax{stroke:#2e3a50}
.cx-pg.od .cx-gt{fill:#c1c7d4}
.cx-pg.od .cx-gt2{color:#c1c7d4}
.cx-pg.od .cx-ch{stroke:#8a93a6}
.cx-pg.od .cx-zoom button{background:#2a3548!important;color:#e8ecf3!important}
.cx-pg.od .cx-gear{color:#9aa6bb!important}
.cx-pg.od .cx-tbl,.cx-pg.od .cx-tbh{border-color:#243148}
.cx-pg.od .cx-tabs button{color:#aab3c5}
.cx-pg.od .cx-tabs button.on{color:#fff}
.cx-pg.od .cx-norec{color:#7d889c}
.cx-pg.od .cx-msg{background:#17304f}
.cx-pg.od .cx-obar{background:#0d1626;border-color:#243148;color:#fff}
.cx-pg.od .cx-sheet,.cx-pg.od .cx-drawer{background:#17263d;color:#e8ecf3}
.cx-pg.od .cx-drawer button{border-color:#2a3a56}
.cx-csh{width:100%;max-width:520px;background:#fff;border-radius:20px 20px 0 0;padding-bottom:calc(30px + env(safe-area-inset-bottom));color:#111}
.cx-csh-h{display:grid;grid-template-columns:1fr auto;align-items:center;padding:22px 20px 26px;position:relative}
.cx-csh-h b{font-weight:500;font-size:18px;text-align:center;grid-column:1/-1}
.cx-csh-h button{position:absolute;inset-inline-end:16px;top:18px;font-size:22px;color:#9aa0ad;line-height:1}
.cx-csh-r{display:flex;justify-content:space-between;align-items:center;padding:20px 18px;border-top:1px solid #eceef3;font-size:17px;color:inherit;text-decoration:none}
.cx-csh-r:last-child{border-bottom:1px solid #eceef3}
.cx-csh-r i{font-style:normal;color:#9aa0ad;font-size:26px;line-height:1}
.cx[dir=rtl] .cx-csh-r i{transform:scaleX(-1)}
.cx.dark .cx-csh{background:#17263d;color:#e8ecf3}
.cx.dark .cx-csh-r{border-color:#22304a}
.cx-pg.cx-au{background:#f3f5fa;padding-bottom:40px}
.cx.dark .cx-pg.cx-au{background:#0b1424}
.cx-pt{display:flex;justify-content:space-between;align-items:center;padding:14px 16px}
.cx-pt>button,.cx-pt2>button{font-size:34px;line-height:1;width:44px;height:44px;display:grid;place-items:center;border-radius:12px;text-align:center!important}
.cx-pt2>button{font-size:inherit}
.cx-pt2{display:flex;align-items:center;gap:8px}
.cx-pt2 .cx-lang{font-size:15px;padding:8px 10px;background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.cx[dir=rtl] .cx-pt>button:first-child{transform:scaleX(-1)}
.cx-hero{text-align:center;padding:6px 24px 22px}
.cx-plogo{width:84px;height:84px;margin:0 auto 18px;border-radius:24px;background:linear-gradient(135deg,#17c3c9,#1f7acb);display:grid;place-items:center;box-shadow:0 10px 26px rgba(31,122,203,.35)}
.cx-plogo svg{width:54px;height:54px}
.cx-hero h1{margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:.2px}
.cx-hero p{margin:0;color:#7b8190;font-size:15px}
.cx-pcard{background:#fff;margin:0 16px;border-radius:20px;padding:22px 20px 20px;box-shadow:0 8px 30px rgba(20,40,80,.08)}
.cx-pcard .cx-msg{margin:12px 0 0}
.cx-fd{margin-bottom:14px}
.cx-fd label{display:block;font-size:14px;font-weight:500;color:#4a5062;margin-bottom:8px}
.cx-fw{display:flex;align-items:center;gap:10px;height:52px;padding:0 12px;border:1.5px solid #dfe3ec;border-radius:12px;background:#fafbfe;transition:border-color .15s,box-shadow .15s}
.cx-fw:focus-within{border-color:${BLUE};box-shadow:0 0 0 3px rgba(31,122,203,.15);background:#fff}
.cx-fw.err{border-color:${RED}}
.cx-fi{display:flex;color:#8a93a6;flex:none}
.cx-fw input{flex:1;min-width:0;border:0;outline:0;background:transparent;font-size:16px;color:inherit;height:100%}
.cx-fe{display:flex;color:#8a93a6;padding:6px;margin-inline-end:-6px;text-align:center!important}
.cx .cx-fer{color:${RED};font-size:13px;margin-top:6px}
.cx-prow{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:2px 0 6px;flex-wrap:wrap}
.cx-prow .cx-rm{padding:8px 0;font-size:14px;color:#4a5062}
.cx-prow .cx-rm input{width:18px;height:18px}
.cx-plink{color:${BLUE}!important;font-size:14px;font-weight:600}
.cx-pfoot .cx-plink{font-size:15px;margin-inline-start:4px}
.cx-pbtn{display:block;width:100%;margin-top:16px;padding:16px 0;border-radius:12px;background:linear-gradient(135deg,#2a8fe0,#1f7acb)!important;color:#fff!important;font-size:17px;font-weight:600;text-align:center!important;box-shadow:0 6px 16px rgba(31,122,203,.35)}
.cx-pbtn:active{transform:translateY(1px)}
.cx-pdiv{display:flex;align-items:center;margin:20px 0 14px}
.cx-pdiv span{flex:1;height:1px;background:#e5e8f0}
.cx-pfoot{margin:0;text-align:center;font-size:15px;color:#6b7183}
.cx-pghost{display:block;width:100%;margin-top:14px;padding:13px 0;border:1.5px solid #dfe3ec!important;border-radius:12px;text-align:center!important;font-size:15px;color:#4a5062}
.cx-pcs{display:flex;align-items:center;justify-content:center;gap:8px;width:calc(100% - 32px);margin:22px 16px 0;padding:14px 0;color:${BLUE}!important;font-size:14px;text-align:center!important}
.cx-str{display:flex;align-items:center;gap:10px;margin:-6px 0 14px}
.cx-str div{display:flex;gap:5px;flex:1}
.cx-str i{flex:1;height:5px;border-radius:3px;background:#e3e6ee}
.cx-str i.s1.on{background:#e5484d}.cx-str i.s2.on{background:#f5a623}.cx-str i.s3.on{background:#0ecb81}
.cx-str span{font-size:13px;min-width:60px;text-align:end}
.cx-str span.s1{color:#e5484d}.cx-str span.s2{color:#f5a623}.cx-str span.s3{color:#0ecb81}
.cx.dark .cx-pcard{background:#17263d;box-shadow:none}
.cx.dark .cx-hero p,.cx.dark .cx-pfoot{color:#9aa6bb}
.cx.dark .cx-fd label,.cx.dark .cx-prow .cx-rm{color:#b6c0d3}
.cx.dark .cx-fw{background:#101c30;border-color:#2c3b57}
.cx.dark .cx-fw:focus-within{background:#0d1626;border-color:${BLUE}}
.cx.dark .cx-pdiv span{background:#2c3b57}
.cx.dark .cx-pghost{border-color:#2c3b57!important;color:#b6c0d3}
.cx.dark .cx-str i{background:#2c3b57}
.cx.dark .cx-pt2 .cx-lang{background:#17263d;box-shadow:none}
@media(max-width:400px){
.cx-bar{padding:10px 12px;gap:6px}
.cx-bauth{gap:6px}
.cx-lgin,.cx-reg{padding:7px 12px;font-size:13px}
.cx-bar .cx-lang{font-size:14px;gap:6px}
.cx-bar .cx-fl{font-size:18px}
}
@media(min-width:768px){
.cx-pg.cx-au{max-width:560px}
.cx-csh{max-width:640px}
.cx-pg{max-width:900px;padding-bottom:110px}
.cx-nav{max-width:900px;padding:8px 0}
.cx-nav button{font-size:14px;gap:3px}
.cx-nav svg{width:24px;height:24px}
.cx-obar{bottom:64px;max-width:900px}
.cx-banner{aspect-ratio:21/6}
.cx-bar{padding:12px 24px}
.cx-lang{font-size:16px}
.cx-lgm button{font-size:16px;padding:12px 14px}
.cx-tick b{font-size:24px}.cx-tick span,.cx-tick em{font-size:15px}
.cx-grid{grid-template-columns:repeat(3,1fr);gap:12px;padding:16px}
.cx-grid button{font-size:16px;padding:18px}
.cx-h{font-size:20px;padding:16px 24px 10px}
.cx-th,.cx-row{padding-left:24px;padding-right:24px;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) 100px}
.cx-th{font-size:15px}
.cx-row b{font-size:17px}.cx-row .cx-nm b small{font-size:13px}
.cx-pill{width:90px;font-size:15px;padding:9px 0}
.cx-top h1{font-size:20px}.cx-top h1 small{font-size:15px}.cx-top button{font-size:30px}.cx-top .cx-link{font-size:16px}
.cx-tabs button{font-size:17px}
.cx-ex{padding:20px 24px;gap:30px}
.cx-bh,.cx-bk{font-size:14px;padding:9px 0}.cx-bh{font-size:15px}
.cx-mid{font-size:22px}
.cx-bs button{font-size:17px;padding:13px}
.cx-sel{font-size:17px}
.cx-in{height:58px}.cx-in input,.cx-in b{font-size:16px}
.cx-form small{font-size:14px}
.cx-pc button{font-size:15px}
.cx-cta{font-size:18px;padding:14px}
.cx-ent{font-size:20px;padding:18px 24px}.cx-ent b{font-size:17px}
.cx-drawer h2{font-size:26px}.cx-drawer h3{font-size:24px;margin:30px 28px 14px}.cx-drawer button{font-size:18px}
.cx-opt-h{padding:18px 24px}.cx-opt-h>b{font-size:24px}.cx-opt-h div{font-size:14px}
.cx-obar button{font-size:16px}.cx-obar b{font-size:18px}
.cx-sheet{max-width:640px;padding:28px 28px 24px}
.cx-sheet h4{font-size:20px}
.cx-chs button{font-size:17px}
.cx-line input{font-size:22px}.cx-line button{font-size:19px}
.cx-info{font-size:17px}
.cx-two button{font-size:20px;padding:20px 0}
.cx-cards{padding:16px 24px}
.cx-ac h3{font-size:22px}.cx-ac small{font-size:16px}.cx-ac>b{font-size:22px}
.cx-3{font-size:19px}.cx-3 small{font-size:15px}
.cx-sum h2{font-size:22px}.cx-sum>b{font-size:22px}.cx-sum small{font-size:16px}
.cx-mp p,.cx-mr{font-size:17px}
.cx-a1{font-size:17px}
.cx-tbl{font-size:14px}
.cx-norec{font-size:18px}
}

.cx-pg:has(.cx-op){max-width:none;padding-bottom:0;box-shadow:none}
.cx:has(.cx-op) .cx-nav{max-width:none}

/* ===== Admin area: full-width layout, light background, normal text selection ===== */
.cx.adm,.cx.dark.adm{display:block;background:#f4f6fa;color:#0f1b30;overflow-x:clip}
.cx.adm .ad-wrap,.cx.adm .as-content{width:100%}
.cx.adm,.cx.adm *{-webkit-user-select:text;user-select:text;-webkit-touch-callout:default}
.cx.adm button,.cx.adm .as-side,.cx.adm .as-side *{-webkit-user-select:none;user-select:none}
.cx.adm button{cursor:pointer}

/* ===== Admin: floating 3-dot menu button (mobile / tablet only) ===== */
.adm-fab{display:none;position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:70;width:56px;height:56px;padding:0;border:0;border-radius:50%;color:#fff;background:linear-gradient(135deg,#1fbad0,#2a7de1);box-shadow:0 12px 26px rgba(31,122,203,.45),0 2px 6px rgba(15,27,48,.2),inset 0 0 0 1px rgba(255,255,255,.25);place-items:center;transition:transform .2s ease,box-shadow .2s ease,background .2s ease}
.adm-fab svg{grid-area:1/1;transition:transform .28s ease,opacity .2s ease}
.adm-fab .x{opacity:0;transform:rotate(-90deg) scale(.5)}
.adm-fab.open{background:linear-gradient(135deg,#2b3a55,#0f1b30);box-shadow:0 12px 26px rgba(15,27,48,.4),inset 0 0 0 1px rgba(255,255,255,.18)}
.adm-fab.open .dots{opacity:0;transform:rotate(90deg) scale(.5)}
.adm-fab.open .x{opacity:1;transform:none}
.adm-fab:active{transform:scale(.92)}
.adm-fab:focus-visible{outline:3px solid rgba(31,122,203,.45);outline-offset:3px}
@media(max-width:960px){.adm-fab{display:grid}}
@media(prefers-reduced-motion:reduce){.adm-fab,.adm-fab svg{transition:none}}
`;
