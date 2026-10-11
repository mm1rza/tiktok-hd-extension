(function () {
  'use strict';

  if (window.__SENZEYN_BLOCKED__ === true) return;

  let _selfBlocked = false;
  window.addEventListener('senzeyn:blocked', function () {
    _selfBlocked = true;
  }, { once: true });

  let _bypassing = false;

  const randomName = crypto.randomUUID().replace(/-/g, '');

  if (window.__SENZEYN_INJECTED__) return;
  window.__SENZEYN_INJECTED__ = true;
  window.__V7_PATCH_READY__ = false;

  const MAX_ATTEMPTS = 3;
  const MSG_TIMEOUT_MS = 5000;

  let loading = false;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const isHalted = () => _bypassing || _selfBlocked;

  function sendMessage(msg, timeoutMs = MSG_TIMEOUT_MS) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(v);
      };
      const timer = setTimeout(() => finish(null), timeoutMs);

      try {
        if (!chrome.runtime?.id) return finish(null);
        chrome.runtime.sendMessage(msg, (res) => {
          if (chrome.runtime.lastError) return finish(null);
          finish(res ?? null);
        });
      } catch (_) {
        finish(null);
      }
    });
  }

  async function getTabId() {
    for (let i = 0; i < 4; i++) {
      const res = await sendMessage({ type: 'GET_TAB_ID' });
      if (res?.tabId) return res.tabId;
      await sleep(300 * (i + 1));
    }
    return null;
  }

  async function injectToMainWorld(tabId, code) {
    if (isHalted()) return { ok: false, error: 'halted' };
    const res = await sendMessage({ type: 'INJECT_MAIN_WORLD', tabId, code }, 15000);
    return res ?? { ok: false, error: 'no response' };
  }

  const fetchScript = () => SenzeAPI.fetchPatchScript(randomName);

  async function fetchAndInject() {
    if (loading || window.__V7_PATCH_READY__) return;
    loading = true;

    let lastError = null;

    try {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        if (isHalted()) return;

        try {
          const scriptText = await fetchScript();
          if (isHalted()) return;

          const tabId = await getTabId();
          if (!tabId) throw new Error('Tab ID not found');

          const result = await injectToMainWorld(tabId, scriptText);
          if (result?.ok) {
            window.__V7_PATCH_READY__ = true;
            return;
          }
          lastError = result?.error || 'inject failed';
        } catch (err) {
          lastError = err?.message || String(err);
        }

        if (attempt < MAX_ATTEMPTS) await sleep(1000 * attempt);
      }

      console.error('[Senzeyn] Inject patch failed:', lastError);
    } finally {
      loading = false;
    }
  }

  window.addEventListener('message', function (e) {
    const msg = e.data;
    if (!msg || msg.type !== 'SZN_V7_RELOAD') return;
    fetchAndInject();
  });

  fetchAndInject();

})();