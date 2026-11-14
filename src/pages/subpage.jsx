import React, { useEffect, useRef, useState } from "react";

/* =====================================================================
   src/pages/subpage.jsx — exchange.jsx / loans.jsx / changemoney.jsx এর শেয়ার্ড UI
   TopBar (← শিরোনাম), Picker (Cancel / Confirm শীট), useToast, SUB_CSS
   ===================================================================== */

export const num = (v) => {
  const n = parseFloat(v);
  return isFinite(n) ? n : 0;
};

export const goBack = (go, fallback = "home") => {
  if (typeof window !== "undefined" && window.history.length > 1) window.history.back();
  else if (typeof go === "function") go(fallback);
};

export const SUB_CSS = `
.cx-sp{background:#e0e1ea;min-height:100vh;color:#111;padding-bottom:24px}
.cx-sp,.cx-sp *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.cx-sp .w{background:#fff}
.cx-sp .cx-sp-top{display:grid;grid-template-columns:56px 1fr 56px;align-items:center;height:56px;background:#fff;border-bottom:1px solid #eef0f3}
.cx-sp .cx-sp-top h1{margin:0;font-size:19px;font-weight:400;text-align:center}
.cx-sp .cx-sp-top button{height:56px;font-size:36px;line-height:1;text-align:center;color:#111;padding-bottom:4px}
.cx[dir=rtl] .cx-sp-top button:first-child{transform:scaleX(-1)}
.cx-sp .cx-sp-btn{display:block;width:100%;height:62px;border:0;border-radius:14px;background:#1a82d6;color:#fff;font-size:19px;text-align:center}
.cx-sp .cx-sp-btn:disabled{opacity:.6}
.cx-sp .cx-sp-lab{font-size:18px}
.cx-sp .cx-sp-inp{display:flex;align-items:center;gap:12px;padding:0 4px 0 46px;border-bottom:1px solid #c9ced6}
.cx-sp .cx-sp-inp input{flex:1;min-width:0;height:64px;border:0;outline:0;background:transparent;font-size:20px;color:inherit}
.cx-sp .cx-sp-inp input::placeholder{color:#b4b9c4}
.cx-sp .cx-sp-inp span{font-size:20px}
.cx-sp .cx-sp-inp i{display:block;width:1px;height:20px;background:#333}
.cx-sp .cx-sp-inp button{font-size:20px;padding:0 6px;color:inherit}
.cx-sp .cx-sp-chev{display:inline-block;width:10px;height:10px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translateY(-3px);margin-inline-start:8px}
.cx-sp .cx-sp-toast{position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:400;max-width:90%;padding:10px 16px;border-radius:8px;font-size:14px;background:#e8f2fc;color:#1a6fb8;box-shadow:0 4px 16px rgba(0,0,0,.2)}
.cx-sp .cx-sp-toast.bad{background:#fdecee;color:#c8323f}
.cx-sp .cx-sp-toast.ok{background:#e3f7ee;color:#0a8a5f}

/* Cancel / Confirm picker */
.cx-sp .cx-sp-ov{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}
.cx-sp .cx-sp-pk{width:100%;max-width:520px;background:#fff;border-radius:22px 22px 0 0;padding-bottom:calc(14px + env(safe-area-inset-bottom,0px));animation:cxsp .18s ease-out}
@keyframes cxsp{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}
.cx-sp .cx-sp-pkh{display:flex;justify-content:space-between;padding:18px 20px 10px;font-size:20px}
.cx-sp .cx-sp-pkh .c{color:#9aa0ad}
.cx-sp .cx-sp-pkh .k{color:#4a5f8a}
.cx-sp .cx-sp-pkl{max-height:48vh;overflow-y:auto;margin:6px 20px 0;border-top:1px solid #e7e9ef}
.cx-sp .cx-sp-pkl button{display:block;width:100%;height:62px;border-bottom:1px solid #e7e9ef;text-align:center;font-size:21px;color:#111}
.cx-sp .cx-sp-pkl button.on{color:#1a82d6;font-weight:600}

@media(min-width:900px){.cx-sp .cx-sp-pk{max-width:560px;border-radius:18px}.cx-sp .cx-sp-ov{align-items:center}}

.cx.dark .cx-sp{background:#0b1424;color:#e8ecf3}
.cx.dark .cx-sp .w,.cx.dark .cx-sp .cx-sp-top,.cx.dark .cx-sp .cx-sp-pk{background:#17263d;border-color:#22304a}
.cx.dark .cx-sp .cx-sp-top button,.cx.dark .cx-sp .cx-sp-pkl button{color:#e8ecf3}
.cx.dark .cx-sp .cx-sp-inp,.cx.dark .cx-sp .cx-sp-pkl,.cx.dark .cx-sp .cx-sp-pkl button{border-color:#2c3b57}
.cx.dark .cx-sp .cx-sp-inp i{background:#9aa6bb}
`;

export function TopBar({ title, onBack }) {
  return (
    <div className="cx-sp-top">
      <button type="button" onClick={onBack} aria-label="back">‹</button>
      <h1>{title}</h1>
      <span />
    </div>
  );
}

export function Picker({ open, options, value, onCancel, onConfirm, cancelText = "Cancel", confirmText = "Confirm" }) {
  const [sel, setSel] = useState(value);
  useEffect(() => { if (open) setSel(value); }, [open, value]);
  if (!open) return null;
  return (
    <div className="cx-sp-ov" onClick={onCancel}>
      <div className="cx-sp-pk" onClick={(e) => e.stopPropagation()}>
        <div className="cx-sp-pkh">
          <button type="button" className="c" onClick={onCancel}>{cancelText}</button>
          <button type="button" className="k" onClick={() => onConfirm(sel)}>{confirmText}</button>
        </div>
        <div className="cx-sp-pkl">
          {options.map((o) => (
            <button key={o.value} type="button" className={sel === o.value ? "on" : ""} onClick={() => setSel(o.value)}>{o.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function useToast() {
  const [m, setM] = useState({ k: "", s: "bad" });
  const tm = useRef(null);
  useEffect(() => () => clearTimeout(tm.current), []);
  const flash = (k, s = "bad") => {
    setM({ k, s });
    clearTimeout(tm.current);
    tm.current = setTimeout(() => setM({ k: "", s: "bad" }), 3000);
  };
  const node = m.k ? <div className={"cx-sp-toast " + m.s}>{m.k}</div> : null;
  return [node, flash];
}
