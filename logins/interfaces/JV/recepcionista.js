// Carga inicial del JSON solo para sembrar localStorage
async function inicializarDataRecepcionista() {
  if (!localStorage.getItem("recepcionistaData")) {
    const res = await fetch("../data/recepcionista_data.json");
    const data = await res.json();
    localStorage.setItem("recepcionistaData", JSON.stringify(data));
    console.log("JSON inicial cargado en localStorage.");
  } else {
    console.log("Datos ya existen en localStorage.");
  }
}

inicializarDataRecepcionista();


// ===========================
// LÓGICA PRINCIPAL
// ===========================
document.addEventListener("DOMContentLoaded", () => { // recepcionista.js
  const newAppointmentBtn = document.getElementById("newAppointmentBtn"); // Botón para nueva cita
  const appointmentModal = document.getElementById("appointmentModal"); // Modal de nueva cita
  const closeModal = document.getElementById("closeModal"); // Botón para cerrar modal
  const appointmentForm = document.getElementById("appointmentForm"); // Formulario de cita
  const appointmentTable = document.getElementById("appointmentTable"); // Tabla de citas
  const registerBtn = document.querySelector(".register-btn"); // Botón de registro rápido
  const registerForm = document.querySelector(".register-form"); // Formulario de registro rápido
  const totalCitasEl = document.querySelector(".stat-box.total span"); // Estadística de citas
  const confirmedCitasEl = document.querySelector(".stat-box.confirmed span"); // Estadística de citas confirmadas
  const pendingCitasEl = document.querySelector(".stat-box.pending span");// Estadística de citas pendientes
  const welcomeMessage = document.querySelector(".welcome-message");// Mensaje de bienvenida

  
  //Descargar reportes
  document.getElementById("downloadJsonBtn").addEventListener("click", () => {

  const data = JSON.parse(localStorage.getItem("recepcionistaData")) || {};

  const total = data.citas?.length || 0;
  const confirmadas = data.citas?.filter(c => c.estado === "Confirmada").length || 0;
  const pendientes = total - confirmadas;

  const fechaHoy = new Date().toLocaleDateString("es-ES");

  const reporte = {
    fecha_reporte: fechaHoy,
    estadisticas: {
      total_citas: total,
      citas_confirmadas: confirmadas,
      citas_pendientes: pendientes
    },
    citas: data.citas || [],
    pacientes: data.pacientes || []
  };

  const blob = new Blob([JSON.stringify(reporte, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte_recepcionista_${fechaHoy.replace(/\//g, "-")}.json`;
  a.click();

  URL.revokeObjectURL(url);
});



  // 🔹 índice de la cita que se está editando (null = modo “nueva cita”)
  let indiceEdicion = null;


// === Mostrar mensaje de bienvenida solo al iniciar sesión ===
  window.addEventListener("load", () => {
    const mostrar = sessionStorage.getItem("mostrarBienvenida");
    if (mostrar !== "true") return; // si ya se mostró, no hacer nada

    const rol = sessionStorage.getItem("rol") || "Usuario";
    const nombre = sessionStorage.getItem("nombre") || "";
    const hora = new Date().toLocaleTimeString("es-EC", { hour: '2-digit', minute: '2-digit' });

    const toast = document.createElement("div");
    toast.classList.add("toast-bienvenida");
    toast.textContent = `👋 ¡Bienvenida ${rol} ${nombre}! Inicio de sesión: ${hora}`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "toastOut 0.5s forwards";
      setTimeout(() => toast.remove(), 500);
    }, 4000);

    // Desactivar la bienvenida para no repetirla
    sessionStorage.removeItem("mostrarBienvenida");
  });


  // Mostrar la fecha actual en formato español
  const dateElement = document.querySelector(".date");
  const hoy = new Date();
  const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const fechaFormateada = hoy.toLocaleDateString('es-ES', opciones);
  dateElement.textContent = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

  let citas = [];
  let pacientes = [];

  // ====== Cargar datos desde localStorage ======
  const dataGuardada = JSON.parse(localStorage.getItem("recepcionistaData")) || {
    pacientes: [],
    citas: []
  };

  citas = dataGuardada.citas;
  pacientes = dataGuardada.pacientes;

  // Renderizar citas iniciales
  renderCitas();
  actualizarEstadisticas();

  let bienvenidaMostrada = false;

  // ====== Mostrar / eliminar errores ======
  function mostrarError(input, mensaje) {
    eliminarError(input);
    const error = document.createElement("small");
    error.classList.add("error-msg");
    error.textContent = mensaje;
    input.insertAdjacentElement("afterend", error);
  }

  // ====== Eliminar mensaje de error ======
  function eliminarError(input) {
    const siguiente = input.nextElementSibling;
    if (siguiente && siguiente.classList.contains("error-msg")) {
      siguiente.remove();
    }
  }

  // ====== Guardar en localStorage ======
  function guardarEnLocalStorage() {
    const data = {
      pacientes: pacientes,
      citas: citas
    };
    localStorage.setItem("recepcionistaData", JSON.stringify(data));
  }

  // ====== Abrir y cerrar modal ======
  newAppointmentBtn.addEventListener("click", () => {
    // 🔹 modo “nueva cita”
    indiceEdicion = null;

    // limpiar formulario y errores
    appointmentForm.reset();
    appointmentForm.querySelectorAll(".error-msg").forEach(e => e.remove());

    appointmentModal.style.display = "flex";
    setTimeout(() => (appointmentModal.style.opacity = "1"), 10);
  });

  closeModal.addEventListener("click", closeAppointmentModal);
  appointmentModal.addEventListener("click", (e) => {
    if (e.target === appointmentModal) closeAppointmentModal();
  });

  function closeAppointmentModal() {
    appointmentModal.style.opacity = "0";
    setTimeout(() => (appointmentModal.style.display = "none"), 300);
  }

  // ====== Validaciones ======
  function validarNombre(input) {
    const valor = input.value.trim();
    const soloLetras = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ ]+$/;

    if (!soloLetras.test(valor)) {
      mostrarError(input, "Ingrese nombre completo");
      return false;
    }

    if (valor.length < 15) {
      mostrarError(input, "El nombre debe tener al menos 15 caracteres.");
      return false;
    }

    return true;
  }

  function validarTelefono(input) {
    const valor = input.value.trim();
    if (!/^09\d{8}$/.test(valor)) {
      mostrarError(input, "Ingrese un número de teléfono válido.");
      return false;
    }
    return true;
  }

  function validarCedula(input) {
    const valor = input.value.trim();
    if (!/^\d{10}$/.test(valor)) {
      mostrarError(input, "Ingrese un número de cédula válido.");
      return false;
    }
    return true;
  }

  function validarEdad(input) {
    const valor = parseInt(input.value);
    if (isNaN(valor) || valor < 0 || valor > 120) {
      mostrarError(input, "Ingrese una edad válida.");
      return false;
    }
    return true;
  }

  // ==========================
  // AGREGAR / EDITAR CITA
  // ==========================
  appointmentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let valido = true;

    const cedula = appointmentForm.querySelector('input[placeholder="Cédula del Paciente"]');
    const nombre = appointmentForm.querySelector('input[placeholder="Nombre completo"]');
    const fecha = document.getElementById("fecha");
    const hora = document.getElementById("hora");
    const consulta = document.getElementById("consulta");
    const sexo = appointmentForm.querySelector("#sexo");
    const edad = appointmentForm.querySelector("#edad");
    const telefono = appointmentForm.querySelector("#telefono");
    const email = appointmentForm.querySelector("#email");

    // 🔹 Limpiar errores anteriores
    appointmentForm.querySelectorAll(".error-msg").forEach(e => e.remove());
    const campos = [cedula, nombre, fecha, hora, consulta, sexo, edad, telefono, email];

    // 🔹 Validar campos vacíos con animación y color rojo
    campos.forEach(campo => {
      if (!campo.value.trim()) {
        mostrarError(campo, "Este campo es obligatorio.");
        valido = false;
        campo.classList.add("shake");
        setTimeout(() => campo.classList.remove("shake"), 500);
      }
    });

    if (!valido) return;

    // 🔹 Validaciones adicionales
    if (!validarCedula(cedula)) valido = false;
    if (!validarNombre(nombre)) valido = false;
    if (!validarEdad(edad)) valido = false;
    if (!validarTelefono(telefono)) valido = false;

    if (!valido) return;

    // 🔹 Crear/actualizar cita
    const estadoAnterior =
      indiceEdicion !== null && citas[indiceEdicion]
        ? citas[indiceEdicion].estado
        : "Pendiente";

    const nuevaCita = {
      cedula: cedula.value,
      paciente: nombre.value,
      fecha: fecha.value,
      hora: hora.value,
      consulta: consulta.value,
      sexo: sexo.value,
      edad: edad.value,
      telefono: telefono.value,
      email: email.value,
      estado: estadoAnterior
    };

    if (indiceEdicion === null) {
      // modo NUEVA CITA
      citas.push(nuevaCita);
    } else {
      // modo EDICIÓN
      citas[indiceEdicion] = nuevaCita;
    }

    guardarEnLocalStorage();
    renderCitas();
    actualizarEstadisticas();
    closeAppointmentModal();
    appointmentForm.reset();
    indiceEdicion = null;
  });


  // ==========================
  // RENDERIZAR CITAS
  // ==========================
  function renderCitas() {
    appointmentTable.innerHTML = "";
    citas.forEach((cita, index) => {
      const row = document.createElement("tr");
      row.dataset.index = index; // 🔹 para saber qué cita se edita/borra

      row.innerHTML = `
        <td>${cita.hora}</td>
        <td>${cita.paciente}</td>
        <td>${cita.consulta}</td>
        <td><span class="status pending">${cita.estado}</span></td>
        <td class="actions">
          <!-- 🔹 Botón editar -->
          <button class="btn-edit" title="Editar cita">
            <i class="fa-solid fa-pen"></i>
          </button>
          <!-- 🔹 Botón eliminar -->
          <button class="btn-delete" title="Eliminar cita">
            <i class="fa-solid fa-trash"></i>
          </button>
          <!-- Los que ya tenías -->
          <button title="Llamar"><i class="fa-solid fa-phone"></i></button>
          <button title="Enviar correo"><i class="fa-solid fa-envelope"></i></button>
        </td>
      `;
      appointmentTable.appendChild(row);
    });
  }

  // ==========================
  // MANEJO DE CLICK EN ACCIONES (EDITAR / ELIMINAR)
  // ==========================
  appointmentTable.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const fila = btn.closest("tr");
    const index = parseInt(fila.dataset.index, 10);
    if (isNaN(index)) return;

    // EDITAR
    if (btn.classList.contains("btn-edit")) {
      const cita = citas[index];
      if (!cita) return;

      indiceEdicion = index;

      // Cargar datos en el formulario
      const cedula = appointmentForm.querySelector('input[placeholder="Cédula del Paciente"]');
      const nombre = appointmentForm.querySelector('input[placeholder="Nombre completo"]');
      const fecha = document.getElementById("fecha");
      const hora = document.getElementById("hora");
      const consulta = document.getElementById("consulta");
      const sexo = appointmentForm.querySelector("#sexo");
      const edad = appointmentForm.querySelector("#edad");
      const telefono = appointmentForm.querySelector("#telefono");
      const email = appointmentForm.querySelector("#email");

      appointmentForm.querySelectorAll(".error-msg").forEach(e => e.remove());

      cedula.value   = cita.cedula   || "";
      nombre.value   = cita.paciente || "";
      fecha.value    = cita.fecha    || "";
      hora.value     = cita.hora     || "";
      consulta.value = cita.consulta || "";
      sexo.value     = cita.sexo     || "";
      edad.value     = cita.edad     || "";
      telefono.value = cita.telefono || "";
      email.value    = cita.email    || "";

      // Abrir modal en modo edición
      appointmentModal.style.display = "flex";
      setTimeout(() => (appointmentModal.style.opacity = "1"), 10);
    }

    // ELIMINAR
    if (btn.classList.contains("btn-delete")) {
      if (confirm("¿Desea eliminar esta cita?")) {
        citas.splice(index, 1);
        guardarEnLocalStorage();
        renderCitas();
        actualizarEstadisticas();
      }
    }
  });


  // ====== Actualizar estadísticas ======
  function actualizarEstadisticas() {
    const total = citas.length;
    const confirmadas = citas.filter((c) => c.estado === "Confirmada").length;
    const pendientes = total - confirmadas;

    totalCitasEl.textContent = total;
    confirmedCitasEl.textContent = confirmadas;
    pendingCitasEl.textContent = pendientes;
  }


  // ==========================
  // REGISTRO RÁPIDO DE PACIENTE
  // ==========================
  registerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    let valido = true;

    // Eliminar mensajes previos (errores o éxito)
    registerForm.querySelectorAll(".error-msg, .success-msg").forEach(e => e.remove());

    const inputs = registerForm.querySelectorAll("input, select");
    const [cedula, nombre, sexo, edad, telefono, correo] = inputs;

    // Validar vacíos con efecto visual
    inputs.forEach(input => {
      if (!input.value.trim()) {
        mostrarError(input, "Este campo no puede estar vacío");
        valido = false;
        input.classList.add("shake");
        setTimeout(() => input.classList.remove("shake"), 500);
      }
    });

    if (!valido) return;

    // Validaciones específicas
    if (!validarCedula(cedula)) valido = false;
    if (!validarNombre(nombre)) valido = false;
    if (!sexo.value) { mostrarError(sexo, "Seleccione el sexo."); valido = false; }
    if (!validarEdad(edad)) valido = false;
    if (!validarTelefono(telefono)) valido = false;
    if (correo.value.trim() === "") { mostrarError(correo, "Ingrese un correo válido."); valido = false; }

    if (!valido) return;

    // Agregar paciente
    pacientes.push({
      cedula: cedula.value,
      nombre: nombre.value,
      sexo: sexo.value,
      edad: edad.value,
      telefono: telefono.value,
      correo: correo.value
    });
    guardarEnLocalStorage();

    // Mostrar mensaje verde
    const success = document.createElement("p");
    success.classList.add("success-msg");
    success.textContent = "✅ Registro exitoso";
    registerForm.appendChild(success);

    // Vaciar formulario inmediatamente
    registerForm.reset();

    // Eliminar mensaje con animación y luego del DOM
    setTimeout(() => {
      success.style.transition = "opacity 0.5s ease";
      success.style.opacity = "0";
      setTimeout(() => {
        if (success && success.parentNode) {
          success.parentNode.removeChild(success);
        }
      }, 500);
    }, 2000);
  });

}); 


// ===========================
// MODAL DE CERRAR SESIÓN
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  const logoutLink = document.querySelector('.logout-link');
  const logoutModal = document.getElementById('logoutModal');
  const cancelLogout = document.getElementById('cancelLogout');
  const confirmLogout = document.getElementById('confirmLogout');

  if (!logoutLink || !logoutModal) return;

  // Abrir modal
  logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    logoutModal.style.display = 'flex';
    setTimeout(() => logoutModal.classList.add('show'), 10);
  });

  // Cerrar con botón "Cancelar"
  cancelLogout.addEventListener('click', () => {
    logoutModal.classList.remove('show');
    setTimeout(() => (logoutModal.style.display = 'none'), 200);
  });

  // Confirmar cierre
  confirmLogout.addEventListener('click', () => {
    logoutModal.classList.remove('show');
    setTimeout(() => {
      window.location.href = '../../html/loginRecepcionista.html';
    }, 200);
  });

  // Cerrar al hacer clic fuera
  window.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
      logoutModal.classList.remove('show');
      setTimeout(() => (logoutModal.style.display = 'none'), 200);
    }
  });
});
