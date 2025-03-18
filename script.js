document.addEventListener("DOMContentLoaded", function () {
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

    addButton.addEventListener("click", function () {
        editingRow = null;
        document.getElementById("modal-title").textContent = "Додати студента";
        modal.style.display = "flex";
    });

    closeButton.addEventListener("click", () => modal.style.display = "none");
    cancelButton.addEventListener("click", () => modal.style.display = "none");

    saveButton.addEventListener("click", function () {
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

        if (editingRow) {
            editingRow.cells[1].textContent = group;
            editingRow.cells[2].textContent = name;
            editingRow.cells[3].textContent = gender;
            editingRow.cells[4].textContent = dob;
            editingRow.cells[5].innerHTML = onlineStatus;
            editingRow = null;
        } else {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td><input type="checkbox" class="select-row"></td>
                <td>${group}</td>
                <td>${name}</td>
                <td>${gender}</td>
                <td>${dob}</td>
                <td>${onlineStatus}</td>
                <td>
                    <button class="edit-btn"><i class="fa-solid fa-pen"></i></button>
                    <button class="delete-btn"><i class="fa-solid fa-eraser"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        }

        modal.style.display = "none";
        updateCheckboxListeners();
        updateEventListeners();
    });

    function updateCheckboxListeners() {
        const checkboxes = document.querySelectorAll(".select-row");
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener("change", function () {
                selectAllCheckbox.checked = [...checkboxes].every(cb => cb.checked);
            });
        });
    }

    selectAllCheckbox.addEventListener("change", function () {
        const checkboxes = document.querySelectorAll(".select-row");
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    function updateEventListeners() {
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.onclick = function () {
                let row = this.closest("tr");
                let selectedRows = document.querySelectorAll(".select-row:checked");

                if (selectedRows.length !== 1) {
                    alert("Оберіть одного студента для редагування!");
                    return;
                }

                editingRow = row;
                document.getElementById("group-select").value = row.cells[1].textContent;
                document.getElementById("name-input").value = row.cells[2].textContent;
                document.getElementById("gender-select").value = row.cells[3].textContent;
                document.getElementById("dob-input").value = row.cells[4].textContent;
                document.getElementById("online-status").checked = row.cells[5].innerHTML.includes("fa-check");

                document.getElementById("modal-title").textContent = "Редагувати студента";
                modal.style.display = "flex";
            };
        });

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.onclick = function () {
                let selectedRows = document.querySelectorAll(".select-row:checked");
                if (selectedRows.length === 0) {
                    alert("Оберіть хоча б одного студента для видалення!");
                    return;
                }
                let studentNames = [];
                selectedRows.forEach(checkbox => {
                    let row = checkbox.closest("tr");
                    studentNames.push(row.cells[2].textContent);
                });
                deleteStudentList.innerHTML = "Ви впевнені, що хочете видалити наступних студентів?<br><b>" + studentNames.join(", ") + "</b>";
                deleteModal.style.display = "flex";
            };
        });
    }

    deleteConfirmButton.addEventListener("click", function () {
        document.querySelectorAll(".select-row:checked").forEach(checkbox => {
            checkbox.closest("tr").remove();
        });
        deleteModal.style.display = "none";
    });

    cancelDeleteButton.addEventListener("click", function () {
        deleteModal.style.display = "none";
    });

    closeDeleteButton.addEventListener("click", function () {
        deleteModal.style.display = "none";
    });

    updateCheckboxListeners();
    updateEventListeners();
});