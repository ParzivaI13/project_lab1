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
            bell.style.transform = "rotate(360deg)";
        }, 500);

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
    const deleteButton = document.querySelector(".delete-selected-btn");
    const modal = document.getElementById("student-modal");
    const closeButton = document.querySelector(".close-btn");
    const saveButton = document.querySelector(".save-btn");
    const cancelButton = document.querySelector(".cancel-btn");
    const tableBody = document.querySelector(".students-table tbody");
    const selectAllCheckbox = document.getElementById("select-all");

    let editingRow = null;

    // додавання
    addButton.addEventListener("click", function () {
        editingRow = null;
        document.getElementById("modal-title").textContent = "Додати студента";
        modal.style.display = "flex";
    });

    // закриття модального вікна
    closeButton.addEventListener("click", () => modal.style.display = "none");
    cancelButton.addEventListener("click", () => modal.style.display = "none");

    // додавання або редагування студента
    saveButton.addEventListener("click", function () {
        let group = document.getElementById("group-select").value;
        let name = document.getElementById("name-input").value;
        let gender = document.getElementById("gender-select").value;
        let dob = document.getElementById("dob-input").value;
        let onlineStatus = document.getElementById("online-status").checked ? "✅" : "❌";

        if (!name || !dob) {
            alert("Будь ласка, заповніть всі поля.");
            return;
        }

        if (editingRow) {
            editingRow.innerHTML = `
                <td><input type="checkbox" class="select-row"></td>
                <td>${group}</td>
                <td>${name}</td>
                <td>${gender}</td>
                <td>${dob}</td>
                <td>${onlineStatus}</td>
                <td>
                    <button class="edit-btn">Редагувати</button>
                    <button class="delete-btn">Видалити</button>
                </td>
            `;
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
                    <button class="edit-btn">Редагувати</button>
                    <button class="delete-selected-btn">Видалити</button>
                </td>
            `;
            tableBody.appendChild(row);
        }

        modal.style.display = "none";
    });

    deleteButton.addEventListener("click", function () {
        document.querySelectorAll(".select-row:checked").forEach(checkbox => {
            checkbox.closest("tr").remove();
        });
    });
});
