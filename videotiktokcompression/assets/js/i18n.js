(function () {
  'use strict';

  var STORAGE_KEY = 'tiktok_hd_lang';
  var DEFAULT_LANG = 'id'; // Bahasa Indonesia default

  var dict = {
    en: {
      lang_label: 'EN',
      brand_badge: 'BYPASS V4 STANDALONE',
      title_sub: 'High Quality TikTok Video — Zero Compression',
      notif_title: 'System Active (Standalone)',
      notif_sub: 'Ready to Process & Bypass ↗',
      feat_title: 'System Features & Capabilities',
      f1: '100% Standalone & Offline (Zero External Endpoints)',
      f2: 'Lossless Upload — 0 TikTok Server Compression',
      f3: 'Optimal Support Up To 1080p 60 FPS All Regions',
      f4: 'Full Quality Bitrate & Audio Preservation',
      f5: 'ISO MP4 BMFF Box Metadata Patcher Engine',
      tutorial_title: 'Usage Guide & Steps',
      step1: '1. Select or drag & drop your MP4/MOV video file into the upload zone below.',
      step2: '2. Maximum recommended resolution is 1080p and framerate is 60 FPS.',
      step3: '3. Click <strong>Start Processing</strong> button.',
      step4: '4. Video will be remuxed/optimized via FFmpeg WASM and metadata patched automatically.',
      step5: '5. Downloaded file (<code>_TikTokHD.mp4</code>) can be uploaded directly to TikTok Studio!',
      card_bypass_title: 'High Quality Bypass',
      card_bypass_sub: 'Full High Quality Uploads (0 Compression)',
      card_watermark_title: 'Watermark',
      card_watermark_sub: 'Keep Caption Clean / Custom Watermark',
      upload_page_btn: 'Open TikTok Studio Upload Page ↗',
      upload_zone_label: 'Select Video File',
      upload_zone_replace: 'Selected file — click to replace',
      upload_zone_hint: 'MP4 / MOV — Up to 1080p 60 FPS',
      spec_resolution: 'Resolution :',
      spec_framerate: 'FrameRate :',
      spec_size: 'File Size :',
      btn_start: 'Start Processing',
      btn_processing: 'Processing...',
      warn_oversized: '⚠ Not Recommended (>1080p)',
      warn_highfps: '⚠ Not Recommended (>60 FPS)',
      step_load: 'Load',
      step_read: 'Read',
      step_convert: 'Convert',
      step_bypass: 'Bypass',
      step_complete: 'Complete',
      success_done: 'Done! Video optimized & downloaded successfully.',
      err_max_res: 'Only supports video up to 1080p!',
      err_max_fps: 'Only supports video up to 60 FPS!',
      footer_more: 'More Information & Community'
    },
    id: {
      lang_label: 'ID',
      brand_badge: 'BYPASS V4 STANDALONE',
      title_sub: 'Video TikTok Kualitas Tinggi — Tanpa Kompresi',
      notif_title: 'Sistem Aktif (Standalone)',
      notif_sub: 'Siap Proses Video & Bypass ↗',
      feat_title: 'Fitur Sistem & Kemampuan',
      f1: '100% Standalone & Offline (Bebas dari Server Luar)',
      f2: 'Upload Lossless — 0 Kompresi Server TikTok',
      f3: 'Dukungan Maksimal Hingga 1080p 60 FPS Semua Region',
      f4: 'Kualitas Bitrate & Audio Asli Tetap Terjaga',
      f5: 'Engine ISO MP4 BMFF Box Metadata Patcher Otomatis',
      tutorial_title: 'Panduan Penggunaan & Langkah',
      step1: '1. Pilih atau tarik file video MP4/MOV Anda ke area upload di bawah.',
      step2: '2. Rekomendasi resolusi maksimal 1080p dan framerate maksimal 60 FPS.',
      step3: '3. Klik tombol <strong>Start Processing</strong>.',
      step4: '4. Video akan dioptimasi via FFmpeg WASM dan dipatch metadatanya secara otomatis.',
      step5: '5. File hasil unduhan (<code>_TikTokHD.mp4</code>) siap diupload ke TikTok Studio!',
      card_bypass_title: 'Bypass Kualitas Tinggi',
      card_bypass_sub: 'Upload Kualitas Penuh (0 Kompresi TikTok)',
      card_watermark_title: 'Watermark',
      card_watermark_sub: 'Caption Bersih / Watermark Kustom',
      upload_page_btn: 'Buka Halaman Upload TikTok Studio ↗',
      upload_zone_label: 'Pilih File Video',
      upload_zone_replace: 'File dipilih — klik untuk mengganti',
      upload_zone_hint: 'MP4 / MOV — Maksimal 1080p 60 FPS',
      spec_resolution: 'Resolusi :',
      spec_framerate: 'FrameRate :',
      spec_size: 'Ukuran File :',
      btn_start: 'Mulai Proses Video',
      btn_processing: 'Memproses...',
      warn_oversized: '⚠ Tidak Disarankan (>1080p)',
      warn_highfps: '⚠ Tidak Disarankan (>60 FPS)',
      step_load: 'Load',
      step_read: 'Read',
      step_convert: 'Convert',
      step_bypass: 'Bypass',
      step_complete: 'Selesai',
      success_done: 'Selesai! Video berhasil dioptimasi & didownload.',
      err_max_res: 'Hanya mendukung resolusi maksimal 1080p!',
      err_max_fps: 'Hanya mendukung video maksimal 60 FPS!',
      footer_more: 'Informasi Lengkap & Komunitas'
    }
  };

  var lang = DEFAULT_LANG;
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && dict[saved]) lang = saved;
  } catch (e) {}

  function t(key) {
    return (dict[lang] && dict[lang][key]) || dict[DEFAULT_LANG][key] || key;
  }

  function apply() {
    document.documentElement.lang = lang;
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      var val = t(key);
      if (nodes[i].hasAttribute('data-i18n-html')) {
        nodes[i].innerHTML = val;
      } else {
        nodes[i].textContent = val;
      }
    }
    var label = document.getElementById('langBtnLabel');
    if (label) label.textContent = lang.toUpperCase();
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
  }

  function setLang(next) {
    if (!dict[next]) return;
    lang = next;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    apply();
  }

  window.i18n = {
    t: t,
    getLang: function () { return lang; },
    setLang: setLang
  };

  document.addEventListener('DOMContentLoaded', function () {
    apply();
    var btn = document.getElementById('langBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        setLang(lang === 'en' ? 'id' : 'en');
      });
    }
  });
})();
