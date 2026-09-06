const form = document.getElementById("register-form");
const message = document.getElementById("register-message");


form.addEventListener("submit", (event) => {

    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;


    if (password !== confirmPassword) {

        message.textContent = "As senhas não coincidem.";

        return;
    }


    console.log("Nome:", name);
    console.log("E-mail:", email);
    console.log("Senha:", password);

    message.textContent = "Cadastro válido!";

});