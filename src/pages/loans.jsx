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

/* API না থাকলে/ফাঁকা এলে স্ক্রিনশটের ডিফল্ট প্রোডাক্ট */
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
  applying: { label: "Applying", color: "#00c087" },
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
.cx-ln-tabs{display:grid;grid-template-columns:1fr 1fr;background:#fff}
.cx-sp .cx-ln-tabs button{position:relative;height:60px;text-align:center;font-size:20px;color:#8a94a6}
.cx-sp .cx-ln-tabs button.on{color:#111}
.cx-sp .cx-ln-tabs button.on::after{content:"";position:absolute;left:50%;bottom:0;width:56px;height:4px;margin-left:-28px;border-radius:2px;background:#1a82d6}
.cx-ln-body{padding:14px 14px 0}
.cx-sp .cx-ln-sel{display:flex;align-items:center;justify-content:space-between;width:100%;height:58px;padding:0 30px 0 18px;background:#fff;font-size:21px;margin-bottom:14px}
.cx-ln-card{background:#fff;padding:18px 18px 20px;margin-bottom:14px;font-size:18px}
.cx-ln-card .r{padding:7px 0;line-height:1.35;word-break:break-word}
.cx-ln-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;padding-top:7px}
.cx-ln-foot .tot{font-size:18px}
.cx-ln-foot .tot b{font-weight:600}
.cx-ln-acts{display:flex;align-items:center;gap:16px;font-size:18px;white-space:nowrap}
.cx-sp .cx-ln-acts button{color:#1a82d6;font-size:18px;padding:0}
.cx-ln-end{margin-top:-14px;background:#fff;border-top:1px solid #e7e9ef;text-align:center;color:#9aa0ad;padding:24px 0;font-size:21px}
.cx-ln-prod{position:relative;min-height:150px}
.cx-sp .cx-ln-prod .go{position:absolute;right:16px;bottom:14px;height:56px;padding:0 24px;border-radius:12px;background:#00c087;color:#fff;font-size:19px;text-align:center}
.cx-ln-prod .r:last-of-type{padding-right:200px}
.cx-ln-none{padding:60px 0;text-align:center;color:#9aa0ad;font-size:17px}

/* apply page */
.cx-lp-h{display:flex;align-items:center;gap:14px;margin:14px 14px 14px;padding:14px 12px;border-radius:14px;background:#fff;font-size:27px;font-weight:700}
.cx-lp-c{margin:0 14px 14px;border-radius:14px;background:#fff;padding:26px 24px 22px}
.cx-lp-c .r{padding:20px 0 20px 0;font-size:19px;line-height:1.3}
.cx-lp-m{display:flex;justify-content:space-between;align-items:center;padding:18px 0 14px;font-size:20px;border-bottom:1px solid #d7dbe3}
.cx-lp-a{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:20px 0 0;font-size:20px}
.cx-lp-a .ctl{display:flex;align-items:center;gap:10px}
.cx-sp .cx-lp-a .circ{width:46px;height:46px;border-radius:50%;border:1.5px solid #222;display:grid;place-items:center;font-size:32px;line-height:1;padding:0 0 3px}
.cx-sp .cx-lp-a .circ:disabled{border-color:#c9ced6;color:#c9ced6}
.cx-lp-a input{width:100px;height:46px;border:0;border-bottom:1px solid #999;outline:0;text-align:center;font-size:21px;background:transparent;color:inherit}
.cx-lp-t{margin:0 14px 14px;border-radius:14px;background:#fff;padding:26px 16px 22px}
.cx-lp-t>p{margin:0 0 22px;padding:0 0 22px;font-size:20px;border-bottom:1px solid #9aa0ad}
.cx-lp-ups{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.cx-lp-up{text-align:center;font-size:19px;line-height:1.15;word-break:break-word}
.cx-lp-up label{display:grid;place-items:center;width:100%;aspect-ratio:1/1;max-width:112px;margin:0 auto 14px;background:#e0e1ea center/cover no-repeat;cursor:pointer;color:#111}
.cx-lp-up input{display:none}
.cx-lp-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;z-index:60;display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid #e7e9ef}
.cx-lp-bar .am{font-size:24px}
.cx-lp-bar .am b{font-weight:400;color:#d84d5a;font-size:32px}
.cx-sp .cx-lp-bar .ap{height:62px;padding:0 44px;border-radius:12px;background:#d84d5a;color:#fff;font-size:20px;text-align:center}
.cx-sp .cx-lp-bar .ap:disabled{opacity:.6}
@media(min-width:768px){.cx-lp-bar{max-width:900px}}
@media(max-width:380px){.cx-lp-h{font-size:21px}.cx-lp-bar .am{font-size:18px}.cx-lp-bar .am b{font-size:24px}.cx-sp .cx-lp-bar .ap{padding:0 22px}}

.cx.dark .cx-sp .cx-ln-tabs,.cx.dark .cx-sp .cx-ln-sel,.cx.dark .cx-sp .cx-ln-card,.cx.dark .cx-sp .cx-ln-end,.cx.dark .cx-sp .cx-lp-h,.cx.dark .cx-sp .cx-lp-c,.cx.dark .cx-sp .cx-lp-t,.cx.dark .cx-sp .cx-lp-bar{background:#17263d;border-color:#22304a}
.cx.dark .cx-sp .cx-ln-tabs button.on,.cx.dark .cx-sp .cx-lp-up label{color:#e8ecf3}
.cx.dark .cx-sp .cx-lp-up label{background-color:#22304a}
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
      <div className="cx-sp" style={{ paddingBottom: 110 }}>
        <style>{SUB_CSS + CSS}</style>
        <TopBar title={tt("applyLoan", "Apply for Loan")} onBack={() => setSel(null)} />

        <div className="cx-lp-h">
          <svg width="46" height="46" viewBox="0 0 24 24">
            <path d="M12 2l9 4.5-9 4.5-9-4.5z" fill="#2f6df6" />
            <path d="M3 11l9 4.5 9-4.5" fill="none" stroke="#2f6df6" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M3 15.5L12 20l9-4.5" fill="none" stroke="#2f6df6" strokeWidth="2.2" strokeLinejoin="round" />
          </svg>
          <span>{sel.name}</span>
        </div>

        <div className="cx-lp-c">
          <div className="r">{tt("lendInst", "Lending Institution")} : {sel.inst}</div>
          <div className="r">{tt("dailyRate", "Daily Interest Rate")} : {sel.rate.toFixed(4)} %</div>
          <div className="r">{tt("period", "Repayment Period")} : {sel.days} {tt("day", "Day")}</div>
          <div className="r">{tt("amount", "Amount")} : {f2(sel.min)} - {f2(sel.max)}</div>
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
                <label style={imgs[k] ? { backgroundImage: `url(${imgs[k]})` } : undefined}>
                  <input type="file" accept="image/*" onChange={(e) => { pickImg(k, e.target.files && e.target.files[0]); e.target.value = ""; }} />
                  {!imgs[k] && (
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="#111">
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
          <span className="am">{tt("amount", "Amount")} : <b>{f2(amount)}</b></span>
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
                  <div className="r">{o.name}</div>
                  <div className="r">{tt("orderNo", "Order No.")} : {o.no}</div>
                  <div className="r">{tt("amount", "Amount")} : {f2(o.amount)}</div>
                  <div className="r">{tt("totInterest", "Total Interest")} : {f2(o.interest)}</div>
                  <div className="r">{tt("repayDate", "Repayment Date")} : {o.date || "--"}</div>
                  <div className="cx-ln-foot">
                    <span className="tot">
                      {tt("total", "Total")} :{" "}
                      <b style={{ color: o.paid ? "#00c087" : "#d84d5a" }}>
                        {f2(o.total)}
                        {showPaid ? ` ( ${o.paid ? tt("paidBack", "Paid back") : tt("notPaid", "Not paid back")} )` : ""}
                      </b>
                    </span>
                    <span className="cx-ln-acts">
                      <span style={{ color: st.color }}>{tt("st_" + o.status, st.label)}</span>
                      {o.status === "applying" && <button type="button" onClick={() => cancelOrder(o)}>{tt("cancel", "Cancel")}</button>}
                    </span>
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
            <div className="r">{p.name}</div>
            <div className="r">{tt("lendInst", "Lending Institution")} : {p.inst}</div>
            <div className="r">{tt("amount", "Amount")} : {f2(p.min)} - {f2(p.max)}</div>
            <div className="r">{tt("dailyRate", "Daily Interest Rate")} : {p.rate.toFixed(4)} %</div>
            <div className="r">{tt("period", "Repayment Period")} : {p.days} {tt("day", "Day")}</div>
            <button type="button" className="go" onClick={() => openApply(p)}>{tt("applyLoan", "Apply for Loan")}</button>
          </div>
        ))}
      </div>

      {toast}

      <Picker open={pk} options={FILTERS} value={filter} onCancel={() => setPk(false)} onConfirm={(v) => { setFilter(v); setPk(false); }} />
    </div>
  );
}

