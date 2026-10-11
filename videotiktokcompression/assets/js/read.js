function getVideoResolution(file, options = {}) {
  const { timeoutMs = 10000 } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    let settled = false;
    let timeoutId = null;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onloadeddata = null;
      video.onerror = null;
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(objectUrl);
      if (timeoutId) clearTimeout(timeoutId);
    };

    const finish = (result) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const fail = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const tryResolve = () => {
      const { videoWidth: width, videoHeight: height } = video;
      if (width > 0 && height > 0) {
        finish({
          width,
          height,
          duration: isFinite(video.duration) ? video.duration : null,
        });
        return true;
      }
      return false;
    };

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      if (!tryResolve()) {
        video.onloadeddata = () => {
          if (!tryResolve()) {
            fail(new Error('unknown'));
          }
        };
      }
    };

    video.onerror = () => {
      const code = video.error ? video.error.code : 'unknown';
      const msg = video.error ? video.error.message : '';
      fail(new Error(`Read Metadata Failed (code: ${code}) ${msg}`));
    };

    timeoutId = setTimeout(() => {
      fail(new Error('Format not supported'));
    }, timeoutMs);

    video.src = objectUrl;
    video.load();
  });
}

function u32(b, o) {
  if (o + 4 > b.length) return 0;
  return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
}

function i32(b, o) {
  return u32(b, o) | 0;
}

function toStr(b, s, e) {
  let r = '';
  for (let i = s; i < Math.min(e, b.length); i++) r += String.fromCharCode(b[i]);
  return r;
}

const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'dinf', 'udta', 'meta', 'ilst']);

function parseBoxes(b, start, end) {
  const boxes = [];
  let pos = start;
  while (pos + 8 <= end) {
    let size = u32(b, pos);
    if (size === 1) {
      if (pos + 16 > end) break;
      size = u32(b, pos + 8) * 4294967296 + u32(b, pos + 12);
    }
    if (size === 0) size = end - pos;
    if (size < 8) break;

    const actualEnd = Math.min(pos + size, end);
    const type = toStr(b, pos + 4, pos + 8);
    const headerSize = u32(b, pos) === 1 ? 16 : 8;
    const obj = { type, start: pos, end: actualEnd, header: headerSize, children: null };
    
    let contentStart = pos + headerSize;
    if (type === 'meta' && contentStart + 4 <= actualEnd) contentStart += 4;
    
    if (CONTAINERS.has(type) && contentStart < actualEnd) {
      obj.children = parseBoxes(b, contentStart, actualEnd);
    }
    boxes.push(obj);
    pos += size;
  }
  return boxes;
}

function findChild(box, type) { return (box.children || []).find(c => c.type === type); }

function childPath(box, path) {
  let cur = box;
  for (const t of path) { cur = findChild(cur, t); if (!cur) return null; }
  return cur;
}

function payload(b, box) { return b.subarray(box.start + box.header, box.end); }

function isVideoTrak(b, trak) {
  const hdlr = childPath(trak, ['mdia', 'hdlr']);
  return Boolean(hdlr && toStr(payload(b, hdlr), 8, 12) === 'vide');
}

function walkTopLevel(buf, end) {
  const boxes = [];
  let pos = 0;
  while (pos + 8 <= end) {
    let size = u32(buf, pos);
    let header = 8;
    if (size === 1) {
      if (pos + 16 > end) break;
      size = u32(buf, pos + 8) * 4294967296 + u32(buf, pos + 12);
      header = 16;
    }
    const type = toStr(buf, pos + 4, pos + 8);
    if (size === 0) {
      boxes.push({ type, start: pos, size: null, header });
      break;
    }
    if (size < 8) break;
    boxes.push({ type, start: pos, size, header });
    pos += size;
  }
  return boxes;
}

