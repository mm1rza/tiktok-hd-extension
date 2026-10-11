<?php
// Set headers agar WebAssembly & SharedArrayBuffer bekerja maksimal di browser modern
header("Cross-Origin-Opener-Policy: same-origin");
header("Cross-Origin-Embedder-Policy: require-corp");
header("X-Content-Type-Options: nosniff");
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>TikTok Video HD Zero Compression</title>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">

  <!-- Style Utama (Unified Website + Extension) -->
  <link rel="stylesheet" href="assets/css/ui.css">

  <!-- Service Worker untuk Cross-Origin Isolation Fallback -->
  <script src="assets/js/coi-serviceworker.js"></script>
</head>
<body>

  <!-- Ambient Light Effect & Sparkles -->
  <div class="ambient"></div>
  <div class="sparkles" id="sparklesContainer"></div>

  <!-- Language Switcher (EN / ID) -->
  <button class="lang-btn" id="langBtn" type="button" aria-label="Switch language / Ganti bahasa" title="Switch language / Ganti bahasa">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
    <span id="langBtnLabel">ID</span>
  </button>

  <div class="container">

    <!-- Dynamic Island Widget -->
    <div class="di-wrap">
      <div class="di-island di-enter phase-compact" id="diIsland">
        <div class="di-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
          </svg>
        </div>
        <span class="di-label">TikTok HD</span>
        <div class="di-expanded-content">
          <div class="di-expanded-title">Zero Compression</div>
          <div class="di-expanded-sub">High Quality Upload ↗</div>
        </div>
      </div>
    </div>

    <!-- System Status Pill (Extension Style) -->
    <div class="notif-wrap">
      <div class="notif" id="notifBtn" role="button" tabindex="0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5.365V3m0 2.365a5.338 5.338 0 0 1 5.133 5.368v1.8c0 2.386 1.867 2.982 1.867 4.175 0 .593 0 1.292-.538 1.292H5.538C5 18 5 17.301 5 16.708c0-1.193 1.867-1.789 1.867-4.175v-1.8A5.338 5.338 0 0 1 12 5.365Z"/>
          <path d="M8.733 18c.094.852.306 1.54.944 2.112a3.48 3.48 0 0 0 4.646 0c.638-.572 1.236-1.26 1.33-2.112h-6.92Z"/>
        </svg>
        <div class="notif-text">
          <div class="notif-title" id="notifTitle" data-i18n="notif_title">Sistem Aktif (Standalone)</div>
          <div class="notif-sub" id="notifSub" data-i18n="notif_sub">Siap Proses Video & Bypass ↗</div>
        </div>
        <div class="notif-point"></div>
      </div>
    </div>

    <!-- Header & Brand -->
    <div class="header">
      <div class="brand-label" data-i18n="brand_badge">BYPASS V4 STANDALONE</div>
      <div class="title-wrap">
        <div class="h1-top" id="h1Top">TikTok Video HD</div>
      </div>
      <p class="subtitle" data-i18n="title_sub">Video TikTok Kualitas Tinggi — Tanpa Kompresi</p>

      <!-- Quick Action / Social Links -->
      <div class="social-links">
        <a href="https://www.tiktok.com/tiktokstudio/upload?from=webapp" target="_blank" rel="noopener noreferrer" class="social-btn social-btn--tiktok">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
          </svg>
          TikTok Studio
        </a>
        <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" class="social-btn social-btn--telegram">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
          TikTok Web
        </a>
        <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" class="social-btn social-btn--whatsapp">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
          Channel
        </a>
      </div>
    </div>

    <!-- Informasi & Fitur -->
    <div class="card info-card">
      <button class="info-toggle" id="instructionToggle">
        <div style="display:flex;align-items:center;gap:8px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span data-i18n="feat_title">Fitur Sistem & Kemampuan</span>
        </div>
        <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="info-body" id="instructionContent">
        <div class="info-inner">
          <div class="info-content">
            <div class="divider"></div>
            <ul class="feature-list">
              <li data-i18n="f1">100% Standalone &amp; Offline (Bebas dari Server Luar)</li>
              <li data-i18n="f2">Upload Lossless — 0 Kompresi Server TikTok</li>
              <li data-i18n="f3">Dukungan Maksimal Hingga 1080p 60 FPS Semua Region</li>
              <li data-i18n="f4">Kualitas Bitrate &amp; Audio Asli Tetap Terjaga</li>
              <li data-i18n="f5">Engine ISO MP4 BMFF Box Metadata Patcher Otomatis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Tutorial Card -->
    <div class="card tutorial-card">
      <button class="tutorial-btn" id="tutorialToggle">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span data-i18n="tutorial_title">Panduan Penggunaan &amp; Langkah</span>
        <svg class="tutorial-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="tutorial-body" id="tutorialContent">
        <div class="tutorial-inner">
          <div class="info-content" style="padding: 10px 4px 6px;">
            <p style="font-size:0.82rem; color:rgba(255,255,255,0.7); line-height:1.7; margin:0 0 8px;">
              <span data-i18n="step1" data-i18n-html="true">1. Pilih atau tarik file video MP4/MOV Anda ke area upload di bawah.</span><br>
              <span data-i18n="step2" data-i18n-html="true">2. Rekomendasi resolusi maksimal 1080p dan framerate maksimal 60 FPS.</span><br>
              <span data-i18n="step3" data-i18n-html="true">3. Klik tombol <strong>Start Processing</strong>.</span><br>
              <span data-i18n="step4" data-i18n-html="true">4. Video akan dioptimasi via FFmpeg WASM dan dipatch metadatanya secara otomatis.</span><br>
              <span data-i18n="step5" data-i18n-html="true">5. File hasil unduhan (<code>_TikTokHD.mp4</code>) siap diupload ke TikTok Studio!</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle Fitur Tambahan (Extension Style) -->
    <div class="vpn-card" id="customCard1">
      <div class="vpn-left">
        <div class="vpn-dot">⚡</div>
        <div class="vpn-text-group">
          <div class="vpn-title" data-i18n="card_bypass_title">Bypass Kualitas Tinggi</div>
          <div class="vpn-sub" data-i18n="card_bypass_sub">Upload Kualitas Penuh (0 Kompresi TikTok)</div>
        </div>
      </div>
      <label class="vpn-switch">
        <input type="checkbox" id="customToggle1" checked>
        <span class="vpn-slider"></span>
      </label>
    </div>

    <div class="vpn-card" id="customCard2">
      <div class="vpn-left">
        <div class="vpn-dot vpn-dot--star">★</div>
        <div class="vpn-text-group">
          <div class="vpn-title" data-i18n="card_watermark_title">Watermark</div>
          <div class="vpn-sub" data-i18n="card_watermark_sub">Caption Bersih / Watermark Kustom</div>
        </div>
      </div>
      <label class="vpn-switch">
        <input type="checkbox" id="customToggle2">
        <span class="vpn-slider"></span>
      </label>
    </div>

    <!-- Upload Card -->
    <div class="card upload-card">
      <div class="file-input-wrapper">
        <input type="file" id="fileInput" class="file-input" accept="video/mp4,video/quicktime">
        <div class="file-drop-zone" id="fileButton">
          <div class="upload-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div class="file-drop-label" data-i18n="upload_zone_label">Pilih File Video</div>
          <div class="file-drop-hint" data-i18n="upload_zone_hint">MP4 / MOV — Maksimal 1080p 60 FPS</div>
        </div>
      </div>

      <!-- Detail File Terpilih -->
      <div class="file-info" id="fileInfo">
        <strong data-i18n="spec_resolution">Resolusi :</strong> <span id="fileResolution">-</span><br><br>
        <strong data-i18n="spec_framerate">FrameRate :</strong> <span id="fileFps">-</span><br><br>
        <strong data-i18n="spec_size">Ukuran File :</strong> <span id="fileSize">-</span><br>
      </div>
    </div>

    <!-- Tombol Proses & Status -->
    <div class="process-wrap">
      <button class="process-button" id="processBtn" disabled>
        <span data-i18n="btn_start">Mulai Proses Video</span>
      </button>
      <div id="status"></div>
    </div>

    <!-- Link Cepat ke Halaman Upload TikTok Studio (Extension Style) -->
    <a href="https://www.tiktok.com/tiktokstudio/upload?from=webapp" target="_blank" rel="noopener noreferrer" class="fps-converter-card" id="extraLinkCard">
      <span class="fps-converter-text">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
        </svg>
        <span data-i18n="upload_page_btn">Buka Halaman Upload TikTok Studio ↗</span>
      </span>
    </a>

    <!-- Version Label -->
    <div class="version-label">v4.0.0 Standalone Offline — 100% Client-Side Engine</div>

  </div>

  <!-- Script Libraries (100% Offline & Lokal) -->
  <script src="assets/js/i18n.js"></script>
  <script src="assets/js/ui.js"></script>
  <script src="assets/js/read.js"></script>
  <script src="assets/js/ffmpeg.min.js"></script>
  <script src="assets/js/patch.js"></script>
  <script src="assets/js/core.js"></script>
  <script src="assets/js/app.js"></script>

</body>
</html>
