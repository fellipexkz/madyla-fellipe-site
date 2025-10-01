const CACHE_VERSION = 'madyla-fellipe-v1.0.0';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_IMAGES = `${CACHE_VERSION}-images`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/src/css/styles.css',
    '/src/js/script.js',
    '/assets/fonts/inter-v20-latin-regular.woff2',
    '/assets/fonts/inter-v20-latin-500.woff2',
    '/assets/fonts/inter-v20-latin-600.woff2',
    '/assets/fonts/inter-v20-latin-700.woff2',
    '/assets/icons/favicon.svg',
    '/assets/icons/play.svg',
    '/assets/icons/pause.svg',
    '/assets/audio/amor-dos-deuses.mp3',
    '/assets/images/mapa-estrelas.webp',
    '/assets/images/pedido-namoro.webp',
    '/src/data/vertical-images.json',
    '/src/data/horizontal-images.json'
];

const MAX_CACHE_SIZE = 100;
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;

self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_STATIC).then((cache) => {
            console.log('[SW] Cacheando assets estáticos');
            return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
        }).then(() => {
            console.log('[SW] Assets estáticos cacheados com sucesso');
            return self.skipWaiting();
        }).catch((error) => {
            console.error('[SW] Erro ao cachear assets:', error);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Ativando Service Worker...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName.startsWith('madyla-fellipe-') && cacheName !== CACHE_STATIC && cacheName !== CACHE_IMAGES && cacheName !== CACHE_DYNAMIC)
                    .map(cacheName => {
                        console.log('[SW] Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        }).then(() => {
            console.log('[SW] Service Worker ativado');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (url.origin !== location.origin && !url.hostname.includes('cdn.jsdelivr.net')) {
        return;
    }

    if (url.pathname.includes('/assets/images/carousel/')) {
        event.respondWith(cacheFirstStrategy(request, CACHE_IMAGES));
        return;
    }

    if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
        event.respondWith(cacheFirstStrategy(request, CACHE_STATIC));
        return;
    }

    event.respondWith(networkFirstStrategy(request, CACHE_DYNAMIC));
});

async function cacheFirstStrategy(request, cacheName) {
    try {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            updateCacheInBackground(request, cacheName);
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        
        if (networkResponse.ok && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
            await limitCacheSize(cacheName, MAX_CACHE_SIZE);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Erro na estratégia Cache First:', error);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }
        
        throw error;
    }
}

async function networkFirstStrategy(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
            await limitCacheSize(cacheName, MAX_CACHE_SIZE);
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('[SW] Network falhou, tentando cache:', error);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

async function updateCacheInBackground(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            await cache.put(request, networkResponse);
        }
    } catch (error) {
        console.debug('[SW] Falha ao atualizar cache em segundo plano');
    }
}

async function limitCacheSize(cacheName, maxSize) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxSize) {
        console.log(`[SW] Limpando cache ${cacheName}: ${keys.length} > ${maxSize}`);
        const keysToDelete = keys.slice(0, keys.length - maxSize);
        await Promise.all(keysToDelete.map(key => cache.delete(key)));
    }
}

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_OLD_CACHE') {
        event.waitUntil(clearOldCache());
    }
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

async function clearOldCache() {
    const now = Date.now();
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            const dateHeader = response.headers.get('date');
            
            if (dateHeader) {
                const cacheDate = new Date(dateHeader).getTime();
                
                if (now - cacheDate > MAX_CACHE_AGE) {
                    console.log('[SW] Removendo entrada antiga do cache:', request.url);
                    await cache.delete(request);
                }
            }
        }
    }
}

console.log('[SW] Service Worker carregado');
