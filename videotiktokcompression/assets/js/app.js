// Pipeline Controller & Video Processor (100% Standalone & Client-Side)
(function () {
  'use strict';

  const videoFileInput = document.getElementById('fileInput');
  const fileButton = document.getElementById('fileButton');
  const fileInfo = document.getElementById('fileInfo');
  const fileSizeEl = document.getElementById('fileSize');
  const fileResolutionEl = document.getElementById('fileResolution');
  const fileFpsEl = document.getElementById('fileFps');
  const processButton = document.getElementById('processBtn');
  const statusEl = document.getElementById('status');
  const customToggle1 = document.getElementById('customToggle1');
  const customToggle2 = document.getElementById('customToggle2');

  let selectedFile = null;
  let cachedMeta = null;
  let loadingElement = null;

  // Helper i18n
  function t(key, fallback) {
    if (window.i18n && typeof window.i18n.t === 'function') {
      const val = window.i18n.t(key);
      if (val && val !== key) return val;
    }
    return fallback || key;
  }

  // Persist toggles to localStorage
  if (customToggle1) {
    const saved = localStorage.getItem('hd_bypass_enabled');
    if (saved !== null) customToggle1.checked = saved === 'true';
    customToggle1.addEventListener('change', () => {
      localStorage.setItem('hd_bypass_enabled', customToggle1.checked);
    });
  }

  if (customToggle2) {
    const saved = localStorage.getItem('hd_wm_enabled');
    if (saved !== null) customToggle2.checked = saved === 'true';
    customToggle2.addEventListener('change', () => {
      localStorage.setItem('hd_wm_enabled', customToggle2.checked);
    });
  }

  function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
  }

  function createLoadingElement() {
    if (!document.getElementById('loadingStyles')) {
      const style = document.createElement('style');
      style.id = 'loadingStyles';
      style.textContent = `
        @keyframes loadingFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes loadingDotPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.25; }
        }
        @keyframes stepPing {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        #loadingContainer.show {
          display: block !important;
          animation: loadingFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .ld-step-dot.active {
          background: white !important;
          animation: stepPing 1s ease-in-out infinite !important;
        }
        .ld-step-dot.done {
          background: rgba(255,255,255,0.55) !important;
        }
      `;
      document.head.appendChild(style);
    }

    const container = document.createElement('div');
    container.id = 'loadingContainer';
    container.style.cssText = 'width:100%; margin-top:14px; display:none;';

    const card = document.createElement('div');
    card.style.cssText = `
      background: linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.025) 50%, rgba(255,255,255,0.04) 100%);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      backdrop-filter: blur(24px) saturate(1.4);
      -webkit-backdrop-filter: blur(24px) saturate(1.4);
      padding: 18px 20px 20px;
      position: relative;
      overflow: hidden;
    `;

    const glowLine = document.createElement('div');
    glowLine.style.cssText = 'position:absolute; top:0; left:10%; right:10%; height:1px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); pointer-events:none;';
    card.appendChild(glowLine);

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:center; gap:10px; margin-bottom:16px; position:relative; z-index:1;';

    const dot = document.createElement('div');
    dot.style.cssText = 'width:6px; height:6px; background:white; border-radius:50%; flex-shrink:0; animation:loadingDotPulse 1.1s ease-in-out infinite;';

    const text = document.createElement('div');
    text.id = 'loadingText';
    text.style.cssText = "font-family:'DM Sans',sans-serif; font-size:0.82rem; font-weight:600; color:rgba(255,255,255,0.75); letter-spacing:0.3px; flex:1;";
    text.textContent = t('btn_processing', 'Processing...');

    const percent = document.createElement('div');
    percent.id = 'loadingPercent';
    percent.style.cssText = "font-family:'DM Sans',sans-serif; font-size:0.8rem; font-weight:700; color:rgba(255,255,255,0.45); letter-spacing:0.5px; flex-shrink:0; transition:color 0.3s ease;";
    percent.textContent = '0%';

    header.appendChild(dot);
    header.appendChild(text);
    header.appendChild(percent);

    const steps = [
      { key: 'load', label: t('step_load', 'Load') },
      { key: 'read', label: t('step_read', 'Read') },
      { key: 'convert', label: t('step_convert', 'Convert') },
      { key: 'bypass', label: t('step_bypass', 'Bypass') }
    ];

    const stepsWrap = document.createElement('div');
    stepsWrap.style.cssText = 'display:flex; align-items:center; justify-content:center; position:relative; z-index:1; width:100%;';

    steps.forEach((step, idx) => {
      const stepItem = document.createElement('div');
      stepItem.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:5px;';

      const dotEl = document.createElement('div');
      dotEl.className = 'ld-step-dot';
      dotEl.dataset.step = step.key;
      dotEl.style.cssText = `
        width:10px; height:10px; border-radius:50%;
        background:#111; border:1px solid rgba(255,255,255,0.2);
        transition:all 0.4s cubic-bezier(0.16,1,0.3,1);
        flex-shrink:0; position:relative; z-index:2;
      `;

      const labelEl = document.createElement('div');
      labelEl.className = 'ld-step-label';
      labelEl.dataset.step = step.key;
      labelEl.style.cssText = `
        font-family:'DM Sans',sans-serif; font-size:0.62rem; font-weight:700;
        letter-spacing:0.8px; text-transform:uppercase; color:rgba(255,255,255,0.2);
        transition:color 0.4s ease;
      `;
      labelEl.textContent = step.label;

      stepItem.appendChild(dotEl);
      stepItem.appendChild(labelEl);
      stepsWrap.appendChild(stepItem);

      if (idx < steps.length - 1) {
        const seg = document.createElement('div');
        seg.className = 'ld-connector-seg';
        seg.dataset.index = idx;
        seg.style.cssText = 'flex:1; height:1px; background:rgba(255,255,255,0.1); transition:background 0.5s ease; margin-bottom:15px;';
        stepsWrap.appendChild(seg);
      }
    });

    card.appendChild(header);
    card.appendChild(stepsWrap);
    container.appendChild(card);
    return container;
  }

  const stepMap = {
    'Loading System': 'load',
    'Starting...': 'load',
    'Starting': 'load',
    'Reading File': 'read',
    'Read': 'read',
    'Load Converting': 'convert',
    'Encording': 'convert',
    'Encoding': 'convert',
    'Convert': 'convert',
    'Processing...': 'convert',
    'Bypass Processing': 'bypass',
    'Bypass': 'bypass',
    'Complete': 'complete'
  };
  const stepOrder = ['load', 'read', 'convert', 'bypass', 'complete'];

  function updateLoadingProgress(pct, statusText) {
    if (!loadingElement) return;
    const clamped = Math.min(Math.max(Math.round(pct), 0), 100);

    const textEl = loadingElement.querySelector('#loadingText');
    const pctEl = loadingElement.querySelector('#loadingPercent');

    if (textEl) textEl.textContent = statusText || t('btn_processing', 'Processing...');
    if (pctEl) {
      pctEl.textContent = clamped + '%';
      pctEl.style.color = clamped >= 90 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)';
    }

    const currentKey = stepMap[statusText] || null;
    const currentIdx = currentKey ? stepOrder.indexOf(currentKey) : -1;

    loadingElement.querySelectorAll('.ld-step-dot').forEach((dotEl, i) => {
      const stepKey = dotEl.dataset.step;
      const label = loadingElement.querySelector(`.ld-step-label[data-step="${stepKey}"]`);
      dotEl.classList.remove('active', 'done');

      if (i < currentIdx) {
        dotEl.classList.add('done');
        if (label) label.style.color = 'rgba(255,255,255,0.4)';
      } else if (i === currentIdx) {
        dotEl.classList.add('active');
        if (label) label.style.color = '#fff';
      } else {
        if (label) label.style.color = 'rgba(255,255,255,0.2)';
      }
    });

    loadingElement.querySelectorAll('.ld-connector-seg').forEach(seg => {
      const segIdx = parseInt(seg.dataset.index);
      seg.style.background = segIdx < currentIdx ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)';
    });
  }

  function showLoading() {
    if (!loadingElement) {
      loadingElement = createLoadingElement();
      processButton.parentNode.insertBefore(loadingElement, statusEl);
    }
    loadingElement.classList.add('show');
    updateLoadingProgress(0, t('btn_processing', 'Processing...'));
  }

  function hideLoading() {
    if (!loadingElement) return;
    loadingElement.style.opacity = '0';
    loadingElement.style.transform = 'translateY(6px)';
    setTimeout(() => {
      if (loadingElement) {
        loadingElement.classList.remove('show');
        loadingElement.style.display = 'none';
        loadingElement.style.opacity = '';
        loadingElement.style.transform = '';
      }
    }, 300);
  }

  function setStatusWithEffect(html, type) {
    statusEl.innerHTML = html;
    statusEl.className = type || '';
  }

  function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // File selection
  videoFileInput.addEventListener('change', handleFileSelect);

  fileButton.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileButton.style.borderColor = 'rgba(255,255,255,0.3)';
    fileButton.style.background = 'rgba(255,255,255,0.06)';
  });

  fileButton.addEventListener('dragleave', () => {
    fileButton.style.borderColor = '';
    fileButton.style.background = '';
  });

  fileButton.addEventListener('drop', (e) => {
    e.preventDefault();
    fileButton.style.borderColor = '';
    fileButton.style.background = '';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      videoFileInput.files = files;
      handleFileSelect();
    }
  });

  async function handleFileSelect() {
    const file = videoFileInput.files[0];
    if (!file) return;

    selectedFile = file;
    fileSizeEl.textContent = formatFileSize(file.size);

    const warnOversized = t('warn_oversized', '⚠ Not Recommended (>1080p)');
    const warnHighFps = t('warn_highfps', '⚠ Not Recommended (>60 FPS)');

    const warnBadge = (text) => `
      <span style="
        display:inline-flex; align-items:center; gap:4px;
        margin-left:8px; padding:2px 8px;
        background:rgba(255,50,50,0.12);
        border:1px solid rgba(255,60,60,0.35);
        border-radius:20px;
        font-size:0.7rem; font-weight:700;
        color:rgba(255,60,60,0.95);
        letter-spacing:0.3px; vertical-align:middle;
      ">${text}</span>
    `;

    let metaWidth = 0, metaHeight = 0, metaFps = 30, metaRotated = false;

    try {
      const { width, height } = await getVideoResolution(file);
      metaWidth = width; metaHeight = height;
      const isOversized = Math.max(width, height) > 1920 || Math.min(width, height) > 1080;
      fileResolutionEl.innerHTML = width + ' × ' + height + (isOversized ? warnBadge(warnOversized) : '');
    } catch (_) {
      fileResolutionEl.textContent = 'Auto';
    }

    if (fileFpsEl) {
      fileFpsEl.textContent = 'Reading...';
      try {
        const fps = await readFPS(file);
        metaFps = fps !== null ? fps : 30;
        const isHighFps = fps !== null && fps > 60;
        fileFpsEl.innerHTML = fps !== null ? fps + ' FPS' + (isHighFps ? warnBadge(warnHighFps) : '') : 'Auto';
      } catch (err) {
        console.warn('readFPS error:', err);
        fileFpsEl.textContent = 'Auto';
      }
    }

    try {
      const rotation = await window.VideoReader?.getRotationDegrees(file);
      metaRotated = rotation === 90 || rotation === 270;
    } catch (_) {}

    cachedMeta = { width: metaWidth, height: metaHeight, fps: metaFps, isRotated: metaRotated };

    fileInfo.classList.add('show');
    processButton.disabled = false;

    const label = fileButton.querySelector('.file-drop-label');
    if (label) label.textContent = t('upload_zone_replace', 'Selected file — click to replace');
  }

  // Processing Click Event
  processButton.addEventListener('click', async () => {
    if (!selectedFile) return;

    try {
      processButton.disabled = true;
      processButton.classList.add('processing');
      statusEl.innerHTML = '';
      showLoading();
      await sleep(100);

      updateLoadingProgress(10, 'Loading System');
      await sleep(100);

      updateLoadingProgress(20, 'Reading File');
      await sleep(150);

      // Cek Resolusi (gunakan cachedMeta jika ada)
      const width = cachedMeta?.width || 0;
      const height = cachedMeta?.height || 0;
      if (width > 0 && height > 0) {
        if (Math.max(width, height) > 1920 || Math.min(width, height) > 1080) {
          hideLoading();
          throw new Error(t('err_max_res', 'Hanya mendukung resolusi maksimal 1080p!'));
        }
      }

      // Cek FPS
      const fps = cachedMeta?.fps || null;
      if (fps !== null && fps > 60) {
        hideLoading();
        throw new Error(t('err_max_fps', 'Hanya mendukung video maksimal 60 FPS!'));
      }

      const isRotated = cachedMeta ? cachedMeta.isRotated : false;

      // Jalankan FFmpeg WASM - segera pindah ke Convert
      updateLoadingProgress(30, 'Load Converting');
      const outputBuffer = await processWithFFmpeg(selectedFile, isRotated, (pct, status) => {
        const stepProgress = Math.min(30 + Math.round(pct * 0.55), 85);
        updateLoadingProgress(stepProgress, status || 'Encoding');
      });

      let finalBytes = outputBuffer;

      // Jalankan ISO MP4 Box Metadata Patcher jika Bypass diaktifkan
      const isBypassEnabled = !customToggle1 || customToggle1.checked;
      if (isBypassEnabled && typeof window.V7Patch === 'function') {
        updateLoadingProgress(88, 'Bypass Processing');
        try {
          const intermediateFile = new File([outputBuffer], selectedFile.name, { type: selectedFile.type });
          const patchedFile = await window.V7Patch(intermediateFile);
          finalBytes = new Uint8Array(await patchedFile.arrayBuffer());
        } catch (patchErr) {
          console.warn('V7Patch error:', patchErr);
        }
      }

      updateLoadingProgress(95, 'Bypass Processing');
      await sleep(400);

      const finalBlob = new Blob([finalBytes], { type: selectedFile.type });
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      const ext = selectedFile.name.split('.').pop();
      const outputFilename = `${baseName}_TikTokHD.${ext}`;

      updateLoadingProgress(100, 'Complete');
      await sleep(600);

      downloadFile(finalBlob, outputFilename);
      hideLoading();

      processButton.classList.remove('processing');
      setStatusWithEffect(`
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;">
          <polyline points="20 6 9 17 4 12"/>
        </svg> ${t('success_done', 'Done! Video optimized & downloaded successfully.')}
      `, 'success');

      setTimeout(() => {
        processButton.disabled = false;
        const btnText = processButton.querySelector('span');
        if (btnText) btnText.textContent = t('btn_start', 'Mulai Proses Video');
      }, 2000);

    } catch (err) {
      console.error('Processing error:', err);
      hideLoading();
      processButton.classList.remove('processing');
      processButton.disabled = false;

      setStatusWithEffect(`
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,80,80,0.9)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg> Error: ${err.message}
      `, 'error');
    }
  });

  // Listen to language change to update UI elements
  document.addEventListener('languagechange', () => {
    const btnText = processButton.querySelector('span');
    if (btnText && !processButton.classList.contains('processing')) {
      btnText.textContent = t('btn_start', 'Mulai Proses Video');
    }
    if (selectedFile) {
      const label = fileButton.querySelector('.file-drop-label');
      if (label) label.textContent = t('upload_zone_replace', 'Selected file — click to replace');
    }
  });

})();
