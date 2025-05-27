// Утилітарні функції
const Utils = {
  getCurrentUser() {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser"));
      return userData && userData.id && userData.firstName && userData.lastName
        ? {
            id: String(userData.id),
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: `${userData.firstName} ${userData.lastName}`,
          }
        : null;
    } catch (error) {
      console.error("❌ Помилка завантаження даних користувача:", error);
      return null;
    }
  },

  checkAuth() {
    return (
      localStorage.getItem("isLoggedIn") === "true" && Utils.getCurrentUser()
    );
  },

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "щойно";
    if (diffMins < 60) return `${diffMins} хв тому`;
    if (diffHours < 24) return `${diffHours} год тому`;
    if (diffDays < 7) return `${diffDays} дн тому`;
    return date.toLocaleDateString("uk-UA");
  },

  getInitials(name) {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  },

  showError(message, container = ".chat-container") {
    console.error("❌", message);
    const containerEl = document.querySelector(container);
    if (!containerEl) return;

    let errorDiv = containerEl.querySelector(".chat-error");
    if (!errorDiv) {
      errorDiv = document.createElement("div");
      errorDiv.className = "chat-error";
      errorDiv.style.cssText =
        "background: #ff6b6b; color: white; padding: 10px; margin: 10px 0; border-radius: 5px; text-align: center;";
      containerEl.appendChild(errorDiv);
    }

    errorDiv.textContent = message;
    setTimeout(() => errorDiv?.remove(), 5000);
  },
};

// Менеджер для роботи з повідомленнями
class MessageManager {
  constructor() {
    this.unreadMessages = this.loadUnreadMessages();
  }

