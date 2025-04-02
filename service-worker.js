const CACHE_NAME = "student-manager-cache-v1";
const FILES_TO_CACHE = [
    "/project_lab1/",
    "/project_lab1/index.html",
    "/project_lab1/style.css",
    "/project_lab1/script.js",
    "/project_lab1/manifest.json",
    "/project_lab1/resources/avatar.jpg",
    "/project_lab1/resources/icon-192x192.png",
    "/project_lab1/resources/icon-512x512.png"
];

// Інсталяція Service Worker
self.addEventListener("install", (event) => {
    console.log("Service Worker installing...");
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log("Caching files:", FILES_TO_CACHE);
                return cache.addAll(FILES_TO_CACHE);
            })
            .catch((error) => console.error("Cache addAll failed:", error))
    );
});

// Перехоплення запитів
self.addEventListener("fetch", (event) => {
    console.log("Fetching:", event.request.url);
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// Оновлення Service Worker
self.addEventListener("activate", (event) => {
    console.log("Activating new Service Worker...");
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});