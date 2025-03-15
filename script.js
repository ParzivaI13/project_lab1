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
            bell.style.transform = "rotate(0deg)";
        }, 500);

        badge.style.display = "block";
        localStorage.setItem("notifications", "visible");
    });
});
