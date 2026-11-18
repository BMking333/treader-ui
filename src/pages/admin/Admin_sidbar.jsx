import React, { useEffect } from "react";
import { Ic, ICON } from "../Home";

/* =========================================================
   src/pages/admin/Admin_sidbar.jsx
   Shared admin sidebar (light theme)
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

/* group = section title in the sidebar */
export const ADMIN_LINKS = [
  { key: "admin", label: "Dashboard", icon: ICON.trade, group: "Overview" },

  { key: "adminUsers", label: "Users", icon: ICON.eye, group: "Management" },
  { key: "adminKyc", label: "KYC", icon: ICON.lock, group: "Management" },

  { key: "adminDeposits", label: "Deposits", icon: ICON.doc, group: "Finance" },
  { key: "adminWithdrawals", label: "Withdrawals", icon: ICON.card, group: "Finance" },
  { key: "adminPaymentMethods", label: "Payment Methods", icon: ICON.card, group: "Finance" },

  { key: "adminOptions", label: "Options", icon: ICON.eye, group: "Trading" },
];

const GROUPS = ADMIN_LINKS.reduce((acc, link) => {
  const last = acc[acc.length - 1];
  if (last && last.name === link.group) last.items.push(link);
  else acc.push({ name: link.group, items: [link] });
  return acc;
}, []);

