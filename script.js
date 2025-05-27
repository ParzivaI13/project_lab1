// Student Management System - Refactored
class StudentManager {
  constructor() {
    this.students = [];
    this.serverConnected = false;
    this.editingRow = null;
    this.currentPage = 1;
    this.itemsPerPage = 5;
    this.totalPages = 1;
    
    this.initializeElements();
    this.bindEvents();
    this.initializeSystem();
  }

  // Initialize DOM elements
  initializeElements() {
    this.elements = {
      modal: document.getElementById("student-modal"),
      deleteModal: document.getElementById("delete-modal"),
      tableBody: document.querySelector(".students-table tbody"),
      selectAllCheckbox: document.getElementById("select-all"),
      deleteStudentList: document.getElementById("delete-student-list"),
      addButton: document.querySelector(".add-student-btn"),
      saveButton: document.querySelector(".save-btn"),
      cancelButton: document.querySelector(".cancel-btn"),
      closeButton: document.querySelector(".close-btn"),
      closeDeleteButton: document.querySelector(".close-delete-btn"),
      deleteConfirmButton: document.querySelector(".confirm-delete-btn"),
      cancelDeleteButton: document.querySelector(".cancel-delete-btn")
    };

    this.inputs = {
      group: document.getElementById("group-select"),
      firstName: document.getElementById("first-name-input"),
      lastName: document.getElementById("last-name-input"),
      gender: document.getElementById("gender-select"),
      dob: document.getElementById("dob-input"),
      onlineStatus: document.getElementById("online-status")
    };
  }

  // Bind all event listeners
  bindEvents() {
    const { elements } = this;
    
    if (elements.addButton) elements.addButton.onclick = () => this.openModal();
    if (elements.closeButton) elements.closeButton.onclick = () => this.closeModal();
    if (elements.cancelButton) elements.cancelButton.onclick = () => this.closeModal();
    if (elements.saveButton) elements.saveButton.onclick = () => this.saveStudent();
    
    // Delete modal events
    if (elements.closeDeleteButton) elements.closeDeleteButton.onclick = () => this.closeDeleteModal();
    if (elements.cancelDeleteButton) elements.cancelDeleteButton.onclick = () => this.closeDeleteModal();
    if (elements.deleteConfirmButton) elements.deleteConfirmButton.onclick = () => this.confirmDelete();
    
    // Select all checkbox
    if (elements.selectAllCheckbox) {
      elements.selectAllCheckbox.onchange = () => this.toggleSelectAll();
    }

    // Form validation
    ['firstName', 'lastName', 'dob'].forEach(field => {
      if (this.inputs[field]) {
        this.inputs[field].addEventListener("input", this.validateInput.bind(this));
      }
    });
  }

  // Initialize system
  async initializeSystem() {
    this.logDebug("Початок завантаження даних");
    const isConnected = await this.checkServerConnection();
    this.logDebug("Результат перевірки з'єднання:", isConnected);
    if (isConnected) {
      await this.loadStudents();
    }
  }

