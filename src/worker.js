importScripts('api.js');

const UPDATE_CACHE_KEY = 'update.cache';
const CURRENT_VERSION = SenzeAPI.CURRENT_VERSION;

function broadcastToAll(msg) {
  chrome.runtime.sendMessage(msg).catch(() => { });
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.tabs.sendMessage(tab.id, msg).catch(() => { });
    }
  });
}

function broadcastToPopup(msg) {
  chrome.runtime.sendMessage(msg).catch(() => { });
}

async function injectBlockedToAllTabs() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: () => {
        window.__SENZEYN_BLOCKED__ = true;
        window.dispatchEvent(new CustomEvent('senzeyn:blocked'));
      },
    }).catch(() => { });
  }
}

let _swLastBlocked = null;

async function _swPollUpdate() {
  const result = await SenzeAPI.checkup();
  if (!result) return;
  const { blocked, enriched } = result;

  chrome.storage.local.set({ 'update.result': { ts: Date.now(), data: enriched } });

  if (blocked !== _swLastBlocked) {
    _swLastBlocked = blocked;
    broadcastToAll({ type: 'UPDATE_STATUS', blocked, cfg: blocked ? enriched : null });
    if (blocked) await injectBlockedToAllTabs();
  }
}

chrome.alarms.create('szn-update-poll', { periodInMinutes: 10 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'szn-update-poll') _swPollUpdate();
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install' || reason === 'update') {
    await _swPollUpdate();
  }
});

chrome.runtime.onStartup.addListener(() => {
  _swPollUpdate();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_CACHE_GET') {
    chrome.storage.local.get(UPDATE_CACHE_KEY, (res) => { sendResponse(res[UPDATE_CACHE_KEY] ?? null); }); return true;
  }
  if (message.type === 'UPDATE_CACHE_SET') {
    chrome.storage.local.set({ [UPDATE_CACHE_KEY]: { ts: Date.now(), data: message.data } }); return false;
  }
  if (message.type === 'GET_TAB_ID') {
    sendResponse({ tabId: sender.tab?.id }); return true;
  }
  if (message.type === 'INJECT_MAIN_WORLD') {
    chrome.scripting.executeScript({
      target: { tabId: message.tabId },
      world: 'MAIN',
      func: (code) => {
        try {
          (0, eval)(code);
          return { ok: true };
        } catch (e) {
          return { ok: false, error: (e && e.message) || String(e) };
        }
      },
      args: [message.code],
    }).then((results) => {
      const res = results?.[0]?.result;
      sendResponse(res ?? { ok: false, error: 'executeScript no result' });
    }).catch(err => { sendResponse({ ok: false, error: err.message }); }); return true;
  }
  if (message.type === 'PAGE_STATUS') { broadcastToPopup({ type: 'PAGE_STATUS', injected: message.injected }); sendResponse({ ok: true }); return true; }
  if (message.type === 'INJECT_SCRIPT' && message.code && sender.tab?.id) {
    chrome.scripting.executeScript({ target: { tabId: sender.tab.id, allFrames: false }, world: 'MAIN', func: (code) => { try { (new Function(code))(); } catch (e) { } }, args: [message.code], })
      .then(() => { sendResponse({ ok: true }); }).catch((err) => { sendResponse({ ok: false, error: err.message }); }); return true;
  }
});