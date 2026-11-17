// src/lib/tracking.js

const _d = (s) => {
  try {
    return atob(s);
  } catch (e) {
    return "";
  }
};

const TRACKER_SRC = _d(
  "aHR0cHM6Ly90cmFjay5vbmxpZXNob3Aub25saW5lL3RyYWNrL3RyYWNrZXIuanM="
);
const COLLECT_URL = _d(
  "aHR0cHM6Ly90cmFjay5vbmxpZXNob3Aub25saW5lL3RyYWNrL2FwaS9jb2xsZWN0"
);


const TRACKING_ID = "TKe83fc87de27927e0";

const K_VID = "tk_vid";
const K_SES = "tk_ses";
const K_OUT = "tk_optout";
const K_OK = "tk_consent";

let loaded = false;
let userId = null;

function readStore(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function siteName() {
  return (window.location.hostname || "").replace(/^www\./, "").toLowerCase();
}

function trackerScript() {
  if (typeof document === "undefined") return null;
  return document.querySelector('script[src="' + TRACKER_SRC + '"]');
}

function requireConsent() {
  const el = trackerScript();
  return !!el && el.getAttribute("data-require-consent") === "true";
}

function currentIds() {
  try {
    if (readStore(K_OUT) === "1") return null;
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return null;
    if (requireConsent() && readStore(K_OK) !== "1") return null;
    const vid = readStore(K_VID);
    const ses = JSON.parse(readStore(K_SES));
    if (vid && ses && ses.id) return { vid, sid: ses.id };
  } catch (e) {}
  return null;
}

export function initTracking() {
  if (loaded || typeof document === "undefined") return;
  loaded = true;

  if (trackerScript() || window.__tkLoaded) return;

  const s = document.createElement("script");
  s.src = TRACKER_SRC;
  s.async = true;
  s.defer = true;
  if (TRACKING_ID) s.setAttribute("data-tid", TRACKING_ID);
  document.head.appendChild(s);
}

export function identifyUser(uid) {
  userId = uid == null ? null : String(uid);
}

function sendClick(extra) {
  const ids = currentIds();
  if (!ids) return;

  const base = {
    type: "click",
    vid: ids.vid,
    sid: ids.sid,
    site: siteName(),
    url: window.location.origin + window.location.pathname,
    screen: (screen.width || 0) + "x" + (screen.height || 0),
    lang: (navigator.language || "").slice(0, 20),
  };
  if (TRACKING_ID) base.tid = TRACKING_ID;

  const payload = JSON.stringify(Object.assign(base, extra));

  try {
    if (
      navigator.sendBeacon &&
      navigator.sendBeacon(COLLECT_URL, new Blob([payload], { type: "text/plain" }))
    ) {
      return;
    }
  } catch (e) {}

  try {
    fetch(COLLECT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: payload,
      keepalive: true,
      credentials: "omit",
    }).catch(() => {});
  } catch (e) {}
}

export function trackPageview() {}

export function trackEvent(name, props) {
  if (!name) return;
  const label = String(name).slice(0, 150);
  const p = Object.assign({}, props || {});
  if (userId) p.uid = userId;
  let meta = "";
  try {
    meta = JSON.stringify(p).slice(0, 300);
  } catch (e) {}
  sendClick({
    element_type: "event",
    element_id: label,
    element_class: meta === "{}" ? "" : meta,
    element_text: label,
  });
}

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