async function readFPS(file) {
  const HEAD = Math.min(file.size, 8 * 1024 * 1024);
  let headBuf;
  try { headBuf = await file.slice(0, HEAD).arrayBuffer(); } catch (_) { return null; }

  function extractFPS(buf, moovStart) {
    const size = u32(buf, moovStart);
    const moovEnd = size === 0 ? buf.length : Math.min(moovStart + size, buf.length);
    const header = size === 1 ? 16 : 8;
    const children = parseBoxes(buf, moovStart + header, moovEnd);

    const trakBoxes = children.filter(b => b.type === 'trak');
    const videoTrak = trakBoxes.find(t => isVideoTrak(buf, t));
    if (!videoTrak) return null;

    const mdhdBox = childPath(videoTrak, ['mdia', 'mdhd']);
    if (!mdhdBox) return null;
    const mdhdPayload = payload(buf, mdhdBox);
    const version = mdhdPayload[0];
    const timescale = version === 0 ? u32(mdhdPayload, 12) : u32(mdhdPayload, 20);

    const sttsBox = childPath(videoTrak, ['mdia', 'minf', 'stbl', 'stts']);
    if (!sttsBox) return null;
    const sttsPayload = payload(buf, sttsBox);
    
    const entryCount = u32(sttsPayload, 4);
    let totalFrames = 0;
    let totalDuration = 0;
    
    for (let i = 0; i < entryCount; i++) {
      const offset = 8 + (i * 8);
      if (offset + 8 > sttsPayload.length) break;
      const sampleCount = u32(sttsPayload, offset);
      const sampleDelta = u32(sttsPayload, offset + 4);
      totalFrames += sampleCount;
      totalDuration += (sampleCount * sampleDelta);
    }

    if (totalFrames > 0 && totalDuration > 0 && timescale > 0) {
      const rawFps = totalFrames / (totalDuration / timescale);
      const commonFps = [24, 25, 30, 48, 50, 60, 90, 120, 144, 240];
      const nearest = commonFps.find(f => Math.abs(rawFps - f) < 2);
      return nearest !== undefined ? nearest : Math.round(rawFps);
    }
    return null;
  }

  const head = new Uint8Array(headBuf);
  const topBoxes = walkTopLevel(head, head.length);
  const moovInHead = topBoxes.find(b => b.type === 'moov');
  if (moovInHead) return extractFPS(head, moovInHead.start);

  const lastFullyWalked = topBoxes.length > 0 && topBoxes[topBoxes.length - 1].size !== null
    ? topBoxes[topBoxes.length - 1] : null;
  if (!lastFullyWalked) return null;

  let currentOffset = lastFullyWalked.start + lastFullyWalked.size;
  let moovStart = null;
  let moovSize = null;

  while (currentOffset + 8 <= file.size) {
    let probeBuf;
    try { probeBuf = new Uint8Array(await file.slice(currentOffset, currentOffset + 16).arrayBuffer()); } catch (_) { break; }
    if (probeBuf.length < 8) break;

    let pSize = u32(probeBuf, 0);
    const pType = toStr(probeBuf, 4, 8);
    if (pSize === 1 && probeBuf.length >= 16) pSize = u32(probeBuf, 8) * 4294967296 + u32(probeBuf, 12);
    if (pSize === 0) pSize = file.size - currentOffset;
    if (pSize < 8) break;

    if (pType === 'moov') {
      moovStart = currentOffset;
      moovSize = pSize;
      break;
    }
    currentOffset += pSize;
  }

  if (!moovStart) return null;

  const MAX_MOOV = 32 * 1024 * 1024; 
  const fetchSize = Math.min(moovSize, MAX_MOOV, file.size - moovStart);
  if (fetchSize < 8) return null;

  try {
    const moovBuf = new Uint8Array(await file.slice(moovStart, moovStart + fetchSize).arrayBuffer());
    return extractFPS(moovBuf, 0);
  } catch (_) { return null; }
}