  loadUnreadMessages() {
    try {
      const saved = localStorage.getItem("unreadMessages");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveUnreadMessages() {
    localStorage.setItem("unreadMessages", JSON.stringify(this.unreadMessages));
  }

  addUnreadMessage(message) {
    this.unreadMessages.unshift({
      ...message,
      isRead: false,
      receivedAt: new Date(),
    });

    if (this.unreadMessages.length > 50) {
      this.unreadMessages = this.unreadMessages.slice(0, 50);
    }
    this.saveUnreadMessages();
  }

  markAsRead(messageId) {
    const message = this.unreadMessages.find((m) => m._id === messageId);
    if (message) {
      message.isRead = true;
      this.saveUnreadMessages();
    }
  }

  getUnreadCount() {
    return this.unreadMessages.filter((m) => !m.isRead).length;
  }
}

// Менеджер сокет-з'єднання
class SocketManager {
  constructor(url = "http://localhost:3001") {
    this.url = url;
    this.socket = null;
    this.isConnected = false;
    this.callbacks = {};
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.url, {
          transports: ["websocket", "polling"],
        });

        this.socket.on("connect", () => {
          console.log("✅ Підключено до чат-сервера");
          this.isConnected = true;
          resolve(true);
        });

        this.socket.on("disconnect", () => {
          console.log("❌ З'єднання з чат-сервером втрачено");
          this.isConnected = false;
        });

        this.socket.on("connect_error", (error) => {
          console.error("❌ Помилка підключення:", error);
          this.isConnected = false;
          reject(error);
        });

        // Реєструємо стандартні події
        ["receive_message", "message_sent", "error"].forEach((event) => {
          this.socket.on(event, (data) => {
            this.callbacks[event]?.forEach((callback) => callback(data));
          });
        });
      } catch (error) {
        console.error("❌ Помилка ініціалізації Socket.IO:", error);
        this.isConnected = false;
        reject(error);
      }
    });
  }

  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  joinRoom(roomId) {
    this.emit("join_user_room", roomId);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

// Менеджер UI компонентів
class UIManager {
  static updateButton(button, enabled, tooltip = "") {
    if (!button) return;

    button.disabled = !enabled;
    button.style.opacity = enabled ? "1" : "0.5";
    button.style.cursor = enabled ? "pointer" : "not-allowed";
    button.title = tooltip;
  }

  static updateBellIndicator(unreadCount) {
    const bell = document.querySelector(".bell");
    const badge = document.querySelector(".notification-badge");

    if (bell && unreadCount > 0) {
      bell.classList.add("shake");
      setTimeout(() => bell.classList.remove("shake"), 600);
    }

    if (badge) {
      if (unreadCount > 0) {
        badge.style.display = "block";
        badge.textContent = unreadCount > 99 ? "99+" : unreadCount.toString();
      } else {
        badge.style.display = "none";
      }
    }
  }

  static showConnectionStatus(container, connected) {
    let statusElement = container.querySelector(".connection-status");

    if (!statusElement) {
      statusElement = document.createElement("div");
      statusElement.className = "connection-status";
      statusElement.style.cssText =
        "padding: 5px; text-align: center; font-size: 12px;";
      container.appendChild(statusElement);
    }

    statusElement.textContent = connected ? "🟢 Підключено" : "🔴 Відключено";
    statusElement.style.color = connected ? "green" : "red";
  }

  static showAuthMessage(container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #666;">
        <h3>Для використання чату необхідно авторизуватися</h3>
        <button onclick="document.getElementById('login-modal').style.display = 'flex'" 
                style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Увійти
        </button>
      </div>
    `;
  }
}

class ChatManager {
  constructor() {
    console.log("🔧 Ініціалізація ChatManager...");

    this.currentUser = null;
    this.selectedRecipient = null;
    this.selectedRecipientName = "";
    this.socketManager = new SocketManager();
    this.messageManager = new MessageManager();

    if (!this.initializeUser()) {
      this.showAuthMessage();
      return;
    }

    this.initializeChat();
  }

  initializeUser() {
    if (!Utils.checkAuth()) {
      console.log("❌ Чат недоступний: користувач не авторизований");
      return false;
    }

    this.currentUser = Utils.getCurrentUser();
    if (!this.currentUser) {
      console.log("❌ Не вдалося завантажити дані користувача");
      return false;
    }

    console.log("👤 Поточний користувач завантажено:", this.currentUser);
    return true;
  }

  async initializeChat() {
    this.initializeBellIndicator();

    try {
      await this.socketManager.connect();
      this.setupSocketEvents();
      this.bindEvents();
      this.loadStudents();

      UIManager.showConnectionStatus(
        document.querySelector(".chat-header"),
        this.socketManager.isConnected
      );

      this.socketManager.joinRoom(this.currentUser.id);
    } catch (error) {
      Utils.showError("Не вдалося підключитися до чат-сервера");
    }

    const openChatWith = localStorage.getItem("openChatWith");
    if (openChatWith) {
      localStorage.removeItem("openChatWith");
      const recipientSelect = document.getElementById("chat-recipient");
      if (recipientSelect) {
        // Чекаємо поки студенти завантажаться
        setTimeout(() => {
          recipientSelect.value = openChatWith;
          recipientSelect.dispatchEvent(new Event("change"));
        }, 500);
      }
    }
  }

  setupSocketEvents() {
    this.socketManager.on("receive_message", (message) => {
      console.log("📨 Отримано повідомлення:", message);
      this.handleIncomingMessage(message);
    });

    this.socketManager.on("message_sent", (message) => {
      console.log("✅ Повідомлення підтверджено сервером:", message);
    });

    this.socketManager.on("error", (error) => {
      console.error("❌ Помилка Socket.IO:", error);
      Utils.showError("Помилка відправки повідомлення");
    });
  }

  initializeBellIndicator() {
    const unreadCount = this.messageManager.getUnreadCount();
    UIManager.updateBellIndicator(unreadCount);
  }

  showAuthMessage() {
    const chatContainer = document.querySelector(".chat-container");
    if (chatContainer) {
      UIManager.showAuthMessage(chatContainer);
    }
  }

  bindEvents() {
    const elements = {
      input: document.getElementById("chat-input"),
      sendBtn: document.getElementById("send-btn"),
      recipientSelect: document.getElementById("chat-recipient"),
    };

    if (!elements.input || !elements.sendBtn || !elements.recipientSelect) {
      console.error("❌ Не знайдено елементи чату");
      return;
    }

    // Відправка повідомлення
    elements.sendBtn.addEventListener("click", () => this.sendMessage());
    elements.input.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Оновлення стану кнопки
    ["input", "keyup"].forEach((event) => {
      elements.input.addEventListener(event, () => this.updateSendButton());
    });

    // Вибір співрозмовника
    elements.recipientSelect.addEventListener("change", (e) => {
      const selectedOption = e.target.selectedOptions[0];
      this.selectedRecipient = e.target.value;
      this.selectedRecipientName = selectedOption
        ? selectedOption.textContent
        : "";

      console.log(
        "👥 Обрано співрозмовника:",
        this.selectedRecipient,
        this.selectedRecipientName
      );

      this.updateSendButton();
      this.handleRecipientChange();
    });

    setTimeout(() => this.updateSendButton(), 500);
  }

  handleRecipientChange() {
    const chatTitle = document.getElementById("chat-title");
    const container = document.getElementById("chat-messages");

    if (this.selectedRecipient) {
      this.loadConversation();
      if (chatTitle) chatTitle.textContent = this.selectedRecipientName;
    } else {
      if (container) {
        container.innerHTML =
          '<div style="text-align: center; color: #666; padding: 20px;">Оберіть співрозмовника для початку чату</div>';
      }
      if (chatTitle) chatTitle.textContent = "Оберіть співрозмовника";
    }
  }

  updateSendButton() {
    const elements = {
      input: document.getElementById("chat-input"),
      sendBtn: document.getElementById("send-btn"),
    };

    if (!elements.input || !elements.sendBtn) {
      console.warn("⚠️ Елементи чату не знайдено для оновлення кнопки");
      return;
    }

    const conditions = {
      hasMessage: elements.input.value.trim().length > 0,
      hasRecipient: this.selectedRecipient && this.selectedRecipient !== "",
      isConnected: this.socketManager.isConnected,
    };

    console.log("🔄 Оновлення кнопки надсилання:", conditions);

    const shouldEnable = Object.values(conditions).every(Boolean);

    const tooltip = !conditions.isConnected
      ? "Немає з'єднання"
      : !conditions.hasRecipient
      ? "Оберіть співрозмовника"
      : !conditions.hasMessage
      ? "Введіть повідомлення"
      : "Надіслати повідомлення";

    UIManager.updateButton(elements.sendBtn, shouldEnable, tooltip);
  }

  async loadStudents() {
    try {
      console.log("👥 Завантаження списку студентів...");

      let students = [];
      if (window.studentManager?.students) {
        students = window.studentManager.students;
        console.log("📋 Використано кеш студентів з менеджера");
      } else {
        const response = await fetch("students.php");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        students = await response.json();
        console.log("📋 Завантажено з сервера");
      }

      console.log(`👥 Знайдено студентів: ${students.length}`);
      this.populateRecipientSelect(students);
    } catch (error) {
      console.error("❌ Помилка завантаження студентів:", error);
      Utils.showError("Не вдалося завантажити список студентів");
    }
  }

  populateRecipientSelect(students) {
    const select = document.getElementById("chat-recipient");
    if (!select) return;

    select.innerHTML = '<option value="">Обери співрозмовника</option>';

    const filteredStudents = students.filter(
      (student) => String(student.id) !== String(this.currentUser.id)
    );

    filteredStudents.forEach((student) => {
      const option = document.createElement("option");
      option.value = String(student.id);
      option.textContent = `${student.firstName} ${student.lastName}`;
      select.appendChild(option);
    });

    console.log(`📋 Додано ${filteredStudents.length} користувачів до списку`);
    this.updateSendButton();
  }

  async loadConversation() {
    if (!this.selectedRecipient || !this.currentUser) {
      console.log("❌ Не можу завантажити розмову: відсутні дані");
      return;
    }

    try {
      console.log(
        `📖 Завантаження розмови між ${this.currentUser.id} та ${this.selectedRecipient}`
      );

      const response = await fetch(
        `http://localhost:3001/api/messages/${this.currentUser.id}/${this.selectedRecipient}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const messages = await response.json();
      console.log(`📨 Завантажено повідомлень: ${messages.length}`);
      this.displayMessages(messages);
    } catch (error) {
      console.error("❌ Помилка завантаження розмови:", error);
      Utils.showError("Не вдалося завантажити історію повідомлень");

      const container = document.getElementById("chat-messages");
      if (container) {
        container.innerHTML =
          '<div style="text-align: center; color: #666; padding: 20px;">Історія повідомлень недоступна. Почніть нову розмову!</div>';
      }
    }
  }

  sendMessage() {
    const chatInput = document.getElementById("chat-input");
    const message = chatInput.value.trim();

    const validationChecks = {
      hasMessage: !!message,
      hasRecipient: !!this.selectedRecipient,
      hasUser: !!this.currentUser,
      isConnected: this.socketManager.isConnected,
    };

    if (!Object.values(validationChecks).every(Boolean)) {
      console.log("❌ Неможливо відправити повідомлення:", validationChecks);
      return;
    }

    const messageData = {
      sender_id: String(this.currentUser.id),
      sender_name: this.currentUser.fullName,
      recipient_id: String(this.selectedRecipient),
      message: message,
    };

    console.log("📤 Відправляємо повідомлення:", messageData);

    const messageObj = {
      ...messageData,
      timestamp: new Date().toISOString(),
    };

    this.displayMessage(messageObj, true);
    this.socketManager.emit("send_message", messageData);

    chatInput.value = "";
    this.updateSendButton();
  }

  handleIncomingMessage(message) {
    console.log("📨 Обробка вхідного повідомлення:", message);

    if (
      this.selectedRecipient &&
      String(message.sender_id) === String(this.selectedRecipient)
    ) {
      console.log("👀 Показуємо повідомлення в поточній розмові");
      this.displayMessage(message, false);
    } else {
      console.log(
        "🔔 Повідомлення від іншого користувача, показуємо сповіщення"
      );
    }

    this.messageManager.addUnreadMessage(message);
    UIManager.updateBellIndicator(this.messageManager.getUnreadCount());
  }

  displayMessages(messages) {
    const container = document.getElementById("chat-messages");
    if (!container) return;

    container.innerHTML = "";

    if (messages.length === 0) {
      container.innerHTML =
        '<div style="text-align: center; color: #666; padding: 20px;">Повідомлень поки немає. Напишіть перше!</div>';
      return;
    }

    messages.forEach((message) => this.displayMessage(message));
    this.scrollToBottom();
  }

  displayMessage(message, isOwn = null) {
    const container = document.getElementById("chat-messages");
    if (!container) return;

    // Видаляємо empty state якщо є
    const emptyState = container.querySelector(".chat-empty-state");
    if (emptyState) emptyState.remove();

    if (isOwn === null) {
      isOwn =
        this.currentUser &&
        String(message.sender_id) === String(this.currentUser.id);
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isOwn ? "own" : "other"}`;

    const timestamp = new Date(message.timestamp).toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    });

    messageDiv.innerHTML = `
      <div class="message-header">
        ${isOwn ? "Ви" : message.sender_name} • ${timestamp}
      </div>
      <div class="message-text">${Utils.escapeHtml(message.message)}</div>
    `;

    container.appendChild(messageDiv);
    this.scrollToBottom();
  }

  scrollToBottom() {
    const container = document.getElementById("chat-messages");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}

// Глобальний менеджер сповіщень
class GlobalNotificationManager {
  constructor() {
    this.messageManager = new MessageManager();
    this.socketManager = new SocketManager();
    this.isDropdownOpen = false;
    this.isHoveringDropdown = false; // Додайте цю лінію

    this.initialize();
  }

  async initialize() {
    this.initializeBell();
    this.ensureDropdownExists(); // Додайте цю лінію тут

    const currentUser = Utils.getCurrentUser();
    if (!currentUser) return;

    try {
      await this.socketManager.connect();
      this.socketManager.joinRoom(currentUser.id);
      this.socketManager.on("receive_message", (message) =>
        this.handleGlobalMessage(message)
      );
      this.bindGlobalEvents(); // Перенесено після ensureDropdownExists
    } catch (error) {
      console.error("❌ Помилка ініціалізації глобального сокета:", error);
    }
  }

  ensureDropdownExists() {
    if (!document.getElementById("notification-dropdown")) {
      const dropdown = document.createElement("div");
      dropdown.className = "notification-dropdown";
      dropdown.id = "notification-dropdown";
      dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      right: 0;
      width: 350px;
      max-height: 400px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      display: none;
      overflow: hidden;
    `;
      dropdown.innerHTML = `
      <div class="notification-dropdown-header" style="padding: 15px; border-bottom: 1px solid #eee; background: #f8f9fa;">
        <h4 style="margin: 0; font-size: 16px; color: #333;">Нові повідомлення</h4>
      </div>
      <div id="notification-list" style="max-height: 320px; overflow-y: auto;"></div>
    `;
      document.body.appendChild(dropdown);
    }
  }

  handleGlobalMessage(message) {
    console.log("🔔 Глобальне повідомлення:", message);

    this.messageManager.addUnreadMessage(message);
    UIManager.updateBellIndicator(this.messageManager.getUnreadCount());
    this.updateNotificationDropdown();
    this.showNativeNotification(message);
  }

  bindGlobalEvents() {
    const bellContainer = document.querySelector(".bell-container");
    const bellLink = document.getElementById("bell-link");

    if (bellContainer) {
      // Hover events для показу dropdown
      bellContainer.addEventListener("mouseenter", () => {
        this.openNotificationDropdown();
      });

      bellContainer.addEventListener("mouseleave", (e) => {
        // Перевіряємо чи курсор не над dropdown
        const dropdown = document.getElementById("notification-dropdown");
        if (!dropdown || !dropdown.contains(e.relatedTarget)) {
          setTimeout(() => {
            if (!this.isHoveringDropdown) {
              this.closeNotificationDropdown();
            }
          }, 100);
        }
      });
    }

    // Додаємо hover events для dropdown (використовуємо делегування)
    document.addEventListener(
      "mouseenter",
      (e) => {
        if (e.target.closest("#notification-dropdown")) {
          this.isHoveringDropdown = true;
        }
      },
      true
    );

    document.addEventListener(
      "mouseleave",
      (e) => {
        if (e.target.closest("#notification-dropdown")) {
          this.isHoveringDropdown = false;
          setTimeout(() => {
            if (!this.isHoveringDropdown) {
              this.closeNotificationDropdown();
            }
          }, 100);
        }
      },
      true
    );

    // Click на дзвіночок для переходу в чат
    if (bellLink) {
      bellLink.addEventListener("click", (e) => {
        if (!window.location.pathname.includes("notifications.html")) {
          // Якщо не на сторінці чату - переходимо туди
          return; // дозволяємо стандартну поведінку href
        } else {
          // Якщо вже на сторінці чату - просто закриваємо dropdown
          e.preventDefault();
          this.closeNotificationDropdown();
        }
      });
    }
  }

  toggleNotificationDropdown() {
    this.isDropdownOpen
      ? this.closeNotificationDropdown()
      : this.openNotificationDropdown();
  }

  openNotificationDropdown() {
    const dropdown = document.getElementById("notification-dropdown");
    if (!dropdown) {
      this.ensureDropdownExists();
      return this.openNotificationDropdown();
    }

    this.updateNotificationDropdown();
    dropdown.style.display = "block";
    dropdown.classList.add("show");
    this.isDropdownOpen = true;

    const bellContainer = document.querySelector(".bell-container");
    if (bellContainer) {
      const rect = bellContainer.getBoundingClientRect();
      dropdown.style.position = "fixed";
      dropdown.style.top = rect.bottom + 8 + "px";
      dropdown.style.right = window.innerWidth - rect.right + "px";
    }
  }

  closeNotificationDropdown() {
    const dropdown = document.getElementById("notification-dropdown");
    if (dropdown) {
      dropdown.style.display = "none";
      dropdown.classList.remove("show");
      this.isDropdownOpen = false;
    }
  }

  updateNotificationDropdown() {
    const notificationList = document.getElementById("notification-list");
    if (!notificationList) return;

    const messages = this.messageManager.unreadMessages;

    if (messages.length === 0) {
      notificationList.innerHTML = `
        <div class="notification-empty">
          <i class="fa-regular fa-bell-slash"></i>
          <p>Немає нових повідомлень</p>
        </div>
      `;
      return;
    }

    notificationList.innerHTML = messages
      .slice(0, 10)
      .map((message) => this.createNotificationHTML(message))
      .join("");

    notificationList
      .querySelectorAll(".notification-item")
      .forEach((item, index) => {
        item.addEventListener("click", () =>
          this.handleNotificationClick(messages[index])
        );
      });
  }

  createNotificationHTML(message) {
    const timeAgo = Utils.getTimeAgo(
      new Date(message.timestamp || message.receivedAt)
    );
    const initials = Utils.getInitials(message.sender_name);

    return `
      <div class="notification-item ${
        !message.isRead ? "unread" : ""
      }" data-message-id="${message._id || ""}">
        <div class="notification-avatar">${initials}</div>
        <div class="notification-content">
          <div class="notification-sender">${Utils.escapeHtml(
            message.sender_name
          )}</div>
          <div class="notification-message">${Utils.escapeHtml(
            message.message
          )}</div>
          <div class="notification-time">${timeAgo}</div>
        </div>
      </div>
    `;
  }

  handleNotificationClick(message) {
    this.messageManager.markAsRead(message._id);
    UIManager.updateBellIndicator(this.messageManager.getUnreadCount());

    const currentPage = window.location.pathname;
    if (!currentPage.includes("notifications.html")) {
      // Зберігаємо ID відправника для подальшого відкриття чату
      localStorage.setItem("openChatWith", message.sender_id);
      window.location.href = "notifications.html";
    } else if (window.chatManager) {
      const recipientSelect = document.getElementById("chat-recipient");
      if (recipientSelect) {
        recipientSelect.value = message.sender_id;
        recipientSelect.dispatchEvent(new Event("change"));
      }
    }

    this.closeNotificationDropdown();
  }

  showNativeNotification(message) {
    if (Notification && Notification.permission === "granted") {
      new Notification(`Нове повідомлення від ${message.sender_name}`, {
        body: message.message,
        icon: "/resources/icon-192x192.ico",
        tag: "chat-message",
      });
    }
  }

  initializeBell() {
    const unreadCount = this.messageManager.getUnreadCount();
    UIManager.updateBellIndicator(unreadCount);

    // Ініціалізуємо dropdown якщо його немає
    this.ensureDropdownExists();
  }
}

