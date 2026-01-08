document.addEventListener("DOMContentLoaded", () => {
  const welcomeMessage = document.querySelector(".welcome-message");
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");

  // === Mostrar mensaje de bienvenida solo al iniciar sesión ===
  window.addEventListener("load", () => {
    const mostrar = sessionStorage.getItem("mostrarBienvenida");
    if (mostrar !== "true") return;

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

    sessionStorage.removeItem("mostrarBienvenida");
  });

  // ===== Tabs =====
  const tabEspera = document.getElementById("tab-espera");
  const tabSignos = document.getElementById("tab-signos");
  const contentEspera = document.getElementById("content-espera");
  const contentSignos = document.getElementById("content-signos");

  // Pestaña por defecto
  tabEspera.addEventListener("click", () => { 
    tabEspera.classList.add("active");
    tabSignos.classList.remove("active");
    contentEspera.classList.add("active");
    contentSignos.classList.remove("active");
  });

  tabSignos.addEventListener("click", () => {
    tabSignos.classList.add("active");
    tabEspera.classList.remove("active");
    contentSignos.classList.add("active");
    contentEspera.classList.remove("active");
  });

  // Alternar pestañas
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      contents[index].classList.add("active");
    });
  });

  // ===== Botón Preparar =====
  const prepareBtn = document.querySelector(".prepare-btn");
  const estadoCell = document.querySelector(".estado");

  prepareBtn.addEventListener("click", () => {
    tabSignos.classList.add("active");
    tabEspera.classList.remove("active");
    contentSignos.classList.add("active");
    contentEspera.classList.remove("active");
  });

  // ===== Validación de Signos Vitales =====
  const saveBtn = document.querySelector(".save-btn");
  const presionInput = document.getElementById("presion");
  const pulsoInput = document.getElementById("pulso");
  const tempInput = document.getElementById("temperatura");
  const observaciones = document.getElementById("observaciones");
  const historyTable = document.querySelector(".history-table tbody");
  const alertasContainer = document.querySelector(".alerts");

  // Formateo automático de presión (añade "/" después de 3 dígitos)
  presionInput.addEventListener("input", () => {
    let val = presionInput.value.replace(/\D/g, "");
    if (val.length > 3) val = val.slice(0, 3) + "/" + val.slice(3);
    presionInput.value = val;
  });

  // Solo números válidos en pulso y temperatura
  [pulsoInput, tempInput].forEach(input => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^\d.]/g, "");
    });
  });

  saveBtn.addEventListener("click", (e) => {
    e.preventDefault();
    clearErrors();

    let valid = true;
    const presionRegex = /^\d{2,3}\/\d{2,3}$/;
    const pulso = parseInt(pulsoInput.value);
    const temp = parseFloat(tempInput.value);

    // === Validar campos vacíos ===
    [presionInput, pulsoInput, tempInput].forEach(input => {
      if (!input.value.trim()) {
        showError(input, "Este campo es obligatorio.");
        valid = false;
        input.classList.add("shake");
        setTimeout(() => input.classList.remove("shake"), 400);
      }
    });

    // === Validaciones adicionales ===
    if (!presionRegex.test(presionInput.value.trim())) {
      showError(presionInput, "Formato incorrecto (Ej: 120/80)");
      valid = false;
    }

    if (isNaN(pulso) || pulso < 40 || pulso > 190) {
      showError(pulsoInput, "Pulso fuera de rango (40-190 bpm)");
      valid = false;
    }

    if (isNaN(temp) || temp < 34 || temp > 42) {
      showError(tempInput, "Temperatura fuera de rango (34°C - 42°C)");
      valid = false;
    }

    if (!valid) return;

    // ===== Guardado correcto =====
    estadoCell.innerHTML = `<span class="badge success"><i class="fa-solid fa-check"></i> Preparado</span>`;

    const fecha = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    let observacionTexto = observaciones.value.trim() || "Ninguna";
    let observacionHTML = `<td>${observacionTexto}</td>`;

    // === Cambiar botón de acción ===
    const accionCell = prepareBtn.closest("tr").querySelector("td:last-child");
    accionCell.innerHTML = `<button class="details-btn"><i class="fa-solid fa-eye"></i> Ver Detalles</button>`;

    // === Datos del paciente ===
    const patientData = {
      nombre: "Laura Torres",
      edad: "45 años",
      hora: "09:00",
      telefono: " ",
      presion: presionInput.value,
      pulso: pulsoInput.value + " bpm",
      temperatura: tempInput.value + "°C",
      observaciones: observaciones.value.trim() || "Ninguna",
    };

    // === Evento "Ver detalles" ===
    const detailsBtn = accionCell.querySelector(".details-btn");
    detailsBtn.addEventListener("click", () => {
      document.getElementById("detailsModal").style.display = "flex";
      document.getElementById("det-nombre").textContent = patientData.nombre;
      document.getElementById("det-edad").textContent = patientData.edad;
      document.getElementById("det-hora").textContent = patientData.hora;
      document.getElementById("det-telefono").textContent = patientData.telefono;
      document.getElementById("det-presion").textContent = patientData.presion;
      document.getElementById("det-pulso").textContent = patientData.pulso;
      document.getElementById("det-temp").textContent = patientData.temperatura;
      document.getElementById("det-observaciones").textContent = patientData.observaciones;
      document.getElementById("det-alerta").textContent = /alerg/i.test(patientData.observaciones)
        ? patientData.observaciones
        : "Ninguna";
    });

    document.querySelector(".close-details").addEventListener("click", () => {
      document.getElementById("detailsModal").style.display = "none";
      document.body.classList.remove("modal-open");
    });

    window.addEventListener("click", (e) => {
      const modal = document.getElementById("detailsModal");
      if (e.target === modal) {
        modal.style.display = "none";
        document.body.classList.remove("modal-open");
      }
    });

    // === Si contiene "alergia" ===
    if (/alerg/i.test(observacionTexto)) {
      observacionHTML = `<td style="color: red; font-weight: 600;">${observacionTexto}</td>`;
      const alerta = document.createElement("div");
      alerta.className = "alert-box red";
      alerta.innerHTML = `<strong>Laura Torres</strong><p>${observacionTexto}</p>`;
      alertasContainer.appendChild(alerta);
    }

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>Laura Torres</td>
      <td>${fecha}</td>
      <td>--</td>
      ${observacionHTML}
    `;
    historyTable.appendChild(fila);

    // === Mensaje de éxito tipo toast ===
    const success = document.createElement("div");
    success.classList.add("toast-success");
    success.textContent = "✅ Signos vitales registrados correctamente";
    document.body.appendChild(success);

    setTimeout(() => {
      success.style.opacity = "0";
      setTimeout(() => success.remove(), 600);
    }, 2500);

    // Limpiar campos
    observaciones.value = "";
    presionInput.value = "";
    pulsoInput.value = "";
    tempInput.value = "";

    // === Regresa automáticamente a sala de espera ===
    setTimeout(() => {
      tabEspera.classList.add("active");
      tabSignos.classList.remove("active");
      contentEspera.classList.add("active");
      contentSignos.classList.remove("active");
    }, 2800);
  });

  function showError(input, message) {
    // Buscar el contenedor del campo (por ejemplo .field-box o .input-group)
    const container = input.closest(".field-box, .input-group, .vital-box") || input.parentNode;
    container.classList.add("error-box");

    // Evitar errores duplicados
    const existente = container.querySelector(".error-message");
    if (existente) existente.remove();

    const error = document.createElement("small");
    error.textContent = message;
    error.className = "error-message";
    container.appendChild(error);
    
  }


  function clearErrors() {
    document.querySelectorAll(".error-message").forEach(e => e.remove());
    document.querySelectorAll(".error-box").forEach(c => c.classList.remove("error-box"));
    
  }

  // ===== Búsqueda de paciente =====
  document.getElementById("searchPatient").addEventListener("input", function() {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll("#patientsTable tbody tr");
    rows.forEach(row => {
      const name = row.querySelector("td:nth-child(2)")?.textContent.toLowerCase() || "";
      row.style.display = name.includes(filter) ? "" : "none";
    });
  });

  // ===== MODAL DE CIERRE DE SESIÓN =====
  const logoutLink = document.querySelector(".logout-link");
  const logoutModal = document.getElementById("logoutModal");
  const cancelLogout = document.getElementById("cancelLogout");
  const confirmLogout = document.getElementById("confirmLogout");

  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    logoutModal.style.display = "flex";
  });

  cancelLogout.addEventListener("click", () => {
    logoutModal.style.display = "none";
  });
  
  confirmLogout.addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "../../html/loginEnfermera.html";
  });

  window.addEventListener("click", (e) => {
    if (e.target === logoutModal) {
      logoutModal.style.display = "none";
    }
  });
});
