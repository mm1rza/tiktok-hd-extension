window.__patcherReady__ = Promise.resolve();

let ffmpegInstance = null;
let ffmpegLoadingPromise = null;

function waitForFFmpeg(timeout = 30000) {
  return new Promise((resolve, reject) => {
    if (window.FFmpeg && window.FFmpeg.createFFmpeg) return resolve(window.FFmpeg);
    const interval = 50;
    let elapsed = 0;
    const timer = setInterval(() => {
      if (window.FFmpeg && window.FFmpeg.createFFmpeg) {
        clearInterval(timer);
        resolve(window.FFmpeg);
      } else {
        elapsed += interval;
        if (elapsed >= timeout) {
          clearInterval(timer);
          reject(new Error("FFmpeg library timeout"));
        }
      }
    }, interval);
  });
}

async function getFFmpeg() {
  if (ffmpegInstance && ffmpegInstance.isLoaded()) {
    return ffmpegInstance;
  }
  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }

  ffmpegLoadingPromise = (async () => {
    await waitForFFmpeg();
    const { createFFmpeg } = window.FFmpeg;
    const coreUrl = new URL('assets/js/ffmpeg-core.js', window.location.href).href;
    const ff = createFFmpeg({
      corePath: coreUrl,
      log: false,
      mainName: "main",
    });

    await ff.load();
    ffmpegInstance = ff;
    window.__ffmpegInstance__ = ff;
    window.__ffmpegLoaded__   = true;
    return ff;
  })().catch(err => {
    ffmpegLoadingPromise = null;
    throw err;
  });

  return ffmpegLoadingPromise;
}

// Background preload immediately on page load
getFFmpeg().catch(e => {
  console.warn("Background preload notice:", e?.message);
});

async function processWithFFmpeg(file, isRotated, onProgress) {
  if (onProgress) onProgress(25, "Load Converting");

  const ffmpeg = await getFFmpeg();
  const { fetchFile } = window.FFmpeg;

  if (onProgress) onProgress(35, "Load Converting");

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

  if (onProgress) onProgress(45, "Encoding");

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

  if (onProgress) onProgress(80, "Encoding");

  let rawData = ffmpeg.FS("readFile", outputName);
  const isolatedBuffer = rawData.slice(0).buffer;

  try { ffmpeg.FS("unlink", inputName); } catch (_) {}
  try { ffmpeg.FS("unlink", outputName); } catch (_) {}

  rawData = null;
  return isolatedBuffer;
}
