// Service Worker for Link Call PWA
const CACHE_NAME = 'link-call-v39';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/css/style.css',
  '/css/login-style.css',
  '/js/app.js',
  '/js/protection.js',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
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
    }).then(() => {
      // إخبار جميع الصفحات المفتوحة بإعادة التحميل للحصول على الإصدار الجديد
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.navigate(client.url));
      });
    })
  );
  return self.clients.claim();
});

// اعتراض الطلبات
self.addEventListener('fetch', event => {
  // تجاهل الطلبات الخارجية (sdk.twilio.com و غيرها) لتجنب مشاكل CORS
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return; // اتركها للمتصفح مباشرة
  }

  // HTML documents: network-first (عشان دايماً نجيب أحدث index.html)
  if (event.request.destination === 'document' || event.request.headers.get('Accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // نحدّث الكاش بالنسخة الجديدة
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // باقي الملفات: cache-first
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
