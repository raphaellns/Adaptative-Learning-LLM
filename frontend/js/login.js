const form = document.getElementById("login-form");
const message = document.getElementById("login-message");


form.addEventListener("submit", (event) => {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    console.log("E-mail:", email);
    console.log("Senha:", password);

    message.textContent = "Formulário enviado!";

});