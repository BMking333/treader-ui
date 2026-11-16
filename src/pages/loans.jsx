import React, { useEffect, useState } from "react";
import { useT, api } from "./Home";
import { TopBar, Picker, useToast, SUB_CSS, num, goBack } from "./subpage";

/* =====================================================================
   src/pages/loans.jsx — Boost Loan (Loan Orders / Loan Products / Apply for Loan)   URL: /loans
   Props: W (wallet), go
   ===================================================================== */

/* ====== backend অনুযায়ী বদলান ====== */
const PRODUCTS_PATH = "/loans/products"; /* GET  -> [{id,name,institution,min_amount,max_amount,daily_rate,days}] */
const ORDERS_PATH = "/loans/orders"; /* GET  -> [{id,order_no,name,amount,total_interest,repay_date,total,status,paid}] */
const APPLY_PATH = "/loans/apply"; /* POST {product_id, amount, id_front, id_back, id_hold}  (ছবি = base64 data URL) */
const CANCEL_PATH = "/loans/cancel"; /* POST {id} */

/* API না থাকলে/ফাঁকা এলে ডিফল্ট প্রোডাক্ট */
const DEFAULT_PRODUCTS = [
  { id: 1, name: "Nexo crypto lending institution", inst: "Banco Santander branches", min: 6000, max: 10000, rate: 1, days: 15 },
  { id: 2, name: "Nexo crypto lending institution", inst: "Banco Santander branches", min: 20000, max: 50000, rate: 0.5, days: 30 },
  { id: 3, name: "Nexo crypto lending institution", inst: "Banco Santander branches", min: 50000, max: 500000, rate: 0.45, days: 30 },
];

const normProduct = (x, i) => ({
  id: x.id ?? i + 1,
  name: x.name || x.title || "Nexo crypto lending institution",
  inst: x.institution || x.bank || x.lender || "Banco Santander branches",
  min: num(x.min_amount ?? x.min),
  max: num(x.max_amount ?? x.max),
  rate: num(x.daily_rate ?? x.rate),
  days: num(x.days ?? x.period),
});

const normOrder = (x) => {
  const amount = num(x.amount);
  const rate = num(x.daily_rate ?? x.rate);
  const days = num(x.days ?? x.period);
  const interest = x.total_interest != null || x.interest != null ? num(x.total_interest ?? x.interest) : (amount * rate * days) / 100;
  const status = String(x.status || "applying").toLowerCase();
  return {
    id: x.id,
    name: x.name || x.title || "Nexo crypto lending institution",
    no: x.order_no || x.order_number || x.no || x.id,
    amount,
    interest,
    date: x.repay_date || x.repayment_date || x.repay_at || "",
    total: x.total != null ? num(x.total) : amount + interest,
    status,
    paid: x.paid != null ? !!x.paid : status === "repaid",
  };
};

const STATUS = {
  applying: { label: "Applying", color: "#00a97a" },
  approved: { label: "Approved", color: "#1a82d6" },
  repaid: { label: "Repaid", color: "#8a94a6" },
  rejected: { label: "Rejected", color: "#d84d5a" },
  cancelled: { label: "Cancelled", color: "#8a94a6" },
};
const FILTERS = [
  { value: "all", label: "All" },
  { value: "applying", label: "Applying" },
  { value: "approved", label: "Approved" },
  { value: "repaid", label: "Repaid" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const f2 = (n) => num(n).toFixed(2);
const stepFor = (min) => Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(1, min)))));

/* ছবি ছোট করে base64 JPEG বানায় */
const readImg = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(new Error("read"));
    r.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error("img"));
      img.onload = () => {
        const k = Math.min(1, 1280 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.8));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });

