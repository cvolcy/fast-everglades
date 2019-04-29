importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.2.0/workbox-sw.js');

if (workbox) {
    console.log(`Yay! Workbox is loaded 🎉`);

    // cache name
    workbox.core.setCacheNameDetails({
        prefix: 'umbrella-cache',
        precache: 'precache',
        runtime: 'runtime',
    });

    workbox.routing.registerRoute(
        new RegExp('\.(css|ttf)$'),
        new workbox.strategies.CacheFirst({
            cacheName: 'umbrella-cache-Stylesheets',
            plugins: [
                new workbox.expiration.Plugin({
                    maxAgeSeconds: 60 * 60 * 24 * 7, // cache for one week
                    maxEntries: 20, // only cache 20 request
                    purgeOnQuotaError: true
                })
            ]
        })
    );

    workbox.routing.registerRoute(
        new RegExp('\.(png|svg|jpg|jpeg|ico)$'),
        new workbox.strategies.CacheFirst({
            cacheName: 'umbrella-cache-Images',
            plugins: [
                new workbox.expiration.Plugin({
                    maxAgeSeconds: 60 * 60 * 24 * 7,
                    maxEntries: 50,
                    purgeOnQuotaError: true
                })
            ]
        })
    );

    workbox.precaching.precacheAndRoute([
        './',
        './index.html',
        './manifest.json'
    ]);

} else {
    console.log(`Boo! Workbox didn't load 😬`);
}