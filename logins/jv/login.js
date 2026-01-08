// === loginRecepcionista.js ===
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginButton = document.querySelector(".login-btn");

  // Crear contenedor de mensaje de error general
  const errorMessage = document.createElement("p");
  errorMessage.classList.add("error-message");
  form.appendChild(errorMessage);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // Limpiar errores previos
    document.querySelectorAll(".input-error").forEach(el => el.remove());
    document.querySelectorAll(".input-group").forEach(g => g.classList.remove("error-border", "shake"));

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    let valido = true;

    // Validar campo de correo
    if (email === "") {
      showFieldError(emailInput, "Este campo no puede estar vacío");
      valido = false;
    }

    // Validar campo de contraseña
    if (password === "") {
      showFieldError(passwordInput, "Este campo no puede estar vacío");
      valido = false;
    }

    // Si hay errores, no continuar
    if (!valido) {
      showError("Los campos no deben estar vacíos.");
      return;
    }

    // Mostrar mensaje "Verificando..." con spinner
    loginButton.innerHTML = `<span class="spinner"></span> Verificando...`;
    loginButton.disabled = true;

    // Simular verificación de credenciales (2 segundos)
    setTimeout(() => {
      loginButton.innerHTML = "Iniciar Sesión";
      loginButton.disabled = false;

      // === VALIDACIÓN DE USUARIOS (simulada) ===
      if (email === "recepcionista@live.uleam.edu.ec" && password === "1234") {
        sessionStorage.setItem("rol", "Recepcionista");
        sessionStorage.setItem("nombre", "Lucía Andrade");
        sessionStorage.setItem("mostrarBienvenida", "true");
        window.location.href = "../interfaces/HTML/recepcionista.html";

      } else if (email === "enfermera@live.uleam.edu.ec" && password === "1234") {
        sessionStorage.setItem("rol", "Enfermera");
        sessionStorage.setItem("nombre", "María Pérez");
        sessionStorage.setItem("mostrarBienvenida", "true");
        window.location.href = "../interfaces/HTML/enfermera.html";

      } else if (email === "odontologa@live.uleam.edu.ec" && password === "1234") {
        sessionStorage.setItem("rol", "Odontóloga");
        sessionStorage.setItem("nombre", "Dra. María Fernanda López");
        sessionStorage.setItem("mostrarBienvenida", "true");
        window.location.href = "../interfaces/HTML/odontologa.html";

      } else {
        showError("Credenciales incorrectas. Intente nuevamente.");
        triggerShake(emailInput);
        triggerShake(passwordInput);
      }
    }, 2000);
  });

  // Mostrar/Ocultar contraseña
  const togglePassword = document.getElementById("togglePassword");
  togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.classList.toggle("fa-eye");
    togglePassword.classList.toggle("fa-eye-slash");
  });

  // --- Función para mostrar error general ---
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.color = "#e63946";
    errorMessage.style.opacity = "1";
    setTimeout(() => (errorMessage.style.opacity = "0"), 3000);
  }

  // --- Función para mostrar error en campo específico ---
  function showFieldError(input, message) {
    const group = input.closest(".input-group"); //  marcar el contenedor
    group.classList.add("error-border", "shake");

    // Eliminar mensaje previo si existe
    const prevError = group.nextElementSibling;
    if (prevError && prevError.classList.contains("input-error")) prevError.remove();

    // Crear nuevo mensaje
    const small = document.createElement("small");
    small.textContent = message;
    small.classList.add("input-error");
    group.insertAdjacentElement("afterend", small);

    setTimeout(() => {
      group.classList.remove("shake");
    }, 400);
  }

  // --- Función para activar animación shake en errores generales ---
  function triggerShake(input) {
    const group = input.closest(".input-group");
    group.classList.add("shake");
    setTimeout(() => group.classList.remove("shake"), 400);
  }
});
