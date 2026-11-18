import React, { useEffect } from "react";
import { Ic, ICON } from "../Home";

/* =========================================================
   src/pages/admin/Admin_sidbar.jsx
   Shared admin sidebar
   - Desktop: always visible (fixed left, 268px)
   - Mobile / tablet (<= 960px): hidden drawer, opened with the
     3-dot button (<SidebarMenuButton />), closes on overlay tap,
     X button, Escape, or after choosing a page.

   Usage (any admin page):
     const [sideOpen, setSideOpen] = useState(false);

     <AdminSidebar
       current="admin"
       open={sideOpen}
       onClose={() => setSideOpen(false)}
       onNavigate={(key) => go(key)}
       me={me}
       logout={logout}
       badges={{ adminDeposits: 3, adminWithdrawals: 1 }}
     />
     <div className="as-content"> ...page... </div>
     <SidebarMenuButton open={sideOpen} onToggle={() => setSideOpen(v => !v)} />

   Keep the page content inside an element with class "as-content"
   (or add margin-left: 268px on desktop yourself).
   ========================================================= */

export const SIDEBAR_WIDTH = 268;

export const ADMIN_LINKS = [
  { key: "admin", label: "Dashboard", icon: ICON.trade },
  { key: "adminUsers", label: "Users", icon: ICON.eye },
  { key: "adminKyc", label: "KYC", icon: ICON.lock },
  { key: "adminDeposits", label: "Deposits", icon: ICON.doc },
  { key: "adminWithdrawals", label: "Withdrawals", icon: ICON.card },
  { key: "adminPaymentMethods", label: "Payment Methods", icon: ICON.card },
  { key: "adminOptions", label: "Options", icon: ICON.eye },
];

const CSS = `
.as-side, .as-side *, .as-overlay, .as-menu-btn { box-sizing: border-box; }

.as-side {
  position: fixed; top: 0; left: 0; bottom: 0; z-index: 60;
  width: ${SIDEBAR_WIDTH}px;
  display: flex; flex-direction: column;
  background: #0f1b30;
  color: #cbd5e6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.as-side button { font-family: inherit; cursor: pointer; -webkit-appearance: none; appearance: none; }
.as-side button:focus-visible,
.as-menu-btn:focus-visible { outline: 2px solid #3aa0f0; outline-offset: 2px; }

.as-top {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 18px 18px 16px;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.as-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.as-brand-icon {
  width: 42px; height: 42px; flex: none; border-radius: 12px;
  background: linear-gradient(135deg, #1fbad0, #2a7de1);
  color: #fff; display: grid; place-items: center;
  font-size: 20px; font-weight: 800;
  box-shadow: 0 6px 16px rgba(40,125,225,.35);
}
.as-brand h2 { margin: 0; font-size: 16.5px; font-weight: 800; letter-spacing: -.2px; color: #fff; }
.as-brand p { margin: 2px 0 0; font-size: 11.5px; color: #8a97ad; }
.as-close {
  display: none; width: 36px; height: 36px; flex: none;
  border: 0; border-radius: 10px;
  background: rgba(255,255,255,.08); color: #fff;
  font-size: 18px; line-height: 1;
}

.as-scroll { flex: 1; overflow-y: auto; padding: 14px 12px; }
.as-scroll::-webkit-scrollbar { width: 6px; }
.as-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.14); border-radius: 6px; }
.as-label { padding: 8px 10px; font-size: 11.5px; color: #78859b; font-weight: 600; }

.as-item {
  width: 100%; display: flex; align-items: center; gap: 12px;
  min-height: 46px; padding: 0 12px; margin-bottom: 3px;
  border: 0; border-radius: 11px;
  background: transparent; color: #cbd5e6;
  font-size: 13.5px; font-weight: 600; text-align: left;
  transition: background .15s, color .15s;
}
.as-item:hover { background: rgba(255,255,255,.07); color: #fff; }
.as-item.on {
  background: linear-gradient(135deg, rgba(31,186,208,.22), rgba(42,125,225,.28));
  color: #fff;
  box-shadow: inset 3px 0 0 #3aa0f0;
}
.as-ic {
  width: 32px; height: 32px; flex: none; border-radius: 9px;
  background: rgba(255,255,255,.06);
  display: grid; place-items: center;
}
.as-item.on .as-ic { background: rgba(255,255,255,.14); }
.as-tx { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.as-badge {
  flex: none; min-width: 22px; height: 22px; padding: 0 7px;
  border-radius: 999px; background: #e0a416; color: #1b1300;
  font-size: 11.5px; font-weight: 800;
  display: inline-flex; align-items: center; justify-content: center;
}

.as-foot { padding: 12px; border-top: 1px solid rgba(255,255,255,.07); }
.as-user {
  display: flex; align-items: center; gap: 10px;
  padding: 8px; margin-bottom: 10px; min-width: 0;
  border-radius: 12px; background: rgba(255,255,255,.05);
}
.as-avatar {
  width: 36px; height: 36px; flex: none; border-radius: 50%;
  background: linear-gradient(135deg, #1fbad0, #2a7de1);
  color: #fff; display: grid; place-items: center;
  font-size: 14px; font-weight: 800;
}
.as-info { min-width: 0; line-height: 1.25; }
.as-info b { display: block; font-size: 12.5px; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.as-info small { display: block; font-size: 11px; color: #8a97ad; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.as-logout {
  width: 100%; min-height: 42px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid rgba(255,107,129,.35); border-radius: 11px;
  background: rgba(224,65,95,.12); color: #ff8ea1;
  font-size: 13px; font-weight: 700;
  transition: background .15s;
}
.as-logout:hover { background: rgba(224,65,95,.22); }

.as-overlay {
  display: none; position: fixed; inset: 0; z-index: 55;
  background: rgba(10,18,32,.5);
  -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
}

/* 3-dot toggle: only shown on mobile / tablet */
.as-menu-btn {
  display: none; width: 42px; height: 42px; flex: none;
  border: 1px solid #e5e9f0; border-radius: 11px;
  background: #fff; color: #0f1b30;
  place-items: center; cursor: pointer;
  -webkit-appearance: none; appearance: none;
}
.as-menu-btn:active { transform: scale(.95); }

/* page content offset on desktop */
.as-content { margin-left: ${SIDEBAR_WIDTH}px; min-width: 0; }

@media (max-width: 960px) {
  .as-side {
    transform: translateX(-102%);
    transition: transform .26s ease;
    width: min(300px, 86vw);
  }
  .as-side.open { transform: translateX(0); box-shadow: 8px 0 40px rgba(10,18,32,.35); }
  .as-close { display: grid; place-items: center; }
  .as-overlay.open { display: block; }
  .as-menu-btn { display: grid; }
  .as-content { margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .as-side { transition: none !important; }
}
`;

