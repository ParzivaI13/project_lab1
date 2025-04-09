const CACHE_NAME = "student-manager-cache-v1";
const ASSETS = [
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

// Подія встановлення Service Worker
// Відбувається при першому запуску або коли SW оновлюється
self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log("Кешування ресурсів...");// логування не обовязкове
        // Додаємо файли до кешу, якщо якийсь файл не вдасться завантажити, обробляємо помилку
        return cache.addAll(ASSETS).catch(console.error);
      })
    );
  });
  
  // Подія обробки запитів від клієнта (браузера)
  // Якщо файл є в кеші – повертаємо його, інакше робимо запит до мережі
  self.addEventListener("fetch", (event) => {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Запит до мережі, якщо ресурсу немає в кеші
        
          // Повертаємо кешовану версію, якщо вона є, інакше робимо запит до мережі
          return cachedResponse || fetch(event.request).then((networkResponse) => {
            // Зберігаємо отриманий файл у кеш для майбутніх запитів
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });;
        });
      })
    );
  });
  
  // Подія активації Service Worker
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

  // commit