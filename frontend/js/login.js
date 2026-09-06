console.log("login.js carregado!");

const form = document.getElementById("login-form");
const message = document.getElementById("login-message");


form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    message.textContent = "Entrando...";


    try {

        const response = await fetch("http://127.0.0.1:8000/auth/login", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })
        });


        const data = await response.json();


        if (!response.ok) {

            message.textContent = data.detail || "Erro ao fazer login.";

            return;
        }


        localStorage.setItem(
            "access_token",
            data.access_token
        );


        window.location.href = "dashboard.html";

    } catch (error) {

        message.textContent = "Não foi possível conectar com a API.";

        console.error(error);
    }
});