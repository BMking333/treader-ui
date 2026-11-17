// src/lib/tracking.js
// Tracking helper: tracker.js লোড, SPA pageview, click/event tracking

const TRACKER_SRC = "https://track.onlieshop.online/track/tracker.js";
const COLLECT_URL = "https://track.onlieshop.online/track/api/collect";

let loaded = false;
let lastPath = "";
let userId = null;

/* tracker.js একবারই লোড হবে */
export function initTracking() {
  if (loaded || typeof document === "undefined") return;
  loaded = true;

  if (document.querySelector('script[data-cx-tracker]')) return;

  const s = document.createElement("script");
  s.src = TRACKER_SRC;
  s.async = true;
  s.defer = true;
  s.setAttribute("data-cx-tracker", "1");
  s.setAttribute("data-api", COLLECT_URL);
  s.setAttribute("data-spa", "manual"); // pageview আমরা নিজে পাঠাই
  document.head.appendChild(s);
}

/* লগইন করা ইউজারকে চিহ্নিত করা */
export function identifyUser(uid) {
  userId = uid == null ? null : String(uid);
  try {
    const T = window.Tracker || window.tracker;
    if (T && typeof T.identify === "function") T.identify(userId);
  } catch (e) {}
}

/* সব ইভেন্ট এখান দিয়ে যায়: tracker.js থাকলে সেটা, না থাকলে সরাসরি collect API */
function send(type, name, props) {
  const payload = {
    type,
    name,
    props: props || {},
    uid: userId,
    url: window.location.href,
    path: window.location.pathname,
    ref: document.referrer || "",
    title: document.title || "",
    lang: document.documentElement.lang || "",
    ts: Date.now(),
  };

  try {
    const T = window.Tracker || window.tracker;
    if (T) {
      if (type === "pageview" && typeof T.pageview === "function") {
        T.pageview(payload.path, payload);
        return;
      }
      if (type === "event" && typeof T.track === "function") {
        T.track(name, payload.props);
        return;
      }
    }
  } catch (e) {}

  // fallback (CORS preflight সার্ভারে allow থাকতে হবে)
  try {
    fetch(COLLECT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "omit",
      mode: "cors",
    }).catch(() => {});
  } catch (e) {}
}

/* SPA route পরিবর্তনে Pageview (একই path দুইবার যাবে না) */
export function trackPageview(path) {
  const p = path || window.location.pathname;
  if (p === lastPath) return;
  lastPath = p;
  send("pageview", "pageview", { path: p });
}

/* কাস্টম ইভেন্ট */
export function trackEvent(name, props) {
  if (!name) return;
  send("event", name, props);
}

/* বাটন ক্লিক: data-track="নাম" থাকা এলিমেন্ট ট্র্যাক হবে।
   data-track-* অ্যাট্রিবিউটগুলো props হিসেবে যাবে (যেমন data-track-coin="BTC") */
export function bindClickTracking() {
  const onClick = (e) => {
    const el = e.target && e.target.closest ? e.target.closest("[data-track]") : null;
    if (!el) return;

    const name = el.getAttribute("data-track");
    if (!name) return;

    const props = {};
    for (const a of el.attributes) {
      if (a.name.startsWith("data-track-")) {
        props[a.name.slice(11)] = a.value;
      }
    }
    props.text = (el.textContent || "").trim().slice(0, 40);

    trackEvent("click_" + name, props);
  };

  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