const CSS = `
.as-side, .as-side *, .as-overlay, .as-menu-btn { box-sizing: border-box; }

.as-side {
  --as-line: #e5e9f0;
  --as-line-soft: #eef1f6;
  --as-text: #0f1b30;
  --as-text-2: #4a5568;
  --as-muted: #7a8699;
  --as-primary: #1f7acb;
  --as-primary-soft: #eaf3fc;

  position: fixed; top: 0; left: 0; bottom: 0; z-index: 60;
  width: ${SIDEBAR_WIDTH}px;
  display: flex; flex-direction: column;
  background: #ffffff;
  color: var(--as-text);
  border-right: 1px solid var(--as-line);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.as-side button { font-family: inherit; cursor: pointer; -webkit-appearance: none; appearance: none; }
.as-side button:focus-visible,
.as-menu-btn:focus-visible { outline: 2px solid var(--as-primary, #1f7acb); outline-offset: 2px; }

/* ---------- brand ---------- */
.as-top {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  min-height: 66px; padding: 12px 18px;
  border-bottom: 1px solid var(--as-line);
}
.as-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.as-brand-icon {
  width: 40px; height: 40px; flex: none; border-radius: 12px;
  background: linear-gradient(135deg, #1fbad0, #2a7de1);
  color: #fff; display: grid; place-items: center;
  font-size: 19px; font-weight: 800;
  box-shadow: 0 6px 16px rgba(40,125,225,.28);
}
.as-brand h2 { margin: 0; font-size: 16px; font-weight: 800; letter-spacing: -.2px; color: var(--as-text); }
.as-brand p { margin: 2px 0 0; font-size: 11.5px; color: var(--as-muted); }
.as-close {
  display: none; width: 36px; height: 36px; flex: none;
  border: 1px solid var(--as-line); border-radius: 10px;
  background: #fff; color: var(--as-text-2);
  font-size: 16px; line-height: 1;
}
.as-close:active { transform: scale(.95); }

/* ---------- menu ---------- */
.as-scroll { flex: 1; overflow-y: auto; padding: 10px 12px 14px; }
.as-scroll::-webkit-scrollbar { width: 6px; }
.as-scroll::-webkit-scrollbar-thumb { background: #d9dfea; border-radius: 6px; }

.as-group { margin-top: 12px; }
.as-group:first-child { margin-top: 4px; }
.as-label {
  padding: 8px 12px 6px; font-size: 11.5px; font-weight: 700;
  letter-spacing: .3px; color: var(--as-muted);
}

.as-item {
  position: relative;
  width: 100%; display: flex; align-items: center; gap: 12px;
  min-height: 46px; padding: 0 12px; margin-bottom: 2px;
  border: 0; border-radius: 12px;
  background: transparent; color: var(--as-text-2);
  font-size: 13.5px; font-weight: 600; text-align: left;
  transition: background .15s, color .15s;
}
.as-item:hover { background: #f4f7fb; color: var(--as-text); }
.as-item:active { transform: scale(.985); }
.as-item.on {
  background: var(--as-primary-soft);
  color: var(--as-primary);
  font-weight: 700;
}
.as-item.on::before {
  content: ""; position: absolute; left: -12px; top: 10px; bottom: 10px;
  width: 4px; border-radius: 0 4px 4px 0; background: var(--as-primary);
}
.as-ic {
  width: 34px; height: 34px; flex: none; border-radius: 10px;
  background: #f1f4f9; color: var(--as-text-2);
  display: grid; place-items: center;
  transition: background .15s, color .15s;
}
.as-item:hover .as-ic { background: #e9eef6; }
.as-item.on .as-ic { background: var(--as-primary); color: #fff; box-shadow: 0 4px 10px rgba(31,122,203,.3); }
.as-tx { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.as-badge {
  flex: none; min-width: 22px; height: 22px; padding: 0 7px;
  border-radius: 999px; background: #fdf3dc; color: #c98a0a;
  font-size: 11.5px; font-weight: 800;
  display: inline-flex; align-items: center; justify-content: center;
  font-variant-numeric: tabular-nums;
}
.as-item.on .as-badge { background: #fff; color: var(--as-primary); }

/* ---------- footer ---------- */
.as-foot { padding: 12px; border-top: 1px solid var(--as-line); background: #fbfcfe; }
.as-user {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; margin-bottom: 10px; min-width: 0;
  border: 1px solid var(--as-line); border-radius: 12px; background: #fff;
}
.as-avatar {
  width: 36px; height: 36px; flex: none; border-radius: 50%;
  background: linear-gradient(135deg, #1fbad0, #2a7de1);
  color: #fff; display: grid; place-items: center;
  font-size: 14px; font-weight: 800;
}
.as-info { min-width: 0; line-height: 1.25; }
.as-info b { display: block; font-size: 12.5px; font-weight: 700; color: var(--as-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.as-info small { display: block; font-size: 11px; color: var(--as-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.as-logout {
  width: 100%; min-height: 42px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid #f4c5cd; border-radius: 11px;
  background: #fff; color: #e0415f;
  font-size: 13px; font-weight: 700;
  transition: background .15s, border-color .15s, transform .1s;
}
.as-logout:hover { background: #fdebee; border-color: #eba9b5; }
.as-logout:active { transform: scale(.98); }

.as-overlay {
  display: none; position: fixed; inset: 0; z-index: 55;
  background: rgba(15,27,48,.35);
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
  .as-side.open { transform: translateX(0); box-shadow: 8px 0 40px rgba(15,27,48,.18); }
  .as-close { display: grid; place-items: center; }
  .as-overlay.open { display: block; }
  .as-menu-btn { display: grid; }
  .as-content { margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .as-side, .as-item, .as-ic { transition: none !important; }
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
          <nav>
            {GROUPS.map((group) => (
              <div className="as-group" key={group.name}>
                <div className="as-label">{group.name}</div>
                {group.items.map((link) => {
                  const badge = Number(badges[link.key] || 0);
                  const active = link.key === current;
                  return (
                    <button
                      key={link.key}
                      type="button"
                      className={"as-item" + (active ? " on" : "")}
                      aria-current={active ? "page" : undefined}
                      onClick={() => choose(link.key)}
                    >
                      <span className="as-ic"><Ic d={link.icon} s={17} /></span>
                      <span className="as-tx">{link.label}</span>
                      {badge > 0 && <span className="as-badge">{badge}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
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