const CSS = `
.cx-sp{
  --l-card:#ffffff;--l-tx:#141b29;--l-mu:#8793a8;--l-ln:#e8ecf3;--l-ac:#1a82d6;--l-ac2:#4aa8ff;--l-gr:#00a97a;--l-rd:#d84d5a;--l-soft:#f1f5fb;
  --l-sh:0 10px 28px -18px rgba(20,40,80,.38),0 1px 0 rgba(255,255,255,.6) inset;
}
.cx.dark .cx-sp{--l-card:#14233b;--l-tx:#eaf0f8;--l-mu:#8795ac;--l-ln:#22324f;--l-soft:#0f1c31;--l-sh:none}

/* ---- tabs (pill) ---- */
.cx-sp .cx-ln-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:12px 14px 0;padding:4px;border-radius:14px;background:var(--l-soft);border:1px solid var(--l-ln)}
.cx-sp .cx-ln-tabs button{height:38px;border-radius:11px;text-align:center;font-size:13.5px;font-weight:500;color:var(--l-mu);transition:all .2s ease}
.cx-sp .cx-ln-tabs button.on{background:var(--l-card);color:var(--l-tx);font-weight:600;box-shadow:0 4px 12px -6px rgba(20,40,80,.35)}

.cx-ln-body{padding:12px 14px 0}

/* ---- filter select ---- */
.cx-sp .cx-ln-sel{display:flex;align-items:center;justify-content:space-between;width:100%;height:44px;padding:0 26px 0 14px;margin-bottom:12px;border-radius:12px;background:var(--l-card);border:1px solid var(--l-ln);font-size:13.5px;font-weight:500;color:var(--l-tx);box-shadow:var(--l-sh)}

/* ---- cards ---- */
.cx-ln-card{position:relative;overflow:hidden;background:var(--l-card);border:1px solid var(--l-ln);border-radius:16px;padding:14px 16px 14px;margin-bottom:12px;box-shadow:var(--l-sh);color:var(--l-tx);font-size:13px}
.cx-ln-card::before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,var(--l-ac2),var(--l-ac))}
.cx-ln-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:10px;margin-bottom:4px;border-bottom:1px dashed var(--l-ln)}
.cx-ln-head b{min-width:0;font-size:14px;font-weight:700;letter-spacing:-.1px;line-height:1.3;word-break:break-word}
.cx-ln-pill{flex:none;padding:4px 10px;border-radius:20px;font-size:11.5px;font-weight:600;white-space:nowrap}
.cx-ln-card .r{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:6px 0;font-size:12.5px;line-height:1.35}
.cx-ln-card .r span{color:var(--l-mu);flex:none}
.cx-ln-card .r b{font-weight:600;text-align:end;word-break:break-word;font-variant-numeric:tabular-nums}
.cx-ln-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:6px;padding:10px 12px;border-radius:12px;background:var(--l-soft)}
.cx-ln-foot .tot{font-size:12.5px;color:var(--l-mu);line-height:1.35}
.cx-ln-foot .tot b{display:block;margin-top:2px;font-size:15px;font-weight:700;font-variant-numeric:tabular-nums}
.cx-ln-foot .tot b em{font-style:normal;font-size:11px;font-weight:500;margin-inline-start:4px}
.cx-sp .cx-ln-foot button{padding:7px 16px;border-radius:20px;border:1px solid var(--l-ac);color:var(--l-ac);font-size:12.5px;font-weight:600}
.cx-sp .cx-ln-foot button:active{background:var(--l-ac);color:#fff}
.cx-ln-end{padding:14px 0 26px;text-align:center;color:var(--l-mu);font-size:12px}
.cx-ln-none{padding:36px 0;text-align:center;color:var(--l-mu);font-size:13px}

/* ---- product card ---- */
.cx-ln-prod .rate{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:2px 0 8px}
.cx-ln-prod .rate div{font-size:11.5px;color:var(--l-mu)}
.cx-ln-prod .rate div b{display:block;margin-top:2px;font-size:22px;font-weight:700;letter-spacing:-.3px;color:var(--l-gr);font-variant-numeric:tabular-nums}
.cx-ln-prod .rate .chip{padding:5px 12px;border-radius:20px;background:var(--l-soft);color:var(--l-ac);font-size:12px;font-weight:600}
.cx-sp .cx-ln-prod .go{width:100%;height:42px;margin-top:10px;border-radius:12px;background:linear-gradient(135deg,var(--l-ac2),var(--l-ac));color:#fff;font-size:14px;font-weight:600;text-align:center;box-shadow:0 8px 18px -10px var(--l-ac)}
.cx-sp .cx-ln-prod .go:active{transform:scale(.98)}

/* ---- apply page ---- */
.cx-lp-h{display:flex;align-items:center;gap:12px;margin:12px 14px;padding:14px 16px;border-radius:16px;background:var(--l-card);border:1px solid var(--l-ln);box-shadow:var(--l-sh);color:var(--l-tx);font-size:15px;font-weight:700;line-height:1.3}
.cx-lp-h svg{flex:none}
.cx-lp-c{margin:0 14px 12px;border-radius:16px;background:var(--l-card);border:1px solid var(--l-ln);box-shadow:var(--l-sh);padding:8px 16px 16px;color:var(--l-tx)}
.cx-lp-c .r{display:flex;justify-content:space-between;gap:12px;padding:10px 0;font-size:13px;line-height:1.35;border-bottom:1px dashed var(--l-ln)}
.cx-lp-c .r span{color:var(--l-mu)}
.cx-lp-c .r b{font-weight:600;text-align:end;font-variant-numeric:tabular-nums}
.cx-lp-m{display:flex;justify-content:space-between;align-items:center;padding:10px 0;font-size:13px}
.cx-lp-m span:first-child{color:var(--l-mu)}
.cx-lp-m span:last-child{font-weight:600}
.cx-lp-a{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px;padding:12px;border-radius:14px;background:var(--l-soft);font-size:13px}
.cx-lp-a>span{color:var(--l-mu);line-height:1.3}
.cx-lp-a .ctl{display:flex;align-items:center;gap:6px}
.cx-sp .cx-lp-a .circ{width:34px;height:34px;border-radius:50%;border:1px solid var(--l-ln);background:var(--l-card);color:var(--l-tx);display:grid;place-items:center;font-size:20px;line-height:1;padding:0 0 2px}
.cx-sp .cx-lp-a .circ:active{background:var(--l-ac);color:#fff}
.cx-sp .cx-lp-a .circ:disabled{opacity:.4}
.cx-lp-a input{width:84px;height:34px;border:0;border-bottom:1.5px solid var(--l-ac);outline:0;text-align:center;font-size:15px;font-weight:600;background:transparent;color:var(--l-tx)}
.cx-lp-t{margin:0 14px 12px;border-radius:16px;background:var(--l-card);border:1px solid var(--l-ln);box-shadow:var(--l-sh);padding:16px 14px;color:var(--l-tx)}
.cx-lp-t>p{margin:0 0 14px;font-size:13px;font-weight:600;line-height:1.35}
.cx-lp-ups{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.cx-lp-up{text-align:center;font-size:11.5px;line-height:1.25;color:var(--l-mu);word-break:break-word}
.cx-lp-up label{display:grid;place-items:center;width:100%;aspect-ratio:1/1;margin:0 auto 8px;border-radius:14px;border:1.5px dashed var(--l-ac);background:var(--l-soft) center/cover no-repeat;cursor:pointer;color:var(--l-ac)}
.cx-lp-up input{display:none}
.cx-lp-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;z-index:60;display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--l-card);color:var(--l-tx);padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--l-ln);box-shadow:0 -10px 24px -18px rgba(20,40,80,.4)}
.cx-lp-bar .am{font-size:12.5px;color:var(--l-mu);line-height:1.2}
.cx-lp-bar .am b{display:block;margin-top:2px;font-weight:700;color:var(--l-rd);font-size:20px;font-variant-numeric:tabular-nums}
.cx-sp .cx-lp-bar .ap{height:46px;padding:0 30px;border-radius:12px;background:linear-gradient(135deg,#ee6a75,var(--l-rd));color:#fff;font-size:14.5px;font-weight:600;text-align:center;box-shadow:0 8px 18px -10px var(--l-rd)}
.cx-sp .cx-lp-bar .ap:disabled{opacity:.6}
@media(min-width:768px){.cx-lp-bar{max-width:900px}}
@media(max-width:360px){.cx-ln-card .r,.cx-lp-c .r{font-size:12px}.cx-sp .cx-lp-bar .ap{padding:0 20px}}
`;

