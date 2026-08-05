/**
 * sw.js — Service Worker بسيط:
 * يخزّن الأصول الثابتة (Shell) مؤقتًا حتى يفتح التطبيق بسرعة ويُقبل كتطبيق (PWA) على الجوال.
 * لا يخزّن استجابات الـ API — البيانات دائمًا حية من Google Sheets.
 */
const CACHE_NAME = 'mas-shell-v1';
const SHELL_FILES = [
  './login.html',
  './css/style.css',
  './js/config.js',
  './js/api.js',
  './js/auth.js',
  './js/i18n.js',
  './js/export.js',
  './js/app.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // لا تتدخل في طلبات الـ API (Google Apps Script) — خليها دايمًا Network
  if(url.hostname.includes('script.google.com')) return;
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).catch(() => cached))
  );
});
