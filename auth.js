// Authentication system functions

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

// Log in user
function login(firstName, lastName, dob) {
  // Format the DOB to remove any non-numeric characters and ensure it's in the format DDMMYYYY
  const formattedDOB = dob.replace(/[^0-9]/g, "");

  // Basic validation to ensure proper format
  if (formattedDOB.length !== 8) {
    return Promise.resolve(false);
  }

  // Check credentials against student data
  return fetch("students.php")
    .then((response) => response.json())
    .then((students) => {
      // Find student with matching name and dob
      const student = students.find(
        (s) =>
          s.firstName.toLowerCase() === firstName.toLowerCase() &&
          s.lastName.toLowerCase() === lastName.toLowerCase() &&
          formatDateForComparison(s.dob) === formattedDOB
      );

      if (student) {
        // Store login state and user info
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
          })
        );

        // ДОДАНО: Зберігаємо дані для чату в правильному форматі
        setUserDataForChat(student);

        updateOnlineStatus(true);

        // ДОДАНО: Повторно ініціалізуємо чат після авторизації
        if (typeof window.reinitializeChat === "function") {
          setTimeout(() => window.reinitializeChat(), 100);
        }

        return true;
      }
      return false;
    })
    .catch((error) => {
      console.error("Error during login:", error);
      // Try checking local cache if server is unavailable
      const cachedStudents = JSON.parse(
        localStorage.getItem("students") || "[]"
      );
      const student = cachedStudents.find(
        (s) =>
          s.firstName.toLowerCase() === firstName.toLowerCase() &&
          s.lastName.toLowerCase() === lastName.toLowerCase() &&
          formatDateForComparison(s.dob) === formattedDOB
      );

      if (student) {
        localStorage.setItem("isLoggedIn", "true");
        if (typeof window.reinitializeGlobalNotifications === "function") {
          window.reinitializeGlobalNotifications();
        }
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
          })
        );

        // ДОДАНО: Зберігаємо дані для чату в правильному форматі
        setUserDataForChat(student);

        // ДОДАНО: Повторно ініціалізуємо чат після авторизації
        if (typeof window.reinitializeChat === "function") {
          setTimeout(() => window.reinitializeChat(), 100);
        }

        return true;
      }
      return false;
    });
}

// Helper function to format date from database format to DDMMYYYY
function formatDateForComparison(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return day + month + year;
  } catch (e) {
    console.error("Error formatting date:", e);
    return "";
  }
}

// Log out user
function logout() {
  updateOnlineStatus(false);
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("currentUser");
  // ДОДАНО: Очищуємо дані чату при виході
  localStorage.removeItem("userId");
  localStorage.removeItem("userFullName");
  localStorage.removeItem("firstName");
  localStorage.removeItem("lastName");
  localStorage.removeItem("dob");

  location.reload();
}