export default function Loans({ W, go }) {
  const t = useT();
  const tt = (k, fb) => {
    let v;
    try { v = t(k); } catch (_) { v = k; }
    return v && v !== k ? v : fb;
  };

  const [tab, setTab] = useState("orders"); /* orders | products */
  const [filter, setFilter] = useState("all");
  const [pk, setPk] = useState(false);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [orders, setOrders] = useState([]);
  const [sel, setSel] = useState(null); /* apply পেজের প্রোডাক্ট */
  const [amount, setAmount] = useState(0);
  const [imgs, setImgs] = useState({ front: "", back: "", hold: "" });
  const [busy, setBusy] = useState(false);
  const [toast, flash] = useToast();

  const loadOrders = async () => {
    if (W && W.guest) return;
    try {
      const j = await api(ORDERS_PATH);
      const arr = Array.isArray(j) ? j : j && Array.isArray(j.orders) ? j.orders : [];
      setOrders(arr.map(normOrder));
    } catch (_) {}
  };

  useEffect(() => {
    (async () => {
      try {
        const j = await api(PRODUCTS_PATH);
        const arr = Array.isArray(j) ? j : j && Array.isArray(j.products) ? j.products : [];
        if (arr.length) setProducts(arr.map(normProduct));
      } catch (_) {}
    })();
    loadOrders();
  }, []); // eslint-disable-line

  const openApply = (p) => {
    if (W && W.guest) return W.needLogin();
    setSel(p);
    setAmount(p.min);
    setImgs({ front: "", back: "", hold: "" });
  };

  const cancelOrder = async (o) => {
    if (busy) return;
    setBusy(true);
    try {
      await api(CANCEL_PATH, { method: "POST", body: { id: o.id } });
      flash(tt("cancelOk", "Cancelled"), "ok");
      await loadOrders();
    } catch (e) {
      flash((e && e.message) || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const pickImg = async (key, file) => {
    if (!file) return;
    try {
      const d = await readImg(file);
      setImgs((o) => ({ ...o, [key]: d }));
    } catch (_) {
      flash(tt("imgErr", "Could not read the image"));
    }
  };

  const submit = async () => {
    if (busy || !sel) return;
    if (W && W.guest) return W.needLogin();
    if (!(amount >= sel.min && amount <= sel.max)) return flash(tt("loanRange", "Amount must be") + " " + f2(sel.min) + " - " + f2(sel.max));
    if (!imgs.front || !imgs.back || !imgs.hold) return flash(tt("needImgs", "Please upload all 3 ID images"));
    setBusy(true);
    try {
      await api(APPLY_PATH, { method: "POST", body: { product_id: sel.id, amount, id_front: imgs.front, id_back: imgs.back, id_hold: imgs.hold } });
      flash(tt("applyOk", "Application submitted"), "ok");
      setSel(null);
      setTab("orders");
      await loadOrders();
    } catch (e) {
      flash((e && e.message) || "Failed");
    } finally {
      setBusy(false);
    }
  };

  /* ===================== Apply for Loan ===================== */
  if (sel) {
    const step = stepFor(sel.min);
    const dec = () => setAmount((a) => Math.max(sel.min, a - step));
    const inc = () => setAmount((a) => Math.min(sel.max, a + step));
    const slots = [["front", tt("upFront", "Upload ID front")], ["back", tt("upBack", "Upload ID back")], ["hold", tt("upHold", "Upload ID with holder")]];
    return (
      <div className="cx-sp" style={{ paddingBottom: 90 }}>
        <style>{SUB_CSS + CSS}</style>
        <TopBar title={tt("applyLoan", "Apply for Loan")} onBack={() => setSel(null)} />

        <div className="cx-lp-h">
          <svg width="34" height="34" viewBox="0 0 24 24">
            <path d="M12 2l9 4.5-9 4.5-9-4.5z" fill="#2f6df6" />
            <path d="M3 11l9 4.5 9-4.5" fill="none" stroke="#2f6df6" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M3 15.5L12 20l9-4.5" fill="none" stroke="#2f6df6" strokeWidth="2.2" strokeLinejoin="round" />
          </svg>
          <span>{sel.name}</span>
        </div>

        <div className="cx-lp-c">
          <div className="r"><span>{tt("lendInst", "Lending Institution")}</span><b>{sel.inst}</b></div>
          <div className="r"><span>{tt("dailyRate", "Daily Interest Rate")}</span><b>{sel.rate.toFixed(4)} %</b></div>
          <div className="r"><span>{tt("period", "Repayment Period")}</span><b>{sel.days} {tt("day", "Day")}</b></div>
          <div className="r"><span>{tt("amount", "Amount")}</span><b>{f2(sel.min)} - {f2(sel.max)}</b></div>
          <div className="cx-lp-m"><span>{tt("repayMethod", "Repayment Method")}</span><span>{tt("oneTime", "One-time")}</span></div>
          <div className="cx-lp-a">
            <span>{tt("expAmount", "Expected Loan Amount")}</span>
            <div className="ctl">
              <button type="button" className="circ" onClick={dec} disabled={amount <= sel.min} aria-label="minus">−</button>
              <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(num(e.target.value))} onBlur={() => setAmount((a) => Math.min(sel.max, Math.max(sel.min, a)))} />
              <button type="button" className="circ" onClick={inc} disabled={amount >= sel.max} aria-label="plus">+</button>
            </div>
          </div>
        </div>

        <div className="cx-lp-t">
          <p>{tt("creditLend", "Credit lending (ensure images are clear)")}</p>
          <div className="cx-lp-ups">
            {slots.map(([k, label]) => (
              <div key={k} className="cx-lp-up">
                <label style={imgs[k] ? { backgroundImage: `url(${imgs[k]})`, borderStyle: "solid" } : undefined}>
                  <input type="file" accept="image/*" onChange={(e) => { pickImg(k, e.target.files && e.target.files[0]); e.target.value = ""; }} />
                  {!imgs[k] && (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 3L7.2 5H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.2L15 3H9zm3 6a4.5 4.5 0 110 9 4.5 4.5 0 010-9zm0 2a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" />
                    </svg>
                  )}
                </label>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="cx-lp-bar">
          <span className="am">{tt("amount", "Amount")}<b>{f2(amount)}</b></span>
          <button type="button" className="ap" disabled={busy} onClick={submit}>{tt("applyLoan", "Apply for Loan")}</button>
        </div>

        {toast}
      </div>
    );
  }

  /* ===================== Orders / Products ===================== */
  const shown = orders.filter((o) => filter === "all" || o.status === filter);
  const fLabel = (FILTERS.find((f) => f.value === filter) || FILTERS[0]).label;

  return (
    <div className="cx-sp">
      <style>{SUB_CSS + CSS}</style>
      <TopBar title={tt("boostLoan", "Boost Loan")} onBack={() => goBack(go, "home")} />

      <div className="cx-ln-tabs">
        <button type="button" className={tab === "orders" ? "on" : ""} onClick={() => setTab("orders")}>{tt("loanOrders", "Loan Orders")}</button>
        <button type="button" className={tab === "products" ? "on" : ""} onClick={() => setTab("products")}>{tt("loanProducts", "Loan Products")}</button>
      </div>

      <div className="cx-ln-body">
        {tab === "orders" && (
          <>
            <button type="button" className="cx-ln-sel" onClick={() => setPk(true)}>
              <span>{tt("f_" + filter, fLabel)}</span><i className="cx-sp-chev" />
            </button>

            {shown.map((o) => {
              const st = STATUS[o.status] || { label: o.status, color: "#8a94a6" };
              const showPaid = o.status === "applying" || o.status === "approved" || o.status === "repaid";
              return (
                <div key={o.id} className="cx-ln-card">
                  <div className="cx-ln-head">
                    <b>{o.name}</b>
                    <span className="cx-ln-pill" style={{ color: st.color, background: st.color + "1f" }}>{tt("st_" + o.status, st.label)}</span>
                  </div>
                  <div className="r"><span>{tt("orderNo", "Order No.")}</span><b>{o.no}</b></div>
                  <div className="r"><span>{tt("amount", "Amount")}</span><b>{f2(o.amount)}</b></div>
                  <div className="r"><span>{tt("totInterest", "Total Interest")}</span><b>{f2(o.interest)}</b></div>
                  <div className="r"><span>{tt("repayDate", "Repayment Date")}</span><b>{o.date || "--"}</b></div>
                  <div className="cx-ln-foot">
                    <span className="tot">
                      {tt("total", "Total")}
                      <b style={{ color: o.paid ? "#00a97a" : "#d84d5a" }}>
                        {f2(o.total)}
                        {showPaid && <em>{o.paid ? tt("paidBack", "Paid back") : tt("notPaid", "Not paid back")}</em>}
                      </b>
                    </span>
                    {o.status === "applying" && <button type="button" onClick={() => cancelOrder(o)}>{tt("cancel", "Cancel")}</button>}
                  </div>
                </div>
              );
            })}
            {shown.length === 0 && <div className="cx-ln-card"><div className="cx-ln-none">{tt("norec", "No records")}</div></div>}
            <div className="cx-ln-end">{tt("allRecords", "All records")}</div>
          </>
        )}

        {tab === "products" && products.map((p) => (
          <div key={p.id} className="cx-ln-card cx-ln-prod">
            <div className="cx-ln-head"><b>{p.name}</b></div>
            <div className="rate">
              <div>{tt("dailyRate", "Daily Interest Rate")}<b>{p.rate.toFixed(4)} %</b></div>
              <span className="chip">{p.days} {tt("day", "Day")}</span>
            </div>
            <div className="r"><span>{tt("lendInst", "Lending Institution")}</span><b>{p.inst}</b></div>
            <div className="r"><span>{tt("amount", "Amount")}</span><b>{f2(p.min)} - {f2(p.max)}</b></div>
            <div className="r"><span>{tt("period", "Repayment Period")}</span><b>{p.days} {tt("day", "Day")}</b></div>
            <button type="button" className="go" onClick={() => openApply(p)}>{tt("applyLoan", "Apply for Loan")}</button>
          </div>
        ))}
      </div>

      {toast}

      <Picker open={pk} options={FILTERS} value={filter} onCancel={() => setPk(false)} onConfirm={(v) => { setFilter(v); setPk(false); }} />
    </div>
  );
}
