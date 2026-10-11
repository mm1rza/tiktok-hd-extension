(function (global) {
  'use strict';

  // Jika SenzeAPI sudah terpasang, jangan inisialisasi ulang
  if (global.SenzeAPI) return;

  // Base URL & konfigurasi endpoint server Senzeyn
  const BASE_URL = 'https://v6.senze.my.id';
  const TOKEN = 'v6';
  const TIMEOUT_MS = 15000;

  const ENDPOINTS = {
    checkup: BASE_URL + '/api/checkup',
    control: BASE_URL + '/api/control',
    inject: BASE_URL + '/api/inject',
    sign: BASE_URL + '/api/sign',
    patch: BASE_URL + '/api/patch'
  };

  // Versi ekstensi saat ini dari manifest.json
  const CURRENT_VERSION = chrome.runtime.getManifest().version;

  // Karakter untuk membuat token nonce acak anti-cache
  const NONCE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  /**
   * Membuat string acak dengan panjang tertentu menggunakan kriptografi aman
   * @param {number} length Panjang string acak (default: 16)
   * @returns {string} String nonce acak
   */
  function getRandomToken(length = 16) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    let token = '';
    for (const b of randomBytes) {
      token += NONCE_CHARS[b % NONCE_CHARS.length];
    }
    return token;
  }

  /**
   * Menambahkan query param ?t=<nonce> pada URL agar tidak terkena cache browser/CDN
   * @param {string} url URL tujuan
   * @returns {string} URL dengan parameter anti-cache
   */
  const withCacheBust = (url) => url + '?t=' + getRandomToken();

  /**
   * Mendekripsi payload konfigurasi checkup dari server
   * Algoritma: Array integer di-XOR dengan karakter kunci string "true" secara berulang
   * @param {number[]} enc Array byte / kode karakter terenkripsi
   * @returns {object} Konfigurasi JSON hasil dekripsi
   */
  function decryptConfig(enc) {
    const key = 'true';
    const jsonStr = enc.map((code, index) =>
      String.fromCharCode(code ^ key.charCodeAt(index % key.length))
    ).join('');
    return JSON.parse(jsonStr);
  }

  /**
   * Perbandingan versi semver sederhana (apakah versi a < versi b)
   * @param {string} a Versi sumber (misal: "6.1.0")
   * @param {string} b Versi target pembanding (misal: "6.2.0")
   * @returns {boolean} True jika versi a lebih kecil dari versi b
   */
  function semverLt(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((pa[i] || 0) < (pb[i] || 0)) return true;
      if ((pa[i] || 0) > (pb[i] || 0)) return false;
    }
    return false;
  }

  /**
   * Mengecek apakah versi ekstensi saat ini diblokir / wajib update
   * berdasarkan konfigurasi dari server
   * @param {object} cfg Objek konfigurasi dari server
   * @returns {boolean} True jika diblokir/wajib update
   */
  function isBlocked(cfg) {
    if (!cfg) return false;
    // 1. Server memaksa pembaruan umum
    if (cfg.update_required === true) return true;
    // 2. Versi saat ini di bawah batas minimal (min_version)
    if (cfg.min_version && semverLt(CURRENT_VERSION, cfg.min_version)) return true;
    // 3. Versi saat ini ada di daftar hitam (blacklist)
    if (Array.isArray(cfg.blacklisted_versions) && cfg.blacklisted_versions.includes(CURRENT_VERSION)) return true;
    return false;
  }

  /**
   * Helper dasar untuk HTTP request dengan fetch
   * Dilengkapi opsi timeout, anti-cache, dan pembatalan (AbortController)
   */
  async function request(url, {
    method = 'GET',
    headers = {},
    body,
    timeoutMs,
    noCache = true
  } = {}) {
    const controller = timeoutMs ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      return await fetch(noCache ? withCacheBust(url) : url, {
        method,
        cache: 'no-cache',
        credentials: 'omit',
        headers,
        body,
        signal: controller ? controller.signal : undefined
      });
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * Helper untuk mengirim POST request berisi nama script & versi ekstensi
   * Mengembalikan konten teks respon (script JavaScript)
   */
  async function postJSON(url, name) {
    const res = await fetch(withCacheBust(url), {
      method: 'POST',
      cache: 'no-cache',
      credentials: 'omit',
      headers: {
        'X-Senzeyn-Token': TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        version: CURRENT_VERSION,
        ts: Date.now()
      })
    });

    if (!res.ok) return null;
    return await res.text();
  }

  /**
   * Melakukan checkup ke server untuk memeriksa status ekstensi,
   * apakah ada pembaruan paksa (force update), pesan pengumuman, atau pemblokiran versi.
   * @returns {Promise<{cfg: object, blocked: boolean, enriched: object} | null>}
   */
  async function checkup() {
    try {
      const res = await request(ENDPOINTS.checkup);
      if (!res.ok) return null;

      const enc = await res.json();
      const cfg = decryptConfig(enc);
      const blocked = isBlocked(cfg);
      const enriched = {
        ...cfg,
        blocked,
        current_version: CURRENT_VERSION
      };

      return {
        cfg,
        blocked,
        enriched
      };
    } catch (_) {
      return null;
    }
  }

  /**
   * Mengambil data kendali/fitur dari endpoint /api/control
   * @returns {Promise<object | null>} Data JSON kontrol dari server
   */
  async function fetchControl() {
    try {
      const res = await request(ENDPOINTS.control, {
        headers: {
          'X-Senzeyn-Token': TOKEN
        }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  /**
   * Mengambil remote script untuk inject (endpoint /api/inject)
   * @param {string} name Identifier atau nama script acak
   * @returns {Promise<string | null>} Teks kode script JavaScript
   */
  async function fetchInjectScript(name) {
    try {
      return await postJSON(ENDPOINTS.inject, name);
    } catch (_) {
      return null;
    }
  }

  /**
   * Mengambil remote script untuk watermark / signature (endpoint /api/sign)
   * @param {string} name Identifier atau nama script acak
   * @returns {Promise<string | null>} Teks kode script JavaScript
   */
  async function fetchWatermarkScript(name) {
    try {
      return await postJSON(ENDPOINTS.sign, name);
    } catch (_) {
      return null;
    }
  }

  /**
   * Mengambil remote script patch utama untuk TikTok Studio (endpoint /api/patch)
   * Digunakan oleh src/load.js saat menginjeksi hook bypass ke halaman browser
   * @param {string} name Identifier atau nama unik acak
   * @returns {Promise<string>} Teks kode script JavaScript patch bypass
   */
  async function fetchPatchScript(name) {
    const headers = {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    };

    const res = await fetch(withCacheBust(ENDPOINTS.patch), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name,
        ts: Date.now()
      }),
      credentials: 'omit',
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    if (!res.ok) {
      throw new Error('Fetch script failed: ' + res.status);
    }

    return await res.text();
  }

  // Objek modul publik SenzeAPI
  const SenzeAPI = {
    ENDPOINTS,
    CURRENT_VERSION,
    isBlocked,
    checkup,
    fetchControl,
    fetchInjectScript,
    fetchWatermarkScript,
    fetchPatchScript
  };

  // Bekukan objek agar aman dari modifikasi eksternal dan daftarkan ke global (window/worker)
  global.SenzeAPI = Object.freeze(SenzeAPI);

})(globalThis);
