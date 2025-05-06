// Fix for student editing - ID type mismatch correction
document.addEventListener("DOMContentLoaded", function () {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/project_lab1/service-worker.js")
      .then(() => console.log("Service Worker registered"))
      .catch((error) =>
        console.error("Service Worker registration failed:", error)
      );
  }

  let badge = document.querySelector(".notification-badge");
  let bell = document.querySelector(".bell");

  function updateBadgeVisibility() {
    if (localStorage.getItem("notifications") === "hidden") {
      badge.style.display = "none";
    } else {
      badge.style.display = "block";
    }
  }

  updateBadgeVisibility();

  if (document.getElementById("bell-link")) {
    document.getElementById("bell-link").addEventListener("click", function () {
      badge.style.display = "none";
      localStorage.setItem("notifications", "hidden");
    });
  }

  if (bell) {
    bell.addEventListener("dblclick", function () {
      bell.style.transition = "transform 0.5s ease";
      bell.style.transform = "rotate(360deg)";

      setTimeout(() => {
        badge.style.display = "block";
        localStorage.setItem("notifications", "visible");
      }, 500);
    });
  }
});

function toggleMenu() {
  document.querySelector(".sidebar").classList.toggle("open");
}

document.addEventListener("DOMContentLoaded", function () {
  // Перевіряємо чи на сторінці студентів
  if (!document.querySelector(".students-table")) {
    return; // Виходимо з функції, якщо не на сторінці студентів
  }

  const addButton = document.querySelector(".add-student-btn");
  const modal = document.getElementById("student-modal");
  const deleteModal = document.getElementById("delete-modal");
  const closeButton = document.querySelector(".close-btn");
  const closeDeleteButton = document.querySelector(".close-delete-btn");
  const deleteConfirmButton = document.querySelector(".confirm-delete-btn");
  const cancelDeleteButton = document.querySelector(".cancel-delete-btn");
  const saveButton = document.querySelector(".save-btn");
  const cancelButton = document.querySelector(".cancel-btn");
  const tableBody = document.querySelector(".students-table tbody");
  const selectAllCheckbox = document.getElementById("select-all");
  const deleteStudentList = document.getElementById("delete-student-list");

  let editingRow = null;
  let students = [];
  let serverConnected = false;

  function saveStudentsToCache() {
    localStorage.setItem("students", JSON.stringify(students));
  }

  function displayErrorMessage(message) {
    alert(`Помилка: ${message}`);
    console.error(message);
  }

  // Enhanced logging and debugging functions
  function logDebug(message, data) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;

    // For better inspection of objects and arrays
    if (data !== undefined) {
      if (typeof data === "object" && data !== null) {
        try {
          // Clone the data to avoid circular references
          const clonedData = JSON.parse(JSON.stringify(data));
          console.log(logMessage, clonedData);
        } catch (e) {
          console.log(logMessage, "Unable to stringify object:", data);
        }
      } else {
        console.log(logMessage, data);
      }
    } else {
      console.log(logMessage);
    }
  }

  // Improved loading and caching
  function checkServerConnection() {
    logDebug("Перевірка з'єднання з сервером...");

    return fetch("check_connection.php")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        logDebug("Відповідь від сервера:", data);

        if (data.status === "success") {
          serverConnected = true;
          logDebug("З'єднання з сервером успішне");
          return true;
        } else {
          throw new Error(data.message || "З'єднання невдале");
        }
      })
      .catch((error) => {
        serverConnected = false;
        logDebug("Помилка з'єднання з сервером:", error);

        // Покращена послідовність завантаження - спочатку спробуємо використати кеш
        const cachedData = localStorage.getItem("students");
        if (cachedData) {
          logDebug("Знайдено початковий кеш, відображаємо його");
          students = JSON.parse(cachedData) || [];
          renderStudents();
        }

        // Потім перевіряємо з'єднання і оновлюємо дані з сервера
        checkServerConnection().then((isConnected) => {
          logDebug("Результат перевірки з'єднання:", isConnected);
          if (isConnected) {
            loadStudents();
          }
        });
      });
  }

  // Fixed student data normalization
  function normalizeOnlineStatus(status) {
    logDebug("Normalizing status value:", status);

    // Convert any truthy representation to green check icon
    if (
      status === "1" ||
      status === 1 ||
      status === true ||
      (typeof status === "string" &&
        (status.includes("fa-check") || status.toLowerCase() === "true"))
    ) {
      return '<i class="fa-solid fa-check" style="color: green;"></i>';
    } else {
      return '<i class="fa-solid fa-xmark" style="color: red;"></i>';
    }
  }

  /// Improved helper function to determine online status boolean value
  function getStatusAsBool(status) {
    // Add more detailed logging for debugging
    logDebug("Checking status value:", status);

    // Handle all possible representations of "true" status
    if (
      status === "1" ||
      status === 1 ||
      status === true ||
      (typeof status === "string" &&
        (status.includes("fa-check") || status.toLowerCase() === "true"))
    ) {
      logDebug("Status evaluated as TRUE");
      return true;
    } else {
      logDebug("Status evaluated as FALSE");
      return false;
    }
  }

  // Додавання студента
  function addStudent(student) {
    if (!serverConnected) {
      // Використовуємо локальний режим, якщо сервер недоступний
      student.id = Date.now().toString(); // Генеруємо ID на клієнті
      students.push(student);
      saveStudentsToCache();
      renderStudents();
      return Promise.resolve({ success: true, id: student.id });
    }

    // Нормалізуємо дані для серверу
    const studentData = { ...student };
    logDebug("Додавання студента на сервер:", studentData);

    return fetch("students.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((response) => {
        logDebug("Відповідь від сервера при додаванні:", response);
        // Оновлюємо локальні дані
        if (response.success && response.id) {
          loadStudents(); // Перезавантажуємо студентів для отримання коректних ID
        }
        return response;
      })
      .catch((error) => {
        logDebug("Помилка при додаванні студента:", error);
        displayErrorMessage(`Помилка додавання студента: ${error.message}`);
        throw error;
      });
  }

  // Fix for the updateStudent function
  function updateStudent(student) {
    if (!serverConnected) {
      // Локальний режим
      let index = students.findIndex(
        (s) => String(s.id) === String(student.id)
      );
      if (index !== -1) {
        students[index] = student;
      }
      saveStudentsToCache();
      renderStudents();
      return Promise.resolve({ success: true });
    }

    // Нормалізуємо дані для серверу
    const studentData = { ...student };
    logDebug("Оновлення студента на сервері:", studentData);

    return fetch("students.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((response) => {
        logDebug("Відповідь від сервера при оновленні:", response);
        if (response.success) {
          // Оновлюємо локально без перезавантаження для кращої швидкодії
          const index = students.findIndex(
            (s) => String(s.id) === String(student.id)
          );
          if (index !== -1) {
            students[index] = student;
            saveStudentsToCache();
            renderStudents();
          } else {
            // Якщо студента не знайдено локально, завантажуємо всіх
            loadStudents();
          }
        }
        return response;
      })
      .catch((error) => {
        logDebug("Помилка при оновленні студента:", error);
        displayErrorMessage(`Помилка оновлення студента: ${error.message}`);
        throw error;
      });
  }

  // Видалення студентів
  function deleteStudents(ids) {
    if (!serverConnected) {
      // Локальний режим
      students = students.filter(
        (student) => !ids.includes(String(student.id))
      );
      saveStudentsToCache();
      renderStudents();
      return Promise.resolve({ success: true });
    }

    logDebug("Видалення студентів на сервері:", ids);

    return fetch("students.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete_multiple",
        ids: ids,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((response) => {
        logDebug("Відповідь від сервера при видаленні:", response);
        if (response.success) {
          loadStudents(); // Перезавантажуємо для оновлення даних
        }
        return response;
      })
      .catch((error) => {
        logDebug("Помилка при видаленні студентів:", error);
        displayErrorMessage(`Помилка видалення студентів: ${error.message}`);
        throw error;
      });
  }

  // Improved loadStudents function with better normalization
  function loadStudents() {
    logDebug("Loading students from server...");

    return fetch("students.php")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        logDebug("Raw student data from server:", data);

        // Ensure consistent data format for each student
        students = data.map((student) => {
          // Ensure the student object has all expected fields
          const normalizedStudent = {
            id: String(student.id), // Ensure ID is always a string
            group: student.group || "",
            firstName: student.firstName || "",
            lastName: student.lastName || "",
            gender: student.gender || "",
            dob: student.dob || "",
            // Normalize onlineStatus for consistent rendering
            onlineStatus: normalizeOnlineStatus(student.onlineStatus),
          };

          return normalizedStudent;
        });

        logDebug("Normalized students array:", students);

        // Save to local storage
        saveStudentsToCache();

        // Update the UI
        renderStudents();

        return students;
      })
      .catch((error) => {
        logDebug("Error loading students:", error);

        // Use cached students if available
        const cachedData = localStorage.getItem("students");
        if (cachedData) {
          try {
            students = JSON.parse(cachedData) || [];
            // Ensure all student IDs are strings
            students = students.map((student) => ({
              ...student,
              id: String(student.id),
            }));
            logDebug("Using cached students:", students);
          } catch (parseError) {
            logDebug("Error parsing cached students:", parseError);
            students = [];
          }
        } else {
          students = [];
          logDebug("Cache empty, using empty array");
        }

        renderStudents();
        return students;
      });
  }

  // Оновлюємо функцію renderStudents для коректного відображення
  function renderStudents() {
    tableBody.innerHTML = "";
    logDebug("Відображення студентів:", students);

    // Обчислюємо загальну кількість сторінок
    totalPages = Math.ceil(students.length / itemsPerPage);

    // Обмежуємо поточну сторінку до валідного діапазону
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    if (currentPage < 1) {
      currentPage = 1;
    }

    // Визначаємо індекси студентів для відображення на поточній сторінці
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, students.length);

    // Відображаємо тільки студентів для поточної сторінки
    for (let i = startIndex; i < endIndex; i++) {
      const student = students[i];
      // Зараз onlineStatus вже нормалізований у loadStudents, але перевіряємо на всяк випадок
      const statusIcon = normalizeOnlineStatus(student.onlineStatus);

      let row = document.createElement("tr");
      row.dataset.id = String(student.id); // Ensure ID is always a string in the DOM
      row.innerHTML = `
              <td><input type="checkbox" class="select-row" aria-label="Обрати рядок"></td>
              <td>${student.group || ""}</td>
              <td>${student.firstName || ""} ${student.lastName || ""}</td>
              <td>${student.gender || ""}</td>
              <td>${student.dob || ""}</td>
              <td>${statusIcon}</td>
              <td>
                  <button class="edit-btn" aria-label="Редагувати студента"><i class="fa-solid fa-pen"></i></button>
                  <button class="delete-btn" aria-label="Видалити студента"><i class="fa-solid fa-eraser"></i></button>
              </td>
          `;
      tableBody.appendChild(row);
    }

    updateCheckboxListeners();
    updateEventListeners();
    updatePagination();
  }

  if (addButton) {
    addButton.addEventListener("click", function () {
      editingRow = null;
      document.getElementById("modal-title").textContent = "Додати студента";

      // Очищення полів форми
      document.getElementById("first-name-input").value = "";
      document.getElementById("last-name-input").value = "";
      document.getElementById("dob-input").value = "";
      document.getElementById("online-status").checked = false;

      modal.style.display = "flex";
    });
  }

  if (closeButton) {
    closeButton.addEventListener("click", () => (modal.style.display = "none"));
  }

  if (cancelButton) {
    cancelButton.addEventListener(
      "click",
      () => (modal.style.display = "none")
    );
  }

  if (saveButton) {
    saveButton.addEventListener("click", function () {
      // Використовуємо null для нового студента (сервер надасть ID)
      let id = editingRow ? editingRow.dataset.id : null;
      let group = document.getElementById("group-select").value;
      let firstName = document.getElementById("first-name-input").value.trim();
      let lastName = document.getElementById("last-name-input").value.trim();
      let gender = document.getElementById("gender-select").value;
      let dob = document.getElementById("dob-input").value;
      let onlineStatus = document.getElementById("online-status").checked
        ? '<i class="fa-solid fa-check" style="color: green;"></i>'
        : '<i class="fa-solid fa-xmark" style="color: red;"></i>';

      if (!firstName || !lastName || !dob) {
        alert("Будь ласка, заповніть всі поля.");
        return;
      }

      let student = {
        id,
        group,
        firstName,
        lastName,
        gender,
        dob,
        onlineStatus,
      };
      logDebug("Збереження студента:", student);

      if (editingRow) {
        // Оновлення студента
        updateStudent(student)
          .then((response) => {
            if (response.success) {
              modal.style.display = "none";
              // loadStudents() вже викликається в updateStudent
            } else {
              displayErrorMessage(
                response.message || "Невідома помилка при оновленні"
              );
            }
          })
          .catch((error) => {
            logDebug("Помилка при оновленні студента:", error);
          });
      } else {
        // Додавання нового студента
        addStudent(student)
          .then((response) => {
            if (response.success) {
              modal.style.display = "none";
              // loadStudents() вже викликається в addStudent
            } else {
              displayErrorMessage(
                response.message || "Невідома помилка при додаванні"
              );
            }
          })
          .catch((error) => {
            logDebug("Помилка при додаванні студента:", error);
          });
      }
    });
  }

  function updateCheckboxListeners() {
    const checkboxes = document.querySelectorAll(".select-row");
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        if (selectAllCheckbox) {
          selectAllCheckbox.checked = [...checkboxes].every((cb) => cb.checked);
        }
      });
    });
  }

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", function () {
      const checkboxes = document.querySelectorAll(".select-row");
      checkboxes.forEach((checkbox) => {
        checkbox.checked = selectAllCheckbox.checked;
      });
    });
  }

  function updateEventListeners() {
    document.querySelectorAll(".edit-btn").forEach((button) => {
      button.onclick = function () {
        let row = this.closest("tr");
        let id = String(row.dataset.id); // Convert to string explicitly

        // Improved debugging for student lookup
        logDebug("Editing student with ID:", id);
        logDebug("Current students array:", students);

        // Find student by ID in the array - ensure both are strings
        let student = students.find((s) => String(s.id) === id);

        if (!student) {
          logDebug("Error: Student not found for editing with ID:", id);
          // Additional debug info
          logDebug(
            "Student IDs in array:",
            students.map((s) => String(s.id))
          );
          logDebug("Type of row ID:", typeof id);
          logDebug(
            "Types of student IDs:",
            students.map((s) => typeof s.id)
          );

          alert("Не вдалося знайти студента для редагування.");
          return;
        }

        logDebug("Found student for editing:", student);

        // Save reference to the row being edited
        editingRow = row;

        // Fill the form with student data
        document.getElementById("group-select").value =
          student.group || "ПЗ-11";
        document.getElementById("first-name-input").value =
          student.firstName || "";
        document.getElementById("last-name-input").value =
          student.lastName || "";
        document.getElementById("gender-select").value =
          student.gender || "Чоловіча";
        document.getElementById("dob-input").value = student.dob || "";

        // Set the online status checkbox using the helper function
        logDebug(
          "Setting online status checkbox with value:",
          student.onlineStatus
        );
        document.getElementById("online-status").checked = getStatusAsBool(
          student.onlineStatus
        );

        document.getElementById("modal-title").textContent =
          "Редагувати студента";
        modal.style.display = "flex";
      };
    });

    // Rest of the event listeners remain the same
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.onclick = function () {
        let row = this.closest("tr");
        let checkbox = row.querySelector(".select-row");
        checkbox.checked = true;

        showDeleteConfirmation();
      };
    });

    // Оновлення прослуховувачів для кнопок пагінації
    document
      .querySelectorAll(".page-btn:not(.prev-btn):not(.next-btn)")
      .forEach((button) => {
        button.onclick = function () {
          currentPage = parseInt(this.textContent);
          renderStudents();
        };
      });

    // Кнопки "Попередня" та "Наступна"
    const prevButton = document.querySelector(".prev-btn");
    const nextButton = document.querySelector(".next-btn");

    if (prevButton) {
      prevButton.onclick = function () {
        if (currentPage > 1) {
          currentPage--;
          renderStudents();
        }
      };
    }

    if (nextButton) {
      nextButton.onclick = function () {
        if (currentPage < totalPages) {
          currentPage++;
          renderStudents();
        }
      };
    }
  }

  // Виносимо показ вікна підтвердження видалення в окрему функцію
  function showDeleteConfirmation() {
    let selectedRows = document.querySelectorAll(".select-row:checked");
    if (selectedRows.length === 0) {
      alert("Оберіть хоча б одного студента для видалення!");
      return;
    }

    let studentNames = [];
    let studentIds = [];

    selectedRows.forEach((checkbox) => {
      let row = checkbox.closest("tr");
      let id = String(row.dataset.id);
      studentIds.push(id);

      // Знаходимо студента за id - ensure both are strings
      let student = students.find((s) => String(s.id) === id);
      if (student) {
        studentNames.push(`${student.firstName} ${student.lastName}`);
      } else {
        // Якщо студента не знайдено в масиві, використовуємо текст з рядка
        let nameCell = row.cells[2].textContent.trim();
        studentNames.push(nameCell);
      }
    });

    deleteStudentList.innerHTML = `Ви впевнені, що хочете видалити студентів: <br><b>${studentNames.join(
      ", "
    )}</b>?`;
    deleteModal.style.display = "flex";
  }

  if (deleteConfirmButton) {
    deleteConfirmButton.addEventListener("click", function () {
      let selectedRows = document.querySelectorAll(".select-row:checked");
      let idsToDelete = [...selectedRows].map((checkbox) =>
        String(checkbox.closest("tr").dataset.id)
      );

      deleteStudents(idsToDelete)
        .then((response) => {
          if (response.success) {
            deleteModal.style.display = "none";
            // Після успішного видалення на сервері оновлення списку студентів
            // відбувається в deleteStudents
          } else {
            displayErrorMessage(
              response.message || "Невідома помилка при видаленні"
            );
          }
        })
        .catch((error) => {
          logDebug("Помилка при видаленні студентів:", error);
        });
    });
  }

  if (cancelDeleteButton) {
    cancelDeleteButton.addEventListener("click", function () {
      deleteModal.style.display = "none";
    });
  }

  if (closeDeleteButton) {
    closeDeleteButton.addEventListener("click", function () {
      deleteModal.style.display = "none";
    });
  }

  // Перевіряємо з'єднання і завантажуємо дані
  logDebug("Початок завантаження даних");
  checkServerConnection().then((isConnected) => {
    logDebug("Результат перевірки з'єднання:", isConnected);
    if (isConnected) {
      loadStudents();
    }
  });
});

