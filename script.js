const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwR8pzNfNsEnYFh2XT4vNYwTmhfuw41mmgRK5QRq0nal4TK5Zde4hiK9UfA1ZFjAzKp/exec";

let usuario = { nombre: "", colonia: "" };
let globalAlertas = [];

// --- SISTEMA DE ALERTAS PROPIAS (REEMPLAZA ALERT/CONFIRM) ---
function mostrarAlertaPropia(mensaje, tipo = "success", callback = null) {
    const existing = document.getElementById('custom-modal-container');
    if(existing) existing.remove();

    const iconClass = tipo === "error" ? "fa-circle-exclamation" : "fa-circle-check";
    const modalTypeClass = tipo === "error" ? "error" : "";

    const html = `
        <div id="custom-modal-container" class="custom-modal-overlay">
            <div class="custom-modal ${modalTypeClass}">
                <i class="fa-solid ${iconClass}"></i>
                <h3>Digitality Vigía</h3>
                <p>${mensaje}</p>
                <div class="custom-modal-actions">
                    <button id="modal-ok-btn" class="custom-modal-btn primary">Aceptar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('modal-ok-btn').addEventListener('click', () => {
        document.getElementById('custom-modal-container').remove();
        if(callback) callback();
    });
}

function mostrarConfirmacionPropia(mensaje, callbackOnConfirm) {
    const existing = document.getElementById('custom-modal-container');
    if(existing) existing.remove();

    const html = `
        <div id="custom-modal-container" class="custom-modal-overlay">
            <div class="custom-modal">
                <i class="fa-solid fa-triangle-exclamation" style="color: var(--yellow-alert);"></i>
                <h3>Confirmación</h3>
                <p>${mensaje}</p>
                <div class="custom-modal-actions">
                    <button id="modal-cancel-btn" class="custom-modal-btn secondary">Cancelar</button>
                    <button id="modal-confirm-btn" class="custom-modal-btn danger">Sí, eliminar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('modal-cancel-btn').addEventListener('click', () => {
        document.getElementById('custom-modal-container').remove();
    });

    document.getElementById('modal-confirm-btn').addEventListener('click', () => {
        document.getElementById('custom-modal-container').remove();
        callbackOnConfirm();
    });
}

// --- UTILIDADES ---
function timeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return "Justo ahora";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return new Date(dateString).toLocaleDateString();
}

function resizeImage(file, maxWidth, maxHeight, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.5); 
            callback(dataUrl);
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
}

// --- CONTROL DE PESTAÑAS DE AUTENTICACIÓN (LOGIN / REGISTER) ---
function cambiarModoAuth(modo) {
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const btnLoginTab = document.getElementById('btn-tab-login');
    const btnRegisterTab = document.getElementById('btn-tab-register');

    if (modo === 'login') {
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
        btnLoginTab.classList.add('active');
        btnRegisterTab.classList.remove('active');
    } else {
        formLogin.classList.add('hidden');
        formRegister.classList.remove('hidden');
        btnLoginTab.classList.remove('active');
        btnRegisterTab.classList.add('active');
    }
}

// --- SESIÓN Y PESTAÑAS ---
function verificarSesion() {
    // 🌟 NUEVO: Capturar si viene un usuario por parámetro URL desde la pasarela
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    
    if (userParam) {
        localStorage.setItem('vecino_nombre', userParam);
        localStorage.setItem('vecino_colonia', 'Red Social');
    }

    const savedName = localStorage.getItem('vecino_nombre');
    const savedColonia = localStorage.getItem('vecino_colonia');
    
    const authContainer = document.getElementById('auth-container');
    const sessionPanel = document.getElementById('user-session-panel');

    if (savedName) {
        usuario.nombre = savedName;
        usuario.colonia = savedColonia || "Red Social";
        
        const saludoElem = document.getElementById('user-greeting');
        if(saludoElem) saludoElem.innerText = `Hola, ${savedName}`;
        
        if(authContainer) authContainer.classList.add('hidden');
        if(sessionPanel) sessionPanel.classList.remove('hidden');
        
        const panelNombre = document.getElementById('panel-nombre-usuario');
        const panelColonia = document.getElementById('panel-colonia-usuario');
        if(panelNombre) panelNombre.innerText = savedName;
        if(panelColonia) panelColonia.innerText = `Colonia: ${usuario.colonia}`;

        const activeSection = document.querySelector('.view-section.active');
        if (activeSection && activeSection.id === 'tab-perfil') {
            cambiarPestana('tab-feed');
        }
        if(typeof cargarAlertas === 'function') {
            cargarAlertas();
        }
    } else {
        const saludoElem = document.getElementById('user-greeting');
        if(saludoElem) saludoElem.innerText = "Modo Invitado";
        if(authContainer) authContainer.classList.remove('hidden');
        if(sessionPanel) sessionPanel.classList.add('hidden');
    }
}