// Ініціалізація
document.addEventListener("DOMContentLoaded", () => {
  // Ініціалізація чату тільки на сторінці з чатом
  if (document.getElementById("chat-messages")) {
    console.log("🚀 Запуск чату...");
    window.chatManager = new ChatManager();
  }

  // Глобальні сповіщення ініціалізуємо на ВСІХ сторінках для авторизованих користувачів
  if (Utils.checkAuth()) {
    console.log("🔔 Ініціалізація глобальних сповіщень...");
    window.globalNotificationManager = new GlobalNotificationManager();

    // Запит дозволу на нативні сповіщення
    if (Notification && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }
});

// Додайте цю нову функцію для переініціалізації після авторизації:
window.reinitializeGlobalNotifications = function () {
  if (Utils.checkAuth() && !window.globalNotificationManager) {
    console.log("🔄 Ініціалізація глобальних сповіщень після авторизації...");
    window.globalNotificationManager = new GlobalNotificationManager();
  }
};

// Оновлена функція reinitializeChat залишається без змін
window.reinitializeChat = function () {
  if (document.getElementById("chat-messages")) {
    console.log("🔄 Повторна ініціалізація чату після авторизації...");
    if (window.chatManager?.socketManager) {
      window.chatManager.socketManager.disconnect();
    }
    window.chatManager = new ChatManager();
  }

  // Також переініціалізуємо глобальні сповіщення
  window.reinitializeGlobalNotifications();
};

function hideBellOnChatPage() {
  const isOnChatPage = window.location.pathname.includes("notifications.html");

  if (isOnChatPage) {
    const badge = document.querySelector(".notification-badge");
    if (badge) badge.style.visibility = "hidden";
  }
}

function showBellOnPageLeave() {
  const badge = document.querySelector(".notification-badge");
  if (!badge) return;

  badge.style.visibility = "visible";

  const messageManager = new MessageManager();
  const unreadCount = messageManager.getUnreadCount();

  if (unreadCount > 0) {
    badge.style.display = "block";
    badge.textContent = unreadCount > 99 ? "99+" : unreadCount.toString();
  } else {
    badge.style.display = "none";
  }
}