// Валідація форми
function showError(input, message) {
  input.classList.add("error");
  let errorElement = input.nextElementSibling;
  if (errorElement && errorElement.classList.contains("error-message")) {
    errorElement.textContent = message;
  }
  input.setCustomValidity(message);
}

function clearError(input) {
  input.classList.remove("error");
  let errorElement = input.nextElementSibling;
  if (errorElement && errorElement.classList.contains("error-message")) {
    errorElement.textContent = "";
  }
  input.setCustomValidity("");
}

function validateInput(event) {
  let input = event.target;
  let namePattern =
    /^[А-ЯІЇЄҐ][а-яіїєґ']+([-'][А-ЯІЇЄҐ][а-яіїєґ']+)?(\s[А-ЯІЇЄҐ][а-яіїєґ']+([-'][А-ЯІЇЄҐ][а-яіїєґ']+)*)*$/;
  let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let nulpPattern = /^[^@\s]+@nulp\.ua$/;
  let dobMaxDate = new Date("2025-01-01");
  let dobValue = new Date(input.value);

  clearError(input);

  if (input.id === "first-name-input" || input.id === "last-name-input") {
    let value = input.value.trim();

    if (nulpPattern.test(value)) {
      showError(input, "Вітаю, друже політехнік, ти ввів невірні дані");
      return;
    } else if (emailPattern.test(value)) {
      showError(input, "Здається, ви ввели email замість імені.");
      return;
    }

    if (!namePattern.test(value) && value.length > 0) {
      showError(
        input,
        "Ім'я та прізвище можуть містити лише українські літери, починатися з великої, а також містити дефіс або апостроф."
      );
      return;
    }
  }

  if (
    input.id === "dob-input" &&
    (dobValue >= dobMaxDate || isNaN(dobValue.getTime())) &&
    input.value
  ) {
    showError(input, "Дата народження має бути до 2025 року.");
  }
}

