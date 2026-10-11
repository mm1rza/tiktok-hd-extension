(function (global) {
  'use strict';

  // Cegah duplikasi inisialisasi
  if (global.SenzeAPI) return;

  const CURRENT_VERSION = (typeof chrome !== 'undefined' && chrome.runtime?.getManifest)
    ? chrome.runtime.getManifest().version
    : '6.1.0';

  const ENDPOINTS = {
    checkup: '',
    control: '',
    inject: '',
    sign: '',
    patch: ''
  };

  /**
   * Cek status blokir (selalu false / tidak pernah diblokir)
   */
  function isBlocked() {
    return false;
  }

  /**
   * Status checkup mandiri (offline/independen).
   * Selalu melaporkan ekstensi aktif, tidak butuh update, dan tidak diblokir.
   */
  async function checkup() {
    return {
      cfg: {
        update_required: false,
        blacklisted_versions: []
      },
      blocked: false,
      enriched: {
        update_required: false,
        blocked: false,
        current_version: CURRENT_VERSION
      }
    };
  }

  /**
   * Kontrol fitur (semua fitur patch & bypass diaktifkan secara mandiri)
   */
  async function fetchControl() {
    return {
      enableV7Patch: true
    };
  }

  /**
   * Mengambil script patch bypass MP4 dari file lokal 'src/patch.js' di dalam ekstensi
   * Tanpa melakukan koneksi ke server remote luar.
   */
  async function fetchPatchScript() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
        const patchUrl = chrome.runtime.getURL('src/patch.js');
        const res = await fetch(patchUrl);
        if (res.ok) {
          return await res.text();
        }
      }
    } catch (err) {
      console.error('[SenzeAPI] Gagal memuat script patch lokal:', err);
    }
    return null;
  }

  async function fetchInjectScript() {
    return null;
  }

  async function fetchWatermarkScript() {
    return null;
  }

  // Publik interface SenzeAPI
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

  global.SenzeAPI = Object.freeze(SenzeAPI);

})(globalThis);