  // Logging utility
  logDebug(message, data) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    if (data !== undefined) {
      try {
        const clonedData = typeof data === "object" && data !== null 
          ? JSON.parse(JSON.stringify(data)) 
          : data;
        console.log(logMessage, clonedData);
      } catch (e) {
        console.log(logMessage, "Unable to stringify object:", data);
      }
    } else {
      console.log(logMessage);
    }
  }

  // Server connection check
  async checkServerConnection() {
    this.logDebug("Перевірка з'єднання з сервером...");
    
    try {
      const response = await fetch("check_connection.php");
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      const data = await response.json();
      this.logDebug("Відповідь від сервера:", data);
      
      if (data.status === "success") {
        this.serverConnected = true;
        this.logDebug("З'єднання з сервером успішне");
        return true;
      } else {
        throw new Error(data.message || "З'єднання невдале");
      }
    } catch (error) {
      this.serverConnected = false;
      this.logDebug("Помилка з'єднання з сервером:", error);
      this.loadFromCache();
      return false;
    }
  }

  // Load students from cache
  loadFromCache() {
    const cachedData = localStorage.getItem("students");
    if (cachedData) {
      this.logDebug("Знайдено початковий кеш, відображаємо його");
      this.students = JSON.parse(cachedData) || [];
      this.renderStudents();
    }
  }

  // Data normalization utilities
  normalizeOnlineStatus(status) {
    this.logDebug("Normalizing status value:", status);
    
    const isTruthy = status === "1" || status === 1 || status === true ||
      (typeof status === "string" && (status.includes("fa-check") || status.toLowerCase() === "true"));
    
    return isTruthy 
      ? '<i class="fa-solid fa-check" style="color: green;"></i>'
      : '<i class="fa-solid fa-xmark" style="color: red;"></i>';
  }

  getStatusAsBool(status) {
    this.logDebug("Checking status value:", status);
    
    const result = status === "1" || status === 1 || status === true ||
      (typeof status === "string" && (status.includes("fa-check") || status.toLowerCase() === "true"));
    
    this.logDebug("Status evaluated as:", result);
    return result;
  }

  // Cache operations
  saveStudentsToCache() {
    localStorage.setItem("students", JSON.stringify(this.students));
  }

  // Error handling
  displayErrorMessage(message) {
    alert(`Помилка: ${message}`);
    console.error(message);
  }

  // Student CRUD operations
  async addStudent(student) {
    if (!this.serverConnected) {
      student.id = Date.now().toString();
      this.students.push(student);
      this.saveStudentsToCache();
      this.renderStudents();
      return { success: true, id: student.id };
    }

    return this.sendRequest("POST", student);
  }

  async updateStudent(student) {
    if (!this.serverConnected) {
      const index = this.students.findIndex(s => String(s.id) === String(student.id));
      if (index !== -1) {
        this.students[index] = student;
        this.saveStudentsToCache();
        this.renderStudents();
      }
      return { success: true };
    }

    const response = await this.sendRequest("PUT", student);
    if (response.success) {
      const index = this.students.findIndex(s => String(s.id) === String(student.id));
      if (index !== -1) {
        this.students[index] = student;
        this.saveStudentsToCache();
        this.renderStudents();
      } else {
        await this.loadStudents();
      }
    }
    return response;
  }

  async deleteStudents(ids) {
    if (!this.serverConnected) {
      this.students = this.students.filter(student => !ids.includes(String(student.id)));
      this.saveStudentsToCache();
      this.renderStudents();
      return { success: true };
    }

    const response = await this.sendRequest("POST", { action: "delete_multiple", ids });
    if (response.success) {
      await this.loadStudents();
    }
    return response;
  }

  // Generic server request handler
  async sendRequest(method, data) {
    this.logDebug(`${method} запит на сервер:`, data);
    
    try {
      const response = await fetch("students.php", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      const result = await response.json();
      this.logDebug(`Відповідь від сервера (${method}):`, result);
      
      if (method === "POST" && result.success && result.id) {
        await this.loadStudents();
      }
      
      return result;
    } catch (error) {
      this.logDebug(`Помилка ${method} запиту:`, error);
      this.displayErrorMessage(`Помилка ${method === 'POST' ? 'додавання/видалення' : 'оновлення'}: ${error.message}`);
      throw error;
    }
  }

  // Load students from server
  async loadStudents() {
    this.logDebug("Loading students from server...");
    
    try {
      const response = await fetch("students.php");
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      const data = await response.json();
      this.logDebug("Raw student data from server:", data);

      this.students = data.map(student => ({
        id: String(student.id),
        group: student.group || "",
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        gender: student.gender || "",
        dob: student.dob || "",
        onlineStatus: this.normalizeOnlineStatus(student.onlineStatus)
      }));

      this.logDebug("Normalized students array:", this.students);
      this.saveStudentsToCache();
      this.renderStudents();
      return this.students;
    } catch (error) {
      this.logDebug("Error loading students:", error);
      this.loadFromCache();
      return this.students;
    }
  }

  // Render students table
  renderStudents() {
    if (!this.elements.tableBody) return;
    
    this.elements.tableBody.innerHTML = "";
    this.logDebug("Відображення студентів:", this.students);

    this.calculatePagination();
    const { startIndex, endIndex } = this.getPaginationRange();

    for (let i = startIndex; i < endIndex; i++) {
      const student = this.students[i];
      const statusIcon = this.normalizeOnlineStatus(student.onlineStatus);
      
      const row = this.createStudentRow(student, statusIcon);
      this.elements.tableBody.appendChild(row);
    }

    this.updateEventListeners();
    this.updatePagination();
  }

  // Create student table row
  createStudentRow(student, statusIcon) {
    const row = document.createElement("tr");
    row.dataset.id = String(student.id);
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
    return row;
  }

  // Pagination utilities
  calculatePagination() {
    this.totalPages = Math.ceil(this.students.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
  }

  getPaginationRange() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.students.length);
    return { startIndex, endIndex };
  }

  updatePagination() {
    // Pagination button updates would go here
    // Implementation depends on your HTML structure
  }

  // Event handlers
  updateEventListeners() {
    // Edit buttons
    document.querySelectorAll(".edit-btn").forEach(button => {
      button.onclick = () => this.editStudent(button);
    });

    // Delete buttons
    document.querySelectorAll(".delete-btn").forEach(button => {
      button.onclick = () => this.deleteStudent(button);
    });

    // Checkbox listeners
    document.querySelectorAll(".select-row").forEach(checkbox => {
      checkbox.onchange = () => this.updateSelectAllState();
    });

    // Pagination buttons
    this.bindPaginationEvents();
  }

  bindPaginationEvents() {
    document.querySelectorAll(".page-btn:not(.prev-btn):not(.next-btn)").forEach(button => {
      button.onclick = () => {
        this.currentPage = parseInt(button.textContent);
        this.renderStudents();
      };
    });

    const prevButton = document.querySelector(".prev-btn");
    const nextButton = document.querySelector(".next-btn");

    if (prevButton) {
      prevButton.onclick = () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderStudents();
        }
      };
    }

    if (nextButton) {
      nextButton.onclick = () => {
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          this.renderStudents();
        }
      };
    }
  }

  // Modal operations
  openModal() {
    if (!checkAuth()) return;
    
    this.editingRow = null;
    document.getElementById("modal-title").textContent = "Додати студента";
    this.clearForm();
    this.elements.modal.style.display = "flex";
  }

  closeModal() {
    this.elements.modal.style.display = "none";
  }

  closeDeleteModal() {
    this.elements.deleteModal.style.display = "none";
  }

  clearForm() {
    Object.values(this.inputs).forEach(input => {
      if (input) {
        if (input.type === "checkbox") {
          input.checked = false;
        } else {
          input.value = input.type === "select-one" ? (input.options[0]?.value || "") : "";
        }
      }
    });
  }

  // Student operations
  editStudent(button) {
    if (!checkAuth()) return;
    
    const row = button.closest("tr");
    const id = String(row.dataset.id);
    const student = this.students.find(s => String(s.id) === id);

    if (!student) {
      this.logDebug("Error: Student not found for editing with ID:", id);
      alert("Не вдалося знайти студента для редагування.");
      return;
    }

    this.logDebug("Found student for editing:", student);
    this.editingRow = row;
    this.populateForm(student);
    document.getElementById("modal-title").textContent = "Редагувати студента";
    this.elements.modal.style.display = "flex";
  }

  populateForm(student) {
    this.inputs.group.value = student.group || "ПЗ-11";
    this.inputs.firstName.value = student.firstName || "";
    this.inputs.lastName.value = student.lastName || "";
    this.inputs.gender.value = student.gender || "Чоловіча";
    this.inputs.dob.value = student.dob || "";
    this.inputs.onlineStatus.checked = this.getStatusAsBool(student.onlineStatus);
  }

  deleteStudent(button) {
    if (!checkAuth()) return;
    
    const row = button.closest("tr");
    const checkbox = row.querySelector(".select-row");
    checkbox.checked = true;
    this.showDeleteConfirmation();
  }

  async saveStudent() {
    const studentData = this.getFormData();
    if (!this.validateFormData(studentData)) return;

    if (this.checkDuplicateStudent(studentData)) {
      this.displayErrorMessage("Студент з таким іменем, прізвищем та датою народження вже існує.");
      return;
    }

    try {
      const response = this.editingRow 
        ? await this.updateStudent(studentData)
        : await this.addStudent(studentData);

      if (response.success) {
        this.closeModal();
      } else {
        const message = response.error_code === "duplicate_student"
          ? "Дублікат: Студент з таким іменем, прізвищем та датою народження вже існує"
          : response.message || "Невідома помилка";
        this.displayErrorMessage(message);
      }
    } catch (error) {
      this.logDebug("Помилка при збереженні студента:", error);
    }
  }

  getFormData() {
    return {
      id: this.editingRow ? this.editingRow.dataset.id : null,
      group: this.inputs.group.value,
      firstName: this.inputs.firstName.value.trim(),
      lastName: this.inputs.lastName.value.trim(),
      gender: this.inputs.gender.value,
      dob: this.inputs.dob.value,
      onlineStatus: this.inputs.onlineStatus.checked
        ? '<i class="fa-solid fa-check" style="color: green;"></i>'
        : '<i class="fa-solid fa-xmark" style="color: red;"></i>'
    };
  }

  validateFormData(data) {
    if (!data.firstName || !data.lastName || !data.dob) {
      alert("Будь ласка, заповніть всі поля.");
      return false;
    }
    return true;
  }

  checkDuplicateStudent({ id, firstName, lastName, dob }) {
    return this.students.some(student =>
      student.firstName.toLowerCase() === firstName.toLowerCase() &&
      student.lastName.toLowerCase() === lastName.toLowerCase() &&
      student.dob === dob &&
      String(student.id) !== String(id)
    );
  }

  // Selection operations
  toggleSelectAll() {
    const checkboxes = document.querySelectorAll(".select-row");
    checkboxes.forEach(checkbox => {
      checkbox.checked = this.elements.selectAllCheckbox.checked;
    });
  }

  updateSelectAllState() {
    const checkboxes = document.querySelectorAll(".select-row");
    if (this.elements.selectAllCheckbox) {
      this.elements.selectAllCheckbox.checked = [...checkboxes].every(cb => cb.checked);
    }
  }

  // Delete confirmation
  showDeleteConfirmation() {
    if (!checkAuth()) return;
    
    const selectedRows = document.querySelectorAll(".select-row:checked");
    if (selectedRows.length === 0) {
      alert("Оберіть хоча б одного студента для видалення!");
      return;
    }

    const { studentNames } = this.getSelectedStudentInfo(selectedRows);
    this.elements.deleteStudentList.innerHTML = 
      `Ви впевнені, що хочете видалити студентів: <br><b>${studentNames.join(", ")}</b>?`;
    this.elements.deleteModal.style.display = "flex";
  }

  getSelectedStudentInfo(selectedRows) {
    const studentNames = [];
    const studentIds = [];

    selectedRows.forEach(checkbox => {
      const row = checkbox.closest("tr");
      const id = String(row.dataset.id);
      studentIds.push(id);

      const student = this.students.find(s => String(s.id) === id);
      const name = student 
        ? `${student.firstName} ${student.lastName}`
        : row.cells[2].textContent.trim();
      studentNames.push(name);
    });

    return { studentNames, studentIds };
  }

  async confirmDelete() {
    const selectedRows = document.querySelectorAll(".select-row:checked");
    const { studentIds } = this.getSelectedStudentInfo(selectedRows);

    try {
      const response = await this.deleteStudents(studentIds);
      if (response.success) {
        this.closeDeleteModal();
      } else {
        this.displayErrorMessage(response.message || "Невідома помилка при видаленні");
      }
    } catch (error) {
      this.logDebug("Помилка при видаленні студентів:", error);
    }
  }

  // Form validation
  validateInput(event) {
    const input = event.target;
    const namePattern = /^[А-ЯІЇЄҐ][а-яіїєґ']+([-'][А-ЯІЇЄҐ][а-яіїєґ']+)?(\s[А-ЯІЇЄҐ][а-яіїєґ']+([-'][А-ЯІЇЄҐ][а-яіїєґ']+)*)*$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nulpPattern = /^[^@\s]+@nulp\.ua$/;
    
    this.clearError(input);

    if (input.id === "first-name-input" || input.id === "last-name-input") {
      const value = input.value.trim();
      
      if (nulpPattern.test(value)) {
        this.showError(input, "Вітаю, друже політехнік, ти ввів невірні дані");
        return;
      }
      
      if (emailPattern.test(value)) {
        this.showError(input, "Здається, ви ввели email замість імені.");
        return;
      }

      if (!namePattern.test(value) && value.length > 0) {
        this.showError(input, "Ім'я та прізвище можуть містити лише українські літери, починатися з великої, а також містити дефіс або апостроф.");
        return;
      }
    }

    if (input.id === "dob-input" && input.value) {
      const dobValue = new Date(input.value);
      const dobMaxDate = new Date("2025-01-01");
      
      if (dobValue >= dobMaxDate || isNaN(dobValue.getTime())) {
        this.showError(input, "Дата народження має бути до 2025 року.");
      }
    }
  }

  showError(input, message) {
    input.classList.add("error");
    const errorElement = input.nextElementSibling;
    if (errorElement?.classList.contains("error-message")) {
      errorElement.textContent = message;
    }
    input.setCustomValidity(message);
  }

  clearError(input) {
    input.classList.remove("error");
    const errorElement = input.nextElementSibling;
    if (errorElement?.classList.contains("error-message")) {
      errorElement.textContent = "";
    }
    input.setCustomValidity("");
  }
}

// Authentication check function (kept separate as it's used globally)
function checkAuth() {
  if (!localStorage.getItem("isLoggedIn")) {
    document.getElementById("login-modal").style.display = "flex";
    return false;
  }
  return true;
}

// Menu toggle
function toggleMenu() {
  document.querySelector(".sidebar").classList.toggle("open");
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Service Worker registration
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/project_lab1/service-worker.js")
      .then(() => console.log("Service Worker registered"))
      .catch((error) => console.error("Service Worker registration failed:", error));
  }

  // Initialize student management only if on students page
  if (document.querySelector(".students-table")) {
    window.studentManager = new StudentManager();
  }
});