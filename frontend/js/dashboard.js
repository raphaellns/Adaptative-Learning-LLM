const menuButton = document.getElementById("menu-button");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

const menuItems = document.querySelectorAll(".menu-item[data-section]");
const sections = document.querySelectorAll(".content-section");

const userName = document.getElementById("user-name");
const userNameShort = document.getElementById("user-name-short");

const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profileInitial = document.getElementById("profile-initial");

const logoutButton = document.getElementById("logout-button");

const startExamButton = document.getElementById("start-exam-button");
const openExamButton = document.getElementById("open-exam-button");


const API_URL = "http://127.0.0.1:8000";


function openMenu() {

    sidebar.classList.add("open");
    overlay.classList.add("active");

}


function closeMenu() {

    sidebar.classList.remove("open");
    overlay.classList.remove("active");

}


function showSection(sectionName) {

    sections.forEach(section => {

        section.classList.remove("active-section");

    });


    menuItems.forEach(item => {

        item.classList.remove("active");

    });


    const selectedSection =
        document.getElementById(`${sectionName}-section`);

    const selectedMenuItem =
        document.querySelector(
            `.menu-item[data-section="${sectionName}"]`
        );


    if (selectedSection) {

        selectedSection.classList.add("active-section");

    }


    if (selectedMenuItem) {

        selectedMenuItem.classList.add("active");

    }


    closeMenu();

}


async function loadCurrentUser() {

    const token = localStorage.getItem("access_token");


    if (!token) {

        window.location.href = "login.html";

        return;

    }


    try {

        const response = await fetch(
            `${API_URL}/auth/me`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        if (!response.ok) {

            localStorage.removeItem("access_token");

            window.location.href = "login.html";

            return;
        }


        const user = await response.json();


        userName.textContent = user.name;

        userNameShort.textContent = user.name;

        profileName.textContent = user.name;

        profileEmail.textContent = user.email;

        profileInitial.textContent =
            user.name.charAt(0).toUpperCase();

    } catch (error) {

        console.error(error);

    }

}


menuButton.addEventListener(
    "click",
    openMenu
);


overlay.addEventListener(
    "click",
    closeMenu
);


menuItems.forEach(item => {

    item.addEventListener("click", () => {

        const section =
            item.dataset.section;

        showSection(section);

    });

});


document.querySelectorAll("[data-section]").forEach(button => {

    button.addEventListener("click", () => {

        const section = button.dataset.section;

        showSection(section);

    });

});


logoutButton.addEventListener("click", () => {

    localStorage.removeItem("access_token");

    window.location.href = "login.html";

});

startExamButton.addEventListener("click", () => {
    window.location.href = "exam.html";
});

openExamButton.addEventListener("click", () => {

    window.location.href = "exam.html";

});


loadCurrentUser();