// --- ACCIÓN: REGISTRARSE (Envía Usuario, Colonia y Contraseña a Google Sheets) ---
document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    if(SCRIPT_URL.includes("TU_URL")) return mostrarAlertaPropia("Configura SCRIPT_URL", "error");

    const nombre = document.getElementById('reg-nombre').value.trim();
    const colonia = document.getElementById('reg-colonia').value.trim();
    const contrasena = document.getElementById('reg-password').value.trim();
    const btnReg = document.getElementById('btn-submit-register');
    
    btnReg.disabled = true;
    btnReg.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';

    const payload = { action: "registerUser", nombre: nombre, colonia: colonia, contrasena: contrasena };

    try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
        const json = await res.json();
        
        if(json.status === "success") {
            localStorage.setItem('vecino_nombre', nombre);
            localStorage.setItem('vecino_colonia', colonia);
            verificarSesion();
            mostrarAlertaPropia("¡Cuenta creada y registrada con éxito!", "success", () => {
                cambiarPestana('tab-feed');
            });
        } else {
            mostrarAlertaPropia(json.message, "error");
        }
    } catch(err) {
        mostrarAlertaPropia("Error de conexión con la red.", "error");
    } finally {
        btnReg.disabled = false;
        btnReg.innerHTML = '<i class="fa-solid fa-user-plus"></i> Crear Cuenta y Registrarse';
    }
});

// --- ACCIÓN: INICIAR SESIÓN (Valida Usuario y Contraseña en Google Sheets) ---
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    if(SCRIPT_URL.includes("TU_URL")) return mostrarAlertaPropia("Configura SCRIPT_URL", "error");

    const nombre = document.getElementById('login-nombre').value.trim();
    const contrasena = document.getElementById('login-password').value.trim();
    const btnLogin = document.getElementById('btn-submit-login');

    if(!nombre || !contrasena) {
        mostrarAlertaPropia("Por favor llena todos los campos.", "error");
        return;
    }

    btnLogin.disabled = true;
    btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';

    const payload = { action: "loginUser", nombre: nombre, contrasena: contrasena };

    try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
        const json = await res.json();

        if(json.status === "success") {
            localStorage.setItem('vecino_nombre', nombre);
            localStorage.setItem('vecino_colonia', json.colonia);
            
            verificarSesion();
            mostrarAlertaPropia(`¡Bienvenido de nuevo, ${nombre}!`, "success", () => {
                cambiarPestana('tab-feed');
            });
        } else {
            mostrarAlertaPropia(json.message, "error");
        }
    } catch (err) {
        mostrarAlertaPropia("Error de conexión con la red.", "error");
    } finally {
        btnLogin.disabled = false;
        btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar a la Red';
    }
});

// --- CERRAR SESIÓN ---
// --- CERRAR SESIÓN ---
function cerrarSesion() {
    mostrarConfirmacionPropia("¿Estás seguro de cerrar sesión?", () => {
        // 1. Limpiar por completo el almacenamiento local y de sesión
        localStorage.removeItem('vecino_nombre');
        localStorage.removeItem('vecino_colonia');
        sessionStorage.clear();
        
        // 2. Restablecer el objeto de usuario global
        usuario.nombre = "";
        usuario.colonia = "";
        
        // 3. Limpiar formularios si existen
        const formLogin = document.getElementById('form-login');
        const formRegister = document.getElementById('form-register');
        if(formLogin) formLogin.reset();
        if(formRegister) formRegister.reset();
        
        // 4. Mostrar alerta y forzar recarga limpia eliminando parámetros de la URL (?user=...)
        mostrarAlertaPropia("Sesión cerrada correctamente.", "success", () => {
            window.location.href = window.location.pathname; // Recarga limpia sin rastros de la URL anterior
        });
    });
}

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.getAttribute('data-target') === 'tab-reportar' && !usuario.nombre) {
            mostrarAlertaPropia("Por favor, inicia sesión o regístrate antes de reportar.", "error");
            cambiarPestana('tab-perfil');
            return;
        }
        cambiarPestana(btn.getAttribute('data-target'));
    });
});

