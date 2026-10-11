if (typeof window === "undefined") {

  let coepCredentialless = false;

  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener("message", (ev) => {
    if (!ev.data) return;
    if (ev.data.type === "deregister") {
      self.registration.unregister().then(() => self.clients.matchAll())
        .then((clients) => clients.forEach((client) => client.navigate(client.url)));
    } else if (ev.data.type === "coepCredentialless") {
      coepCredentialless = ev.data.value;
    }
  });

  self.addEventListener("fetch", (event) => {
    const r = event.request;
    if (r.cache === "only-if-cached" && r.mode !== "same-origin") return;

    const request = (coepCredentialless && r.mode === "no-cors")
      ? new Request(r, { credentials: "omit" })
      : r;

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 0) return response;

          const headers = new Headers(response.headers);
          headers.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp");
          if (!coepCredentialless) headers.set("Cross-Origin-Resource-Policy", "cross-origin");
          headers.set("Cross-Origin-Opener-Policy", "same-origin");

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        })
    );
  });

} else {

  (function registerCOI() {
    const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
    window.sessionStorage.removeItem("coiReloadedBySelf");

    const n = navigator;
    if (n.serviceWorker && n.serviceWorker.controller) {
      n.serviceWorker.controller.postMessage({ type: "coepCredentialless", value: true });
    }

    if (window.crossOriginIsolated) {
      console.info("Multithreaded Active");
      return;
    }

    if (!window.isSecureContext) {
      console.warn("required for cross-origin isolation");
      return;
    }
    if (!n.serviceWorker) {
      console.warn("Multithreaded Off");
      return;
    }

    n.serviceWorker.register(window.document.currentScript.src).then(
      (registration) => {
        console.info("COI service worker registered:", registration.scope);

        registration.addEventListener("updatefound", () => {
          window.sessionStorage.setItem("coiReloadedBySelf", "updatefound");
          window.location.reload();
        });

        if (registration.active && !n.serviceWorker.controller) {
          window.sessionStorage.setItem("coiReloadedBySelf", "notcontrolling");
          window.location.reload();
        }
      },
      (err) => console.warn("registration failed:", err)
    );
  })();

  (function preloadFFmpeg() {
    var CHECK_INTERVAL = 150;
    var MAX_WAIT       = 60000;
    var elapsed        = 0;

    function tryLoad() {
      if (window.FFmpeg && window.FFmpeg.createFFmpeg) {
        if (window.__ffmpegPreloading__ || window.__ffmpegLoaded__) return;
        window.__ffmpegPreloading__ = true;

        var ff = window.FFmpeg.createFFmpeg({
          corePath: new URL('src/ffmpeg-core.js', document.location.href).href,
          log: false,
        });

        ff.load()
          .then(function () {
            window.__ffmpegInstance__ = ff;
            window.__ffmpegLoaded__   = true;
            window.__ffmpegPreloading__ = false;
            console.info('FFmpeg preloaded');
          })
          .catch(function (err) {
            window.__ffmpegPreloading__ = false;
            console.warn('FFmpeg preload failed:', err.message);
          });

        return;
      }

      elapsed += CHECK_INTERVAL;
      if (elapsed < MAX_WAIT) {
        setTimeout(tryLoad, CHECK_INTERVAL);
      } else {
        console.warn('FFmpeg CDN load after ' + MAX_WAIT / 1000 + 's');
      }
    }

    setTimeout(tryLoad, CHECK_INTERVAL);
  })();
}
