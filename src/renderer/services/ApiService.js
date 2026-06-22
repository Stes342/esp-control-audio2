const PROXY_BASE_URL = 'http://localhost:3000/proxy';

function encodePathSegment(value) {
  return encodeURIComponent(String(value));
}

function deviceIp(deviceOrIp) {
  return typeof deviceOrIp === 'string' ? deviceOrIp : deviceOrIp?.ip;
}

function proxyUrl(deviceOrIp, path = '/') {
  const ip = deviceIp(deviceOrIp);
  if (!ip) throw new Error('Device IP is required');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${PROXY_BASE_URL}/${encodePathSegment(ip)}${normalizedPath}`;
}

async function request(deviceOrIp, path = '/', options = {}) {
  return fetch(proxyUrl(deviceOrIp, path), options);
}

async function readText(response) {
  return response.text();
}

async function ensureOk(response) {
  if (response.ok) return response;
  const text = await readText(response);
  throw new Error(`HTTP ${response.status}: ${text}`);
}

async function getStatus(deviceOrIp, options = {}) {
  const response = await request(deviceOrIp, '/status', options);
  await ensureOk(response);
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

async function identifyByIp(ip, options = {}) {
  return fetch(`http://${ip}/identify`, options);
}

async function setAudioUrl(deviceOrIp, url, options = {}) {
  const response = await request(deviceOrIp, `/audio/seturl?url=${encodeURIComponent(url)}`, options);
  return ensureOk(response);
}

async function sendPlaylist(deviceOrIp, urlsOrPlaylist, options = {}) {
  const urls = Array.isArray(urlsOrPlaylist) ? urlsOrPlaylist : urlsOrPlaylist?.urls;
  const returnToPrevious = Array.isArray(urlsOrPlaylist)
    ? true
    : urlsOrPlaylist?.returnToPrevious !== false;

  const response = await request(deviceOrIp, '/audio/playlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
    body: JSON.stringify({
      urls,
      returnToPrevious,
    }),
  });
  return ensureOk(response);
}

async function audioCommand(deviceOrIp, command, options = {}) {
  const response = await request(deviceOrIp, `/audio/${encodeURIComponent(command)}`, options);
  return ensureOk(response);
}

async function postForm(deviceOrIp, path, body, options = {}) {
  const response = await request(deviceOrIp, path, {
    method: 'POST',
    ...options,
    body,
  });
  return response;
}

export default {
  request,
  proxyUrl,
  readText,
  ensureOk,
  getStatus,
  identifyByIp,
  setAudioUrl,
  sendPlaylist,
  audioCommand,
  postForm,
};