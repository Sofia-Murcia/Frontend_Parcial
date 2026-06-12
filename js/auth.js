async function login() {
    const usuario    = document.getElementById('usuario').value.trim();
    const contrasena = document.getElementById('contrasena').value.trim();
    const btn        = document.getElementById('btnLogin');
    const msg        = document.getElementById('mensaje');

    msg.className = 'mensaje';
    msg.textContent = '';

    if (!usuario || !contrasena) {
        mostrarMensajeLogin('Completa todos los campos', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Verificando...';

    try {
        const datos = await apiFetch(`${API.auth}/api/login`, {
            method: 'POST',
            body: JSON.stringify({ usuario, contrasena }),
        });

        if (datos && datos.success) {
            localStorage.setItem('token',   datos.data.token);
            localStorage.setItem('usuario', JSON.stringify(datos.data.usuario));
            mostrarMensajeLogin('Acceso correcto, redirigiendo...', 'exito');
            setTimeout(() => { window.location.href = 'pages/mesas.html'; }, 800);
        } else {
            mostrarMensajeLogin(datos?.message || 'Credenciales incorrectas', 'error');
            btn.disabled = false;
            btn.innerHTML = 'Ingresar';
        }
    } catch {
        mostrarMensajeLogin('No se pudo conectar con el servidor', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Ingresar';
    }
}

async function logout() {
    try {
        await apiFetch(`${API.auth}/api/logout`, { method: 'POST' });
    } catch {}
    localStorage.clear();
    window.location.href = '../index.html';
}

function verificarSesion() {
    if (!localStorage.getItem('token')) {
        window.location.href = '../index.html';
    }
}

function getUsuario() {
    const raw = localStorage.getItem('usuario');
    return raw ? JSON.parse(raw) : null;
}

function mostrarMensajeLogin(texto, tipo) {
    const msg = document.getElementById('mensaje');
    if (!msg) return;
    msg.textContent = texto;
    msg.className = `mensaje ${tipo}`;
}
