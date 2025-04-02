document.addEventListener("DOMContentLoaded", function () {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/project_lab1/service-worker.js")
      .then(() => console.log("Service Worker registered"))
      .catch((error) =>
        console.error("Service Worker registration failed:", error)
      );
  }

  let badge = document.getElementById("notification-badge");
  let bell = document.querySelector(".bell");

  function updateBadgeVisibility() {
    if (localStorage.getItem("notifications") === "hidden") {
      badge.style.display = "none";
    } else {
      badge.style.display = "block";
    }
  }

  updateBadgeVisibility();

  document.getElementById("bell-link").addEventListener("click", function () {
    badge.style.display = "none";
    localStorage.setItem("notifications", "hidden");
  });

  bell.addEventListener("dblclick", function () {
    bell.style.transition = "transform 0.5s ease";
    bell.style.transform = "rotate(360deg)";

    setTimeout(() => {
      badge.style.display = "block";
      localStorage.setItem("notifications", "visible");
    }, 500);
  });
});

function toggleMenu() {
  document.querySelector(".sidebar").classList.toggle("open");
}

document.addEventListener("DOMContentLoaded", function () {
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
  let students = JSON.parse(localStorage.getItem("students")) || [];

  function saveStudentsToCache() {
    localStorage.setItem("students", JSON.stringify(students));
  }

  function renderStudents() {
    tableBody.innerHTML = "";
    students.forEach((student) => {
      let row = document.createElement("tr");
      row.dataset.id = student.id;
      row.innerHTML = `
                <td><input type="checkbox" class="select-row" aria-label="Обрати рядок"></td>
                <td>${student.group}</td>
                <td>${student.name}</td>
                <td>${student.gender}</td>
                <td>${student.dob}</td>
                <td>${student.onlineStatus}</td>
                <td>
                    <button class="edit-btn" aria-label="Редагувати студента"><i class="fa-solid fa-pen"></i></button>
                    <button class="delete-btn" aria-label="Видалити студента"><i class="fa-solid fa-eraser"></i></button>
                </td>
            `;
      tableBody.appendChild(row);
    });

    updateCheckboxListeners();
    updateEventListeners();
  }

  addButton.addEventListener("click", function () {
    editingRow = null;
    document.getElementById("modal-title").textContent = "Додати студента";
    modal.style.display = "flex";
  });

  closeButton.addEventListener("click", () => (modal.style.display = "none"));
  cancelButton.addEventListener("click", () => (modal.style.display = "none"));

  saveButton.addEventListener("click", function () {
    let id = editingRow ? editingRow.dataset.id : Date.now().toString();
    let group = document.getElementById("group-select").value;
    let name = document.getElementById("name-input").value;
    let gender = document.getElementById("gender-select").value;
    let dob = document.getElementById("dob-input").value;
    let onlineStatus = document.getElementById("online-status").checked
        ? '<i class="fa-solid fa-check" style="color: green;"></i>'
        : '<i class="fa-solid fa-xmark" style="color: red;"></i>';

    if (!name || !dob) {
        alert("Будь ласка, заповніть всі поля.");
        return;
    }

    let student = { id, group, name, gender, dob, onlineStatus };

    console.log("Змінений/доданий студент:", JSON.stringify(student, null, 2));

    if (editingRow) {
        let index = students.findIndex(s => s.id === id);
        if (index !== -1) {
            students[index] = student;
        }
    } else {
        students.push(student);
    }

    saveStudentsToCache();
    renderStudents();
    modal.style.display = "none";
});

  function updateCheckboxListeners() {
    const checkboxes = document.querySelectorAll(".select-row");
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        selectAllCheckbox.checked = [...checkboxes].every((cb) => cb.checked);
      });
    });
  }

  selectAllCheckbox.addEventListener("change", function () {
    const checkboxes = document.querySelectorAll(".select-row");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = selectAllCheckbox.checked;
    });
  });

  function updateEventListeners() {
    document.querySelectorAll(".edit-btn").forEach((button) => {
      button.onclick = function () {
        let row = this.closest("tr");
        let id = row.dataset.id; // Отримуємо ID
        let student = students.find((s) => s.id === id);

        if (!student) return;

        editingRow = row;
        document.getElementById("group-select").value = student.group;
        document.getElementById("name-input").value = student.name;
        document.getElementById("gender-select").value = student.gender;
        document.getElementById("dob-input").value = student.dob;
        document.getElementById("online-status").checked =
          student.onlineStatus.includes("fa-check");

        document.getElementById("modal-title").textContent =
          "Редагувати студента";
        modal.style.display = "flex";
      };
    });

    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.onclick = function () {
        let selectedRows = document.querySelectorAll(".select-row:checked");
        if (selectedRows.length === 0) {
          alert("Оберіть хоча б одного студента для видалення!");
          return;
        }

        let studentNames = [];
        let studentIds = [];

        selectedRows.forEach((checkbox) => {
          let row = checkbox.closest("tr");
          studentIds.push(row.dataset.id); // Отримуємо ID
          let student = students.find((s) => s.id === row.dataset.id);
          if (student) {
            studentNames.push(student.name); // Отримуємо ім'я студента
          }
        });

        deleteStudentList.innerHTML = `Ви впевнені, що хочете видалити студентів: <br><b>${studentNames.join(
          ", "
        )}</b>?`;
        deleteModal.style.display = "flex";
      };
    });
  }

  deleteConfirmButton.addEventListener("click", function () {
    let selectedRows = document.querySelectorAll(".select-row:checked");
    let idsToDelete = [...selectedRows].map(
      (checkbox) => checkbox.closest("tr").dataset.id
    );

    students = students.filter((student) => !idsToDelete.includes(student.id));
    saveStudentsToCache();
    renderStudents();
    deleteModal.style.display = "none";
  });

  cancelDeleteButton.addEventListener("click", function () {
    deleteModal.style.display = "none";
  });

  closeDeleteButton.addEventListener("click", function () {
    deleteModal.style.display = "none";
  });

  renderStudents();
});

function showError(input, message) {
  input.classList.add("error");
  input.nextElementSibling.textContent = message;
  input.setCustomValidity(message);
}

function clearError(input) {
  input.classList.remove("error");
  input.nextElementSibling.textContent = "";
  input.setCustomValidity("");
}

function validateInput(event) {
  let input = event.target;
  let namePattern = /^[А-ЯІЇЄҐ][а-яіїєґ']+(\s[А-ЯІЇЄҐ][а-яіїєґ']+)*$/;
  let dobMaxDate = new Date("2024-01-01");
  let dobValue = new Date(input.value);

  clearError(input);

  if (input.id === "name-input" && !namePattern.test(input.value.trim())) {
    showError(
      input,
      "Ім'я має містити лише українські літери та починатися з великої."
    );
  }

  if (
    input.id === "dob-input" &&
    (dobValue >= dobMaxDate || isNaN(dobValue.getTime()))
  ) {
    showError(input, "Дата народження має бути до 2025 року.");
  }
}

document.getElementById("name-input").addEventListener("input", validateInput);
document.getElementById("dob-input").addEventListener("input", validateInput);

document
  .getElementById("saveButton")
  .addEventListener("click", function (event) {
    if (!document.querySelector(".error")) {
      modal.style.display = "none";
    } else {
      event.preventDefault();
    }
  });
