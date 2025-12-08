// Service Worker for Link Call PWA
const CACHE_NAME = 'link-call-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/style.css',
  '/login-style.css',
  '/app.js',
  '/logo.jpg',
  'https://unpkg.com/@twilio/voice-sdk@2.11.2/dist/twilio.min.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: تثبيت...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Service Worker: ذاكرة التخزين المؤقت جاهزة');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: تفعيل...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: حذف ذاكرة قديمة:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// اعتراض الطلبات
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إرجاع من الذاكرة أو جلب من الشبكة
        return response || fetch(event.request);
      })
      .catch(() => {
        // في حالة عدم الاتصال
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// إشعارات Push (للمستقبل)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'مكالمة جديدة',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    dir: 'rtl',
    lang: 'ar'
  };

  event.waitUntil(
    self.registration.showNotification('Link Call', options)
  );
});
