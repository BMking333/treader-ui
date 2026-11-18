import React, { useEffect, useState } from "react";
import { useT, api } from "./Home";

const kind = (s) => {
  const v = String(s ?? "").trim();
  if (!v || /^(none|unverified|not|null|0)/i.test(v)) return "none";
  if (/reject|fail|den|refus/i.test(v)) return "bad";
  if (/approv|verif|success|pass|done|certif/i.test(v)) return "ok";
  if (/pend|review|wait|submit|process/i.test(v)) return "wait";
  return "none";
};

const PATHS = {
  idcard: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16c.5-1.4 1.6-2 3-2s2.5.6 3 2" />
      <path d="M15 10h3M15 13.5h3" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6 7-11.5a7 7 0 0 0-14 0C5 15 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z" />
      <path d="M10 21h4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.5" r="1" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
};

const Icon = ({ name, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {PATHS[name]}
  </svg>
);

const CSS = `
.cx-md .cx-mp{padding:20px 20px 16px;border-bottom:1px solid rgba(128,128,128,.18);margin-bottom:4px}
.cx-md .cx-mp p{margin:0 0 4px;font-size:12.5px;line-height:1.45;opacity:.75;word-break:break-all}
.cx-md .cx-mp p:first-child{font-size:14.5px;font-weight:600;opacity:1}
.cx-md .cx-mp .cx-a1{font-size:13px;padding:10px 0;border-radius:10px;font-weight:600}
.cx-md .cx-mr{display:flex;align-items:center;gap:12px;width:100%;padding:11px 18px;min-height:50px;
  font-size:13.5px;font-weight:500;background:none;border:0;border-bottom:1px solid rgba(128,128,128,.1);
  color:inherit;text-align:left;transition:background .15s;cursor:pointer}
.cx-md .cx-mr:active{background:rgba(128,128,128,.12)}
.cx-md .cx-mi2{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;
  background:rgba(128,128,128,.14);color:inherit;flex:none}
.cx-md .cx-ml{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-md .cx-mv{font-size:12px;font-weight:500;opacity:.95;white-space:nowrap}
.cx-md .cx-mv.red{color:#f0616d}
.cx-md .cx-mv.green{color:#2fd39b}
.cx-md .cx-ar2{font-size:18px;opacity:.4;line-height:1}
.cx-md .cx-tg{position:relative;width:42px;height:24px;border-radius:24px;flex:none;
  background:rgba(128,128,128,.4);transition:background .25s ease}
.cx-md .cx-tg i{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;
  box-shadow:0 1px 3px rgba(0,0,0,.35);transition:transform .25s ease}
.cx-md .cx-tg.on{background:#2fd39b}
.cx-md .cx-tg.on i{transform:translateX(18px)}

/* Logout – neutral/danger style (no blue) */
.cx-md .cx-lo2{display:flex;align-items:center;justify-content:center;gap:8px;
  margin:18px 20px;width:calc(100% - 40px);padding:12px 0;font-size:14px;font-weight:600;
  color:#f0616d;background:rgba(240,97,109,.10);border:1px solid rgba(240,97,109,.35);
  border-radius:10px;cursor:pointer;transition:background .15s,transform .15s}
.cx-md .cx-lo2:hover{background:rgba(240,97,109,.16)}
.cx-md .cx-lo2:active{transform:scale(.98);background:rgba(240,97,109,.22)}

/* Email verify badge + resend */
.cx-md .cx-em{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px}
.cx-md .cx-bdg{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;
  font-size:11.5px;font-weight:600;line-height:1.4;white-space:nowrap}
.cx-md .cx-bdg.ok{background:rgba(47,211,155,.14);color:#2fd39b}
.cx-md .cx-bdg.bad{background:rgba(240,97,109,.12);color:#f0616d}
.cx-md .cx-rv{display:block;width:100%;margin-top:10px;padding:10px 0;font-size:13px;font-weight:600;
  text-align:center;color:#2a8fe0;background:rgba(42,143,224,.10);border:1px solid rgba(42,143,224,.35);
  border-radius:10px;cursor:pointer;transition:background .15s,transform .15s}
.cx-md .cx-rv:hover{background:rgba(42,143,224,.16)}
.cx-md .cx-rv:active{transform:scale(.98)}
.cx-md .cx-rv:disabled{opacity:.55;cursor:not-allowed;transform:none}
`;

export default function SideMenu({ open, onClose, me, logout, dark, setDark, go, notify, guest, askLogin }) {
  const t = useT();

  const tx = (key, fb) => {
    const v = t(key);
    return v && v !== key ? v : fb;
  };

  const [left, setLeft] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (left <= 0) return undefined;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const showMailState =
    !!me && /@/.test(String(me.email || "")) && typeof me.email_verified === "boolean";
  const mailVerified = showMailState && me.email_verified === true;

  const resendVerify = async () => {
    if (!me || sending || left > 0) return;
    setSending(true);
    try {
      await api("/auth/resend-confirm", {
        method: "POST",
        body: { email: me.email },
      });
      notify(tx("resendOk", "Verification email sent"));
      setLeft(60);
    } catch (e) {
      notify(tx((e && e.message) || "err", "Something went wrong. Please try again."));
    }
    setSending(false);
  };

  const origin = () => (typeof window !== "undefined" ? window.location.origin : "");

  const share = async () => {
    if (!me) {
      onClose();
      return askLogin("login", "needLogin");
    }
    let link = origin() + "/?ref=" + me.uid;
    try {
      const j = await api("/user/share-link");
      const p = typeof j === "string" ? j : j && j.path;
      if (p) link = p.startsWith("/") ? origin() + p : p;
    } catch {}
    try {
      navigator.clipboard && navigator.clipboard.writeText(link).catch(() => {});
    } catch {}
    notify(t("copied"));
  };

  const goChangePassword = () => {
    onClose();
    if (!me) return askLogin("login", "needLogin");
    go("change-password");
  };

  const k = kind(me && me.verify_status);
  const authLabel =
    k === "wait" ? t("wait") : k === "ok" ? t("verified") : k === "bad" ? t("rejected") : t("notset");
  const authTone = k === "ok" ? "green" : "red";
  const authLocked = k === "wait" || k === "ok";
  const authFn = authLocked
    ? null
    : () => {
        onClose();
        go("auth");
      };

  const rows = [
    ["idcard", t("auth"), authLabel, authTone, authFn],
    ["pin", t("bind"), "", "", () => { onClose(); go("withdraw"); }],
    ["share", t("share"), "", "", share],
    ["bell", t("smsg"), "", "", () => notify(t("nomsg"))],
    ["moon", t("night"), "switch", "", () => setDark(!dark)],
    ["lock", tx("chpwd", "Change password"), "", "", goChangePassword],
    ["globe", t("web"), "", "", () => { onClose(); go("introduction"); }],
  ];

  return (
    <div className={"cx-mo" + (open ? " open" : "")} onClick={onClose}>
      <style>{CSS}</style>
      <aside className="cx-md" onClick={(e) => e.stopPropagation()}>
        {me ? (
          <div className="cx-mp">
            <p>{me.email}</p>
            <p>UID: {me.uid}</p>
            <p>VIP: {me.vip ?? 0}</p>
            <p>{t("rep")}: {me.reputation ?? 0}</p>

            {showMailState && (
              <>
                <div className="cx-em">
                  <span className={"cx-bdg " + (mailVerified ? "ok" : "bad")}>
                    {mailVerified
                      ? "✓ " + tx("emVerified", "Email verified")
                      : "! " + tx("emNotVerified", "Email not verified")}
                  </span>
                </div>

                {!mailVerified && (
                  <button
                    type="button"
                    className="cx-rv"
                    onClick={resendVerify}
                    disabled={sending || left > 0}
                  >
                    {left > 0
                      ? tx("resendIn", "Resend in") + " " + left + "s"
                      : tx("resendVerify", "Resend verification email")}
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="cx-mp">
            <button className="cx-a1 flat cx-cap" onClick={() => { onClose(); askLogin("login"); }}>
              {t("login")}
            </button>
            <button className="cx-a1 flat cx-cap" onClick={() => { onClose(); askLogin("register"); }}>
              {t("register")}
            </button>
          </div>
        )}

        {rows.map(([ic, label, val, tone, fn]) => {
          const locked = !fn;
          const isSwitch = val === "switch";
          return (
            <button
              key={ic}
              className="cx-mr"
              onClick={fn || undefined}
              style={locked ? { cursor: "default" } : undefined}
              tabIndex={locked ? -1 : undefined}
              aria-disabled={locked || undefined}
              role={isSwitch ? "switch" : undefined}
              aria-checked={isSwitch ? !!dark : undefined}
            >
              <span className="cx-mi2"><Icon name={ic} /></span>
              <span className="cx-ml">{label}</span>
              {isSwitch ? (
                <span className={"cx-tg" + (dark ? " on" : "")}><i /></span>
              ) : (
                <>
                  {val && <span className={"cx-mv " + tone}>{val}</span>}
                  {!locked && <span className="cx-ar2">›</span>}
                </>
              )}
            </button>
          );
        })}

        {me && (
          <button
            className="cx-lo2"
            onClick={() => {
              onClose();
              logout();
            }}
          >
            <Icon name="logout" size={18} />
            {t("logout")}
          </button>
        )}
      </aside>
    </div>
  );
        }
