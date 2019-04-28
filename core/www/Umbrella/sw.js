const staticAssets = [
    './',
    './css/style.css',
    './css/w3.css',
    './images/forestbridge.jpg'
];

self.addEventListener('install', async event => {
    const cache = await caches.open('static');
    cache.addAll(staticAssets);
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    if (url.origin === location.origin) {
        event.respondWith(cacheData(request));
    } else {
        event.respondWith(networkFirst(request));
    }

});

async function cacheData(request) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || fetch(request);
}

async function networkFirst(request) {
    const cache = await caches.open('dynamic');

    try {
        const response = await fetch(request);
        if (!request.url.startWith("chrome-extension://"))
            cache.put(request, response.clone());
        return response;
    } catch (error) {
        return await cache.match(request);

    }

}