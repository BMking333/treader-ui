import React, { useEffect, useRef, useState } from "react";
import { useT, Coin } from "./Home";

/* =====================================================================
   src/pages/xui.jsx — Exchange / Transfer পেজের শেয়ার্ড UI
   - XCSS        : লাইট + ডার্ক থিম ভ্যারিয়েবল (.cx.dark ধরে)
   - useToast    : স্ক্রিনের মাঝখানে মেসেজ (ok / error)
   - SheetPicker : নিচের সিলেক্ট শিট — কোনটা সিলেক্টেড তা স্পষ্ট (হাইলাইট + টিক)
   ফাইলটি exchange.jsx ও changemoney.jsx-এর পাশে (src/pages/) রাখুন।
   ===================================================================== */

export const XCSS = `
.cx-sp{
  --x-bg:#eef2f7;--x-tx:#142033;--x-mu:#76839a;--x-ln:#e3e8f0;--x-ln2:#d2dae6;
  --x-card:#ffffff;--x-fld:#f6f8fb;--x-chip:#f1f4f9;--x-sh:0 12px 30px -18px rgba(20,40,80,.38);
  --x-ac:#1a82d6;--x-up:#00a874;--x-sheet:#ffffff;--x-dim:rgba(10,18,32,.5);
  --x-sel:rgba(26,130,214,.10);--x-dis:#dde4ee;--x-distx:#8b98ac;
  --x-rcv:rgba(26,130,214,.07);--x-rcvln:rgba(26,130,214,.24);
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Noto Sans","Noto Sans Bengali",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
  background:var(--x-bg);color:var(--x-tx);min-height:100vh;
}
.cx.dark .cx-sp{
  --x-bg:#0b1424;--x-tx:#e9eef6;--x-mu:#8a97ad;--x-ln:rgba(255,255,255,.08);--x-ln2:rgba(255,255,255,.15);
  --x-card:#101e34;--x-fld:rgba(255,255,255,.03);--x-chip:rgba(255,255,255,.045);--x-sh:0 12px 30px -16px rgba(0,0,0,.65);
  --x-up:#00c087;--x-sheet:#101e34;--x-dim:rgba(2,6,12,.72);
  --x-sel:rgba(26,130,214,.24);--x-dis:#1a2940;--x-distx:#5f6e86;
  --x-rcv:rgba(26,130,214,.12);--x-rcvln:rgba(26,130,214,.28);
}
.cx-sp button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}

/* ---- মাঝখানের মেসেজ ---- */
.xt-wrap{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:0 24px;pointer-events:none}
.xt{display:flex;align-items:center;gap:10px;max-width:min(86vw,320px);padding:13px 18px;border-radius:16px;
  background:rgba(16,24,40,.95);color:#fff;font-size:13.5px;line-height:1.4;font-weight:500;text-align:start;
  box-shadow:0 18px 48px -14px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.08);
  animation:xtpop .22s cubic-bezier(.2,.9,.3,1.2)}
.xt i{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:13px;font-weight:700}
.xt.ok i{background:#00c087}
.xt.err i{background:#e0485c}
@keyframes xtpop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}

/* ---- সিলেক্ট শিট ---- */
.xp-ov{position:fixed;inset:0;z-index:1500;background:var(--x-dim);display:flex;align-items:flex-end;animation:xpf .18s ease}
.xp{width:100%;max-height:72vh;display:flex;flex-direction:column;background:var(--x-sheet);color:var(--x-tx);
  border-radius:20px 20px 0 0;box-shadow:0 -14px 44px -18px rgba(0,0,0,.5);
  padding-bottom:max(10px,env(safe-area-inset-bottom));animation:xpu .26s cubic-bezier(.2,.8,.2,1)}
.xp-grab{width:38px;height:4px;border-radius:4px;background:var(--x-ln2);margin:8px auto 0}
.xp-h{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:10px 18px 12px;border-bottom:1px solid var(--x-ln)}
.xp-h b{font-size:14px;font-weight:600}
.xp-h button{background:none;border:0;padding:6px 0;font-size:14px;color:var(--x-mu)}
.xp-h button:first-child{justify-self:start}
.xp-h button.ok{justify-self:end;color:var(--x-ac);font-weight:600}
.xp-l{position:relative;overflow-y:auto;padding:8px 14px 6px;-webkit-overflow-scrolling:touch}
.xp-r{display:flex;align-items:center;gap:12px;width:100%;height:52px;padding:0 14px;margin:2px 0;border:1px solid transparent;border-radius:12px;
  background:none;color:var(--x-tx);font-size:15px;font-weight:500;text-align:start;transition:background .15s ease,border-color .15s ease}
.xp-r:active{background:var(--x-chip)}
.xp-r span{flex:1}
.xp-r.on{background:var(--x-sel);border-color:var(--x-ac);color:var(--x-ac);font-weight:700}
.xp-r svg{flex:none;width:20px;height:20px}
.xp-r .xp-dot{flex:none;width:20px;height:20px;border-radius:50%;border:1.5px solid var(--x-ln2)}
@keyframes xpf{from{opacity:0}to{opacity:1}}
@keyframes xpu{from{transform:translateY(40px);opacity:.6}to{transform:none;opacity:1}}
@media(prefers-reduced-motion:reduce){.xt,.xp,.xp-ov{animation:none!important}}
`;

