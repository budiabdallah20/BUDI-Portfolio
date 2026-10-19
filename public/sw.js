/* BUDI service worker — installable app + push notifications.
 *
 * CACHING POLICY (why it is shaped this way):
 * - Navigations (HTML documents): NETWORK-FIRST. The portfolio is edited from
 *   the dashboard and redeployed, so a cache-first HTML shell kept serving the
 *   old site — and old hashed chunks with it — long after a deploy. Now a new
 *   build lands on the very next load; the cached copy is only a fallback for
 *   offline.
 * - /_next/static/* : CACHE-FIRST. Those URLs are content-hashed by the build,
 *   so a cache hit can never be stale.
 * - Everything else same-origin GET (images, icons, fonts …): network-first
 *   with a runtime-cache fallback, so a replaced asset never sticks.
 * - /api/* and /admin are never cached.
 * - Bumping VERSION wipes every older cache on activate, so a policy change
 *   reaches existing installs instead of lingering forever.
 */

const VERSION = "budi-v2";
const RUNTIME_CACHE = `${VERSION}-runtime`;
const PRECACHE_URLS = ["/manifest.webmanifest", "/icons/pwa-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(RUNTIME_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== RUNTIME_CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Build-hashed assets can never go stale — the one safe cache-first case. */
function isImmutableAsset(pathname) {
  return pathname.startsWith("/_next/static/");
}

function isCacheable(response) {
  return Boolean(response) && response.ok && response.type === "basic";
}

function putInCache(request, response) {
  const copy = response.clone();
  caches
    .open(RUNTIME_CACHE)
    .then((cache) => cache.put(request, copy))
    .catch(() => undefined);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;

  if (isImmutableAsset(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ??
          fetch(req).then((res) => {
            if (isCacheable(res)) putInCache(req, res);
            return res;
          }),
      ),
    );
    return;
  }

  // Network-first: fresh HTML / images when online, cached copy when offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (isCacheable(res)) putInCache(req, res);
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit ?? Response.error())),
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