function cambiarPestana(targetId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    document.getElementById(targetId).classList.add('active');
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
    
    if(targetId === 'tab-feed') cargarAlertas();
    if(targetId === 'tab-perfil') renderizarMisReportes();
}

// --- MANEJO DE IMAGEN EN FORMULARIO ---
document.getElementById('foto-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('foto-name').innerText = "Procesando...";
        resizeImage(file, 600, 600, function(base64Str) {
            document.getElementById('edit-foto-base64').value = base64Str;
            document.getElementById('foto-name').innerText = "Foto adjunta";
            document.getElementById('foto-preview').src = base64Str;
            document.getElementById('foto-preview-container').style.display = "block";
        });
    }
});

document.getElementById('btn-remove-foto').addEventListener('click', () => {
    document.getElementById('foto-upload').value = "";
    document.getElementById('edit-foto-base64').value = "";
    document.getElementById('foto-name').innerText = "Ninguna foto seleccionada";
    document.getElementById('foto-preview-container').style.display = "none";
});

// --- CARGAR Y RENDERIZAR FEED ---
async function cargarAlertas() {
    if(SCRIPT_URL.includes("TU_URL")) return;
    const feed = document.getElementById('feed-alertas');
    const loader = document.getElementById('loader');
    
    loader.style.display = 'block';
    feed.innerHTML = '';
    
    try {
        const res = await fetch(SCRIPT_URL);
        const json = await res.json();
        loader.style.display = 'none';
        
        if(json.data && json.data.length > 0) {
            globalAlertas = json.data.reverse();
            
            globalAlertas.forEach(alerta => {
                const isAnon = alerta.Autor.includes("Anónimo");
                const iconUser = isAnon ? 'fa-user-secret' : 'fa-user';
                const fotoHTML = alerta.Foto ? `<img src="${alerta.Foto}" class="alerta-imagen" alt="Evidencia">` : '';
                
                feed.innerHTML += `
                    <div class="alerta-card tipo-${alerta.Tipo.toLowerCase()}">
                        <div class="alerta-meta">
                            <span class="badge ${alerta.Tipo.toLowerCase()}">${alerta.Tipo.toUpperCase()}</span>
                            <span>${timeAgo(alerta.Fecha)}</span>
                        </div>
                        <div class="alerta-autor">
                            <span><i class="fa-solid ${iconUser}"></i> ${alerta.Autor}</span>
                        </div>
                        <div class="alerta-ubicacion"><i class="fa-solid fa-map-pin"></i> ${alerta.Ubicacion}</div>
                        <div class="alerta-desc">${alerta.Descripcion}</div>
                        ${fotoHTML}
                    </div>
                `;
            });
            renderizarMisReportes();
        }
    } catch(err) {
        loader.style.display = 'none';
        feed.innerHTML = '<p>Error conectando con la red vecinal.</p>';
    }
}

// --- RENDERIZAR MIS REPORTES ---
function renderizarMisReportes() {
    if(!usuario.nombre) return;
    const misReportesFeed = document.getElementById('mis-reportes-list');
    if(!misReportesFeed) return;
    misReportesFeed.innerHTML = '';
    
    const miAutorIdentidad = `${usuario.nombre} (${usuario.colonia})`;
    const misAlertas = globalAlertas.filter(a => a.Autor === miAutorIdentidad);
    
    if(misAlertas.length === 0) {
        misReportesFeed.innerHTML = '<p class="subtitle">Aún no has hecho reportes públicos.</p>';
        return;
    }

    misAlertas.forEach(alerta => {
        const fotoHTML = alerta.Foto ? `<img src="${alerta.Foto}" class="alerta-imagen" alt="Evidencia">` : '';
        
        misReportesFeed.innerHTML += `
            <div class="alerta-card tipo-${alerta.Tipo.toLowerCase()}">
                <div class="alerta-meta">
                    <span class="badge ${alerta.Tipo.toLowerCase()}">${alerta.Tipo.toUpperCase()}</span>
                    <span>${timeAgo(alerta.Fecha)}</span>
                </div>
                <div class="alerta-ubicacion">${alerta.Ubicacion}</div>
                <div class="alerta-desc">${alerta.Descripcion}</div>
                ${fotoHTML}
                <div class="mis-reportes-actions">
                    <button class="btn-edit" onclick="iniciarEdicion('${alerta.ID}')"><i class="fa-solid fa-pen"></i> Editar</button>
                    <button class="btn-delete" onclick="eliminarReporte('${alerta.ID}')"><i class="fa-solid fa-trash"></i> Eliminar</button>
                </div>
            </div>
        `;
    });
}