/* ---- স্ক্রিনের মাঝখানে টোস্ট: const [toast, flash] = useToast(); flash("msg", "ok") ---- */
export function useToast() {
  const [s, setS] = useState(null);
  const tm = useRef(null);
  useEffect(() => () => clearTimeout(tm.current), []);
  const flash = (msg, kind) => {
    clearTimeout(tm.current);
    setS({ msg: String(msg), ok: kind === "ok", id: Date.now() });
    tm.current = setTimeout(() => setS(null), 2400);
  };
  const node = s ? (
    <div className="xt-wrap" key={s.id} role="status" aria-live="polite">
      <div className={"xt " + (s.ok ? "ok" : "err")}><i>{s.ok ? "✓" : "!"}</i><span>{s.msg}</span></div>
    </div>
  ) : null;
  return [node, flash];
}

/* ---- নিচের সিলেক্ট শিট (Cancel / Confirm) ----
   options: [{ value, label, coin? }]  — coin:true হলে কয়েন আইকন দেখায় */
export function SheetPicker({ open, title, options, value, onCancel, onConfirm }) {
  const t = useT();
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };
  const [tmp, setTmp] = useState(value);
  const box = useRef(null);

  useEffect(() => { if (open) setTmp(value); }, [open, value]);

  /* খুললে সিলেক্টেড সারি মাঝখানে স্ক্রল করে আনে */
  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => {
      const b = box.current, el = b && b.querySelector(".on");
      if (b && el) b.scrollTop = Math.max(0, el.offsetTop - b.clientHeight / 2 + el.clientHeight / 2);
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!open) return null;
  return (
    <div className="xp-ov" onClick={onCancel}>
      <div className="xp" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="xp-grab" />
        <div className="xp-h">
          <button type="button" onClick={onCancel}>{tt("cancel", "Cancel")}</button>
          <b>{title || ""}</b>
          <button type="button" className="ok" onClick={() => onConfirm(tmp)}>{tt("confirm", "Confirm")}</button>
        </div>
        <div className="xp-l" ref={box}>
          {options.map((o) => {
            const on = o.value === tmp;
            return (
              <button key={o.value} type="button" className={"xp-r" + (on ? " on" : "")} onClick={() => setTmp(o.value)} aria-pressed={on}>
                {o.coin && <Coin s={o.value} size={24} />}
                <span>{o.label}</span>
                {on ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" opacity=".16" /><path d="M7.5 12.5l3 3 6-6.5" /></svg>
                ) : <i className="xp-dot" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
