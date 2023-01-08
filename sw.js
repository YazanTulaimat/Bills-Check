self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('fox-store').then((cache) =>
            cache.addAll([
                // 'css/filepond-plugin-image-preview.css',
                // 'css/filepond-plugin-image-preview.min.css',
                // 'css/filepond.css',
                // 'css/filepond.min.css',
                // 'css/ionic.bundle.css',
                // 'css/style-beta.min.css',
                // 'css/style.css',
                'index.html',
                // 'js/filepond-plugin-file-validate-type.min.js',
                // 'js/filepond-plugin-image-preview.min.js',
                // 'js/filepond.min.js',
                // 'js/ionic.esm.js',
                // 'js/ionic.js',
                // 'js/main-beta.min.js',
                // 'js/main.js',
                // 'js/qr-scanner-worker.min.js',
                // 'js/qr-scanner.min.js',
            ])
        )
    );
});

self.addEventListener('fetch', (e) => {
    console.log(e.request.url);
    e.respondWith(caches.match(e.request).then((response) => response || fetch(e.request)));
});
