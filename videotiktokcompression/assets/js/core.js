window.__patcherReady__ = Promise.resolve();

function waitForFFmpeg(timeout = 60000) {
  return new Promise((resolve, reject) => {
    if (window.FFmpeg && window.FFmpeg.createFFmpeg) return resolve(window.FFmpeg);
    const interval = 100;
    let elapsed = 0;
    const timer = setInterval(() => {
      if (window.FFmpeg && window.FFmpeg.createFFmpeg) {
        clearInterval(timer);
        resolve(window.FFmpeg);
      } else {
        elapsed += interval;
        if (elapsed >= timeout) {
          clearInterval(timer);
          reject(new Error("FFmpeg timeout after " + timeout / 1000 + " seconds."));
        }
      }
    }, interval);
  });
}

function waitForPreload(timeoutMs = 60000) {
  return new Promise((resolve) => {
    if (window.__ffmpegLoaded__ && window.__ffmpegInstance__) {
      return resolve(window.__ffmpegInstance__);
    }
    const interval = 200;
    let elapsed = 0;
    const timer = setInterval(() => {
      if (window.__ffmpegLoaded__ && window.__ffmpegInstance__) {
        clearInterval(timer);
        resolve(window.__ffmpegInstance__);
      } else if (!window.__ffmpegPreloading__ && elapsed > 2000) {
        clearInterval(timer);
        resolve(null);
      } else {
        elapsed += interval;
        if (elapsed >= timeoutMs) {
          clearInterval(timer);
          resolve(null);
        }
      }
    }, interval);
  });
}

async function getFFmpeg() {
  const preloaded = await waitForPreload(60000);
  if (preloaded && preloaded.isLoaded()) return preloaded;

  await waitForFFmpeg();

  const { createFFmpeg } = window.FFmpeg;
  const coreUrl = new URL('assets/js/ffmpeg-core.js', window.location.href).href;
  const ff = createFFmpeg({
    corePath: coreUrl,
    log: false,
    mainName: "main",
  });

  await ff.load();
  window.__ffmpegInstance__ = ff;
  window.__ffmpegLoaded__   = true;
  return ff;
}

// Preload FFmpeg as soon as the page loads
(async function preload() {
  window.__ffmpegPreloading__ = true;
  try {
    await getFFmpeg();
  } catch (e) {
    console.warn("Preload FFmpeg failed, will retry on demand:", e);
  } finally {
    window.__ffmpegPreloading__ = false;
  }
})();

async function processWithFFmpeg(file, isRotated, onProgress) {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = window.FFmpeg;

  const ext = file.name.split(".").pop().toLowerCase();
  const inputName  = "input."  + ext;
  const outputName = "output." + ext;

  ffmpeg.setProgress(({ ratio }) => {
    if (onProgress) {
      const pct = Math.min(Math.max(Math.round(ratio * 100), 0), 99);
      onProgress(pct, "Encoding");
    }
  });

  let inputBytes = await fetchFile(file);
  ffmpeg.FS("writeFile", inputName, inputBytes);
  inputBytes = null;

  if (isRotated) {
    await ffmpeg.run(
      "-i", inputName,
      "-vf", "fps=60",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", "20",
      "-c:a", "copy",
      "-movflags", "+faststart",
      outputName
    );
  } else {
    await ffmpeg.run(
      "-i", inputName,
      "-c", "copy",
      "-movflags", "+faststart",
      outputName
    );
  }

  let rawData = ffmpeg.FS("readFile", outputName);
  const isolatedBuffer = rawData.slice(0).buffer;

  try { ffmpeg.FS("unlink", inputName); } catch (_) {}
  try { ffmpeg.FS("unlink", outputName); } catch (_) {}

  rawData = null;
  return isolatedBuffer;
}
