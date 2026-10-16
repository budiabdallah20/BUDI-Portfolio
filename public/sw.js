/* BUDI service worker — installable app + push notifications.
 * - Skip-waiting + claim so updates land fast.
 * - Runtime cache: same-origin GET (pages, _next assets, icons) — cache
 *   first, network fallback; API + admin never cached.
 * - Push: shows the notification (title/body/icon/badge, URL in data).
 * - Click: focuses the open tab or opens the URL (dashboard-first).
 */

const VERSION = "budi-v1";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(["/", "/manifest.webmanifest", "/icons/pwa-192.png"]))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: false }).then(
      (hit) =>
        hit ??
        fetch(req).then((res) => {
          if (res.ok && (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/images/"))) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy)).catch(() => undefined);
          }
          return res;
        }).catch(() => hit ?? Response.error()),
    ),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "BUDI", body: "", url: "/admin" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* text payload — keep defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "BUDI", {
      body: data.body || "",
      icon: "/icons/pwa-192.png",
      badge: "/icons/pwa-192.png",
      data: { url: data.url || "/admin" },
      tag: data.tag || "budi",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(url)) return w.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