/* 3-dot button (put it in the page header) */
export function SidebarMenuButton({ open, onToggle }) {
  return (
    <button
      type="button"
      className="as-menu-btn"
      onClick={onToggle}
      aria-label={open ? "Hide menu" : "Open menu"}
      aria-expanded={!!open}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    </button>
  );
}

export default function AdminSidebar({
  current = "admin",
  open = false,
  onClose,
  onNavigate,
  me,
  logout,
  badges = {},
}) {
  const adminName =
    me?.full_name || me?.name || me?.username || me?.email || "Administrator";
  const adminEmail = me?.email || "Admin Account";
  const initials = String(adminName).trim().charAt(0).toUpperCase() || "A";

  /* Escape closes the drawer, page scroll is locked while it is open */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const choose = (key) => {
    onClose?.();
    onNavigate?.(key);
  };

  return (
    <>
      <style>{CSS}</style>

      <div
        className={"as-overlay" + (open ? " open" : "")}
        onClick={() => onClose?.()}
        aria-hidden="true"
      />

      <aside className={"as-side" + (open ? " open" : "")} aria-label="Admin navigation">
        <div className="as-top">
          <div className="as-brand">
            <div className="as-brand-icon">C</div>
            <div>
              <h2>Trading Admin</h2>
              <p>Management Dashboard</p>
            </div>
          </div>
          <button type="button" className="as-close" onClick={() => onClose?.()} aria-label="Close menu">
            ✕
          </button>
        </div>

        <div className="as-scroll">
          <div className="as-label">Menu</div>
          <nav>
            {ADMIN_LINKS.map((link) => {
              const badge = Number(badges[link.key] || 0);
              return (
                <button
                  key={link.key}
                  type="button"
                  className={"as-item" + (link.key === current ? " on" : "")}
                  onClick={() => choose(link.key)}
                >
                  <span className="as-ic"><Ic d={link.icon} s={17} /></span>
                  <span className="as-tx">{link.label}</span>
                  {badge > 0 && <span className="as-badge">{badge}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="as-foot">
          <div className="as-user">
            <div className="as-avatar">{initials}</div>
            <div className="as-info">
              <b>{adminName}</b>
              <small>{adminEmail}</small>
            </div>
          </div>
          <button type="button" className="as-logout" onClick={() => logout?.()}>
            <Ic d={ICON.lock} s={15} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
 
