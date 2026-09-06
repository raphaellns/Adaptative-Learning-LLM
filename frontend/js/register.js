const form = document.getElementById("register-form");
const message = document.getElementById("register-message");


form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;


    if (password !== confirmPassword) {

        message.textContent = "As senhas não coincidem.";

        return;
    }


    message.textContent = "Criando conta...";


    try {

        const response = await fetch(
            "http://127.0.0.1:8000/auth/register",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            let errorMessage = "Erro ao criar conta.";

            if (typeof data.detail === "string") {

                errorMessage = data.detail;

            } else if (Array.isArray(data.detail)) {

                errorMessage = data.detail
                    .map(error => error.msg)
                    .join(", ");
            }

            message.textContent = errorMessage;

            return;
        }


        message.textContent =
            "Conta criada com sucesso! Redirecionando...";


        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000);

    } catch (error) {

        message.textContent =
            "Não foi possível conectar com a API.";

        console.error(error);
    }
});