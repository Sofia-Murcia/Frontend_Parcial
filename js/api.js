const API = {
    auth:      'http://127.0.0.1:8000',
    productos: 'http://127.0.0.1:8001',
    reservas:  'http://127.0.0.1:8002',
    pedidos:   'http://127.0.0.1:8003',
};

async function apiFetch(url, opciones = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(opciones.headers || {}),
    };
    const res = await fetch(url, { ...opciones, headers });
    const datos = await res.json();
    if (res.status === 401) {
        localStorage.clear();
        window.location.href = esEnPages() ? '../index.html' : 'index.html';
        return;
    }
    return datos;
}

function esEnPages() {
    return window.location.pathname.includes('/pages/');
}