// Update UI based on login state
function updateUIForAuthState() {
  const isUserLoggedIn = isLoggedIn();

  // Get user info if logged in
  let currentUser = null;
  if (isUserLoggedIn) {
    try {
      currentUser = JSON.parse(localStorage.getItem("currentUser"));
    } catch (e) {
      console.error("Error parsing user data", e);
      logout(); // Force logout if data is corrupted
      return;
    }
  }

  // Update header
  const personalArea = document.querySelector(".personal");
  if (personalArea) {
    if (isUserLoggedIn && currentUser) {
      personalArea.innerHTML = `
          <img src="resources/avatar.jpg" alt="" class="avatar" />
          <p class="name">${currentUser.firstName} ${currentUser.lastName}</p>
          <div class="dropdown-menu">
            <button class="dropdown-item">Профіль</button>
            <button class="dropdown-item logout-btn">Вихід</button>
          </div>
        `;

      // Add logout functionality
      const logoutBtn = personalArea.querySelector(".logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
      }
    } else {
      personalArea.innerHTML = `
          <button class="login-btn">Log-in</button>
        `;

      // Add login button functionality
      const loginBtn = personalArea.querySelector(".login-btn");
      if (loginBtn) {
        loginBtn.addEventListener("click", () => {
          document.getElementById("login-modal").style.display = "flex";
        });
      }
    }
  }

  // Disable notification bell for non-logged users
  const bellContainer = document.querySelector(".bell-container");
  if (bellContainer) {
    if (!isUserLoggedIn) {
      bellContainer.classList.add("disabled");
      const bellLink = bellContainer.querySelector("#bell-link");
      if (bellLink) {
        bellLink.style.pointerEvents = "none";
        bellLink.style.opacity = "0.5";
      }
    } else {
      bellContainer.classList.remove("disabled");
      const bellLink = bellContainer.querySelector("#bell-link");
      if (bellLink) {
        bellLink.style.pointerEvents = "auto";
        bellLink.style.opacity = "1";
      }
    }
  }

  // Disable edit/delete operations for non-logged users
  if (document.querySelector(".students-table")) {
    const editButtons = document.querySelectorAll(".edit-btn");
    const deleteButtons = document.querySelectorAll(".delete-btn");
    const addStudentBtn = document.querySelector(".add-student-btn");
    const checkboxes = document.querySelectorAll(".select-row, #select-all");

    if (!isUserLoggedIn) {
      // Disable all buttons
      editButtons.forEach((btn) => {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
      });

      deleteButtons.forEach((btn) => {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
      });

      if (addStudentBtn) {
        addStudentBtn.style.display = "none";
      }

      checkboxes.forEach((checkbox) => {
        checkbox.disabled = true;
        checkbox.style.cursor = "not-allowed";
      });
    } else {
      // Enable all buttons
      editButtons.forEach((btn) => {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
      });

      deleteButtons.forEach((btn) => {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
      });

      if (addStudentBtn) {
        addStudentBtn.style.display = "block";
      }

      checkboxes.forEach((checkbox) => {
        checkbox.disabled = false;
        checkbox.style.cursor = "pointer";
      });
    }
  }
}

// Initialize auth when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  updateUIForAuthState();

  // Set up login form submission
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const firstName = document.getElementById("login-firstname").value.trim();
      const lastName = document.getElementById("login-lastname").value.trim();
      const dob = document.getElementById("login-dob").value;

      // Validate inputs
      if (!firstName || !lastName || !dob) {
        document.getElementById("login-error").textContent =
          "Заповніть всі поля.";
        return;
      }

      login(firstName, lastName, dob).then((success) => {
        if (success) {
          document.getElementById("login-modal").style.display = "none";
          updateUIForAuthState();
        } else {
          document.getElementById("login-error").textContent =
            "Невірне ім'я чи дата народження.";
        }
      });
    });
  }

  // Set up close button for login modal
  const closeLoginBtn = document.querySelector(".close-login-btn");
  if (closeLoginBtn) {
    closeLoginBtn.addEventListener("click", function () {
      document.getElementById("login-modal").style.display = "none";
    });
  }

  // Close login modal when clicking cancel
  const cancelLoginBtn = document.querySelector(".cancel-login-btn");
  if (cancelLoginBtn) {
    cancelLoginBtn.addEventListener("click", function () {
      document.getElementById("login-modal").style.display = "none";
    });
  }
});

// ВИПРАВЛЕНА функція для налаштування даних користувача для чату
function setUserDataForChat(student) {
  console.log("🔧 Налаштування даних для чату:", student);

  // Зберігаємо всі необхідні дані для чату
  localStorage.setItem("userId", String(student.id));
  localStorage.setItem(
    "userFullName",
    `${student.firstName} ${student.lastName}`
  );
  localStorage.setItem("firstName", student.firstName);
  localStorage.setItem("lastName", student.lastName);

  console.log("✅ Дані для чату збережено:", {
    userId: String(student.id),
    userFullName: `${student.firstName} ${student.lastName}`,
    firstName: student.firstName,
    lastName: student.lastName,
  });
}

function updateOnlineStatus(isOnline) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  if (!currentUser.id) return;

  fetch("students.php", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: currentUser.id,
      onlineStatus: isOnline
        ? '<i class="fa-solid fa-check" style="color: green;"></i>'
        : '<i class="fa-solid fa-xmark" style="color: red;"></i>',
    }),
  }).catch(console.error);
}

window.addEventListener('beforeunload', () => {
  if (isLoggedIn()) {
    updateOnlineStatus(false);
  }
});