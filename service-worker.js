const CACHE_NAME = "student-manager-cache-v1";
const STATIC_ASSETS = [
    "/",
    "/project_lab1/",
    "/project_lab1/index.html",
    "/project_lab1/style.css",
    "/project_lab1/script.js",
    "/project_lab1/manifest.json",
    "/project_lab1/resources/avatar.jpg",
    "/project_lab1/resources/icon-192x192.png",
    "/project_lab1/resources/icon-512x512.png",
    "/project_lab1/resources/icon-192x192.ico"
];

// API URLs that should bypass cache
const API_URLS = [
    "/project_lab1/students.php",
    "/project_lab1/check_connection.php"
];

// Підія встановлення Service Worker
// Відбувається при першому запуску або коли SW оновлюється
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Кешування статичних ресурсів...");
            // Додаємо статичні файли до кешу
            return cache.addAll(STATIC_ASSETS).catch(error => {
                console.error("Помилка кешування ресурсів:", error);
            });
        })
    );
    // Активація нового Service Worker без очікування закриття вкладок
    self.skipWaiting();
});

// Підія обробки запитів від клієнта (браузера)
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    
    // Перевіряємо, чи це запит до API
    const isApiRequest = API_URLS.some(apiUrl => url.pathname.includes(apiUrl));
    
    // Різні стратегії кешування для статичних файлів та API
    if (isApiRequest) {
        // Для API запитів: Network-first стратегія
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Не кешуємо API відповіді, лише повертаємо
                    return response;
                })
                .catch(() => {
                    // Якщо мережа недоступна, спробуємо знайти в кеші
                    return caches.match(event.request);
                })
        );
    } else {
        // Для статичних файлів: Cache-first стратегія
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    // Якщо файл в кеші, повертаємо його
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    // Інакше завантажуємо з мережі
                    return fetch(event.request)
                        .then(networkResponse => {
                            // Кешуємо новий файл
                            return caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                });
                        });
                })
        );
    }
});

// Підія активації Service Worker
// Видаляє старі кеші, які більше не використовуються
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME) // Знаходимо старі кеші
                    .map((key) => caches.delete(key))   // Видаляємо їх
            );
        }).then(() => {
            console.log("Новий Service Worker активовано.");
            return self.clients.claim(); // Переключаємо новий SW для всіх вкладок
        })
    );
});