async function getRotationDegrees(file) {
  const HEAD = Math.min(file.size, 8 * 1024 * 1024);
  let headBuf;
  try { headBuf = await file.slice(0, HEAD).arrayBuffer(); } catch (_) { return null; }

  function matrixToDegrees(p, version) {
    const base = version === 1
      ? 4 + 8 + 8 + 4 + 4 + 8 + 8 + 2 + 2 + 2 + 2
      : 4 + 4 + 4 + 4 + 4 + 4 + 8 + 2 + 2 + 2 + 2;
      
    if (base + 36 > p.length) return 0;
    const a = i32(p, base), b = i32(p, base + 4), c = i32(p, base + 12), d = i32(p, base + 16);
    const FP = 65536;
    const sign = v => (v > 0 ? 1 : v < 0 ? -1 : 0);
    const aZero = Math.abs(a) < FP / 2, dZero = Math.abs(d) < FP / 2;
    const bZero = Math.abs(b) < FP / 2, cZero = Math.abs(c) < FP / 2;

    if (!aZero && !dZero && bZero && cZero) return (sign(a) > 0 && sign(d) > 0) ? 0 : 180;
    if (aZero && dZero && !bZero && !cZero) return (sign(b) > 0 && sign(c) < 0) ? 90 : 270;
    return 0;
  }

  function readRotationFromMoov(buf, moovStart) {
    const size = u32(buf, moovStart);
    const moovEnd = size === 0 ? buf.length : Math.min(moovStart + size, buf.length);
    const header = size === 1 ? 16 : 8;
    const children = parseBoxes(buf, moovStart + header, moovEnd);

    const trakBoxes = children.filter(b => b.type === 'trak');
    const videoTrak = trakBoxes.find(t => isVideoTrak(buf, t));
    if (!videoTrak) return null;

    const tkhdBox = findChild(videoTrak, 'tkhd');
    if (!tkhdBox) return null;

    const p = payload(buf, tkhdBox);
    const version = p[0];
    return matrixToDegrees(p, version);
  }

  const head = new Uint8Array(headBuf);
  const topBoxes = walkTopLevel(head, head.length);
  const moovInHead = topBoxes.find(b => b.type === 'moov');
  if (moovInHead) return readRotationFromMoov(head, moovInHead.start);

  const lastFullyWalked = topBoxes.length > 0 && topBoxes[topBoxes.length - 1].size !== null
    ? topBoxes[topBoxes.length - 1] : null;
  if (!lastFullyWalked) return null;

  let currentOffset = lastFullyWalked.start + lastFullyWalked.size;
  let moovStart = null;
  let moovSize = null;

  while (currentOffset + 8 <= file.size) {
    let probeBuf;
    try { probeBuf = new Uint8Array(await file.slice(currentOffset, currentOffset + 16).arrayBuffer()); } catch (_) { break; }
    if (probeBuf.length < 8) break;

    let pSize = u32(probeBuf, 0);
    const pType = toStr(probeBuf, 4, 8);
    if (pSize === 1 && probeBuf.length >= 16) pSize = u32(probeBuf, 8) * 4294967296 + u32(probeBuf, 12);
    if (pSize === 0) pSize = file.size - currentOffset;
    if (pSize < 8) break;

    if (pType === 'moov') {
      moovStart = currentOffset;
      moovSize = pSize;
      break;
    }
    currentOffset += pSize;
  }

  if (!moovStart) return null;

  const MAX_MOOV = 32 * 1024 * 1024;
  const fetchSize = Math.min(moovSize, MAX_MOOV, file.size - moovStart);
  if (fetchSize < 8) return null;

  try {
    const moovBuf = new Uint8Array(await file.slice(moovStart, moovStart + fetchSize).arrayBuffer());
    return readRotationFromMoov(moovBuf, 0);
  } catch (_) { return null; }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k     = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i     = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

window.VideoReader = { getVideoResolution, readFPS, getRotationDegrees, formatFileSize };