// --- NUEVO / EDITAR REPORTE ---
function prepararNuevoReporte() {
    document.getElementById('form-alerta').reset();
    document.getElementById('edit-id').value = "";
    document.getElementById('btn-remove-foto').click();
    document.getElementById('form-title').innerText = "Crear Reporte";
    document.getElementById('form-subtitle').innerText = "Notifica a tu comunidad de inmediato.";
    document.getElementById('btn-submit-form').innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publicar Alerta';
    document.getElementById('btn-cancel-edit').classList.add('hidden');
    document.querySelector('.anon-toggle-group').classList.remove('hidden');
}

window.iniciarEdicion = function(id) {
    const alerta = globalAlertas.find(a => a.ID == id);
    if(!alerta) return;

    prepararNuevoReporte();
    
    document.getElementById('edit-id').value = alerta.ID;
    document.querySelector(`input[name="tipo"][value="${alerta.Tipo}"]`).checked = true;
    document.getElementById('ubicacion').value = alerta.Ubicacion;
    document.getElementById('descripcion').value = alerta.Descripcion;
    
    if(alerta.Foto) {
        document.getElementById('edit-foto-base64').value = alerta.Foto;
        document.getElementById('foto-name').innerText = "Foto adjunta cargada";
        document.getElementById('foto-preview').src = alerta.Foto;
        document.getElementById('foto-preview-container').style.display = "block";
    }

    document.getElementById('form-title').innerText = "Editar Reporte";
    document.getElementById('form-subtitle').innerText = "Modifica los detalles de tu alerta.";
    document.getElementById('btn-submit-form').innerHTML = '<i class="fa-solid fa-save"></i> Guardar Cambios';
    document.getElementById('btn-cancel-edit').classList.remove('hidden');
    document.querySelector('.anon-toggle-group').classList.add('hidden');

    cambiarPestana('tab-reportar');
}

window.cancelarEdicion = function() {
    prepararNuevoReporte();
    cambiarPestana('tab-perfil');
}

document.getElementById('form-alerta').addEventListener('submit', async (e) => {
    e.preventDefault();
    if(SCRIPT_URL.includes("TU_URL")) return mostrarAlertaPropia("Configura URL", "error");

    const btnSubmit = document.getElementById('btn-submit-form');
    const editId = document.getElementById('edit-id').value;
    
    const isAnon = document.getElementById('toggle-anonimo').checked;
    const autorName = isAnon ? "Vecino Anónimo" : `${usuario.nombre} (${usuario.colonia})`;
    
    const payload = {
        action: editId ? "editAlert" : "addAlert",
        id: editId,
        tipo: document.querySelector('input[name="tipo"]:checked').value,
        ubicacion: document.getElementById('ubicacion').value,
        descripcion: document.getElementById('descripcion').value,
        autor: editId ? undefined : autorName,
        foto: document.getElementById('edit-foto-base64').value
    };

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

    try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
        const json = await res.json();
        
        if(json.status === "success") {
            prepararNuevoReporte();
            mostrarAlertaPropia(editId ? "Reporte actualizado correctamente." : "¡Alerta publicada con éxito!", "success", () => {
                cambiarPestana(editId ? 'tab-perfil' : 'tab-feed');
                cargarAlertas();
            });
        } else { 
            mostrarAlertaPropia("Error: " + json.message, "error"); 
        }
    } catch(err) {
        mostrarAlertaPropia("Error de conexión.", "error");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = editId ? '<i class="fa-solid fa-save"></i> Guardar Cambios' : '<i class="fa-solid fa-paper-plane"></i> Publicar Alerta';
    }
});

// --- ELIMINAR REPORTE ---
window.eliminarReporte = function(id) {
    mostrarConfirmacionPropia("¿Estás seguro de eliminar este reporte permanentemente?", async () => {
        try {
            const payload = { action: "deleteAlert", id: id };
            const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
            const json = await res.json();
            
            if(json.status === "success") {
                mostrarAlertaPropia("Reporte eliminado.", "success", () => {
                    cargarAlertas();
                });
            }
        } catch (error) {
            mostrarAlertaPropia("Error al eliminar.", "error");
        }
    });
}

document.getElementById('btn-refresh').addEventListener('click', cargarAlertas);

verificarSesion();
if(usuario.nombre) cargarAlertas();