// Додаємо слухачі подій на поля введення, якщо вони існують на сторінці
document.addEventListener("DOMContentLoaded", function () {
  const firstNameInput = document.getElementById("first-name-input");
  const lastNameInput = document.getElementById("last-name-input");
  const dobInput = document.getElementById("dob-input");

  if (firstNameInput) {
    firstNameInput.addEventListener("input", validateInput);
  }

  if (lastNameInput) {
    lastNameInput.addEventListener("input", validateInput);
  }

  if (dobInput) {
    dobInput.addEventListener("input", validateInput);
  }
});

// Add this function to validate the students array integrity
function validateStudentsArray() {
  logDebug("Validating students array...");

  if (!Array.isArray(students)) {
    logDebug("Error: students is not an array!", typeof students);
    students = [];
    return false;
  }

  // Validate each student object structure
  const validationIssues = students.filter((student) => {
    if (!student.id) {
      logDebug("Student missing ID:", student);
      return true;
    }

    // Convert ID to string if it's not already
    student.id = String(student.id);

    // Check if onlineStatus is in expected format
    if (
      typeof student.onlineStatus !== "string" ||
      (!student.onlineStatus.includes("fa-check") &&
        !student.onlineStatus.includes("fa-xmark"))
    ) {
      logDebug("Student has invalid onlineStatus:", student);
      // Fix the status format
      student.onlineStatus = normalizeOnlineStatus(student.onlineStatus);
      return true;
    }

    return false;
  });

  if (validationIssues.length > 0) {
    logDebug(`Found ${validationIssues.length} student records with issues`);
    // Save the fixed array
    saveStudentsToCache();
    return false;
  }

  logDebug("Students array validated successfully");
  return true;
}

// Змінні для пагінації
let currentPage = 1;
const itemsPerPage = 5;
let totalPages = 1;
