let mesaEditando = null;

async function cargarMesas() {
    const filtroEstado = document.getElementById('filtroEstado')?.value || '';
    try {
        const datos = await apiFetch(`${API.reservas}/api/mesas`);
        if (!datos?.success) return;

        let mesas = datos.data;
        if (filtroEstado) mesas = mesas.filter(m => m.estado === filtroEstado);

        const tbody = document.getElementById('tablaMesas');
        if (mesas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5"><div class="vacio"><div class="icono-vacio">🪑</div><p>No hay mesas registradas</p></div></td></tr>`;
            return;
        }

        tbody.innerHTML = mesas.map(m => `
            <tr>
                <td><strong>${m.numero}</strong></td>
                <td>${m.capacidad} personas</td>
                <td><span class="badge badge-${m.estado}">${m.estado.replace('_', ' ')}</span></td>
                <td class="acciones">
                    <button class="btn btn-secondary btn-sm" onclick="abrirEstado(${m.id}, '${m.estado}')">Estado</button>
                    <button class="btn btn-secondary btn-sm" onclick="abrirEditar(${m.id}, '${m.numero}', ${m.capacidad}, '${m.estado}')">Editar</button>
                </td>
            </tr>
        `).join('');
    } catch { mostrarToast('Error al cargar mesas', 'error'); }
}

function abrirCrear() {
    mesaEditando = null;
    document.getElementById('modalTitulo').textContent = 'Nueva mesa';
    document.getElementById('formMesa').reset();
    document.getElementById('modalMesa').classList.remove('oculto');
}

function abrirEditar(id, numero, capacidad, estado) {
    mesaEditando = id;
    document.getElementById('modalTitulo').textContent = 'Editar mesa';
    document.getElementById('numero').value   = numero;
    document.getElementById('capacidad').value = capacidad;
    document.getElementById('estado').value   = estado;
    document.getElementById('modalMesa').classList.remove('oculto');
}

function cerrarModal() {
    document.getElementById('modalMesa').classList.add('oculto');
    document.getElementById('modalEstado').classList.add('oculto');
}

async function guardarMesa() {
    const numero    = document.getElementById('numero').value.trim();
    const capacidad = document.getElementById('capacidad').value;
    const estado    = document.getElementById('estado').value;

    if (!numero || !capacidad) { mostrarToast('Completa todos los campos', 'error'); return; }

    const url    = mesaEditando ? `${API.reservas}/api/mesas/${mesaEditando}` : `${API.reservas}/api/mesas`;
    const method = mesaEditando ? 'PUT' : 'POST';

    try {
        const datos = await apiFetch(url, { method, body: JSON.stringify({ numero, capacidad: parseInt(capacidad), estado }) });
        if (datos?.success) {
            mostrarToast(mesaEditando ? 'Mesa actualizada' : 'Mesa creada', 'exito');
            cerrarModal();
            cargarMesas();
        } else {
            mostrarToast(datos?.message || 'Error al guardar', 'error');
        }
    } catch { mostrarToast('Error de conexión', 'error'); }
}

let mesaEstadoId = null;
function abrirEstado(id, estadoActual) {
    mesaEstadoId = id;
    document.getElementById('nuevoEstado').value = estadoActual;
    document.getElementById('modalEstado').classList.remove('oculto');
}

async function cambiarEstado() {
    const estado = document.getElementById('nuevoEstado').value;
    try {
        const datos = await apiFetch(`${API.reservas}/api/mesas/${mesaEstadoId}/estado`, {
            method: 'PATCH', body: JSON.stringify({ estado })
        });
        if (datos?.success) {
            mostrarToast('Estado actualizado', 'exito');
            cerrarModal();
            cargarMesas();
        } else {
            mostrarToast(datos?.message || 'Error', 'error');
        }
    } catch { mostrarToast('Error de conexión', 'error'); }
}

function mostrarToast(msg, tipo) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${tipo} visible`;
    setTimeout(() => t.classList.remove('visible'), 3000);
}
