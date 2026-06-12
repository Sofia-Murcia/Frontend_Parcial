let reservaEditando = null;

async function cargarReservas() {
    const filtroEstado  = document.getElementById('filtroEstado')?.value  || '';
    const filtroFecha   = document.getElementById('filtroFecha')?.value   || '';
    const filtroCliente = document.getElementById('filtroCliente')?.value || '';

    let url = `${API.reservas}/api/reservas?`;
    if (filtroEstado)  url += `estado=${filtroEstado}&`;
    if (filtroFecha)   url += `fecha=${filtroFecha}&`;
    if (filtroCliente) url += `cliente=${filtroCliente}&`;

    try {
        const datos = await apiFetch(url);
        if (!datos?.success) return;
        const reservas = datos.data;
        const tbody = document.getElementById('tablaReservas');

        if (reservas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7"><div class="vacio"><div class="icono-vacio">📅</div><p>No hay reservas</p></div></td></tr>`;
            return;
        }

        tbody.innerHTML = reservas.map(r => `
            <tr>
                <td><strong>${r.nombre_cliente}</strong><br/><small class="texto-secundario">${r.telefono_cliente}</small></td>
                <td>${r.fecha}</td>
                <td>${r.hora}</td>
                <td>${r.cantidad_personas}</td>
                <td>${r.mesa?.numero || `Mesa #${r.mesa_id}`}</td>
                <td><span class="badge badge-${r.estado}">${r.estado}</span></td>
                <td class="acciones">
                    ${r.estado !== 'cancelada' && r.estado !== 'finalizada' ? `
                        <button class="btn btn-secondary btn-sm" onclick="abrirEditar(${r.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="cancelarReserva(${r.id})">Cancelar</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    } catch { mostrarToast('Error al cargar reservas', 'error'); }
}

async function cargarMesasSelect() {
    try {
        const datos = await apiFetch(`${API.reservas}/api/mesas`);
        if (!datos?.success) return;
        const select = document.getElementById('mesa_id');
        select.innerHTML = '<option value="">Seleccionar mesa</option>';
        datos.data
            .filter(m => m.estado !== 'fuera_servicio')
            .forEach(m => {
                select.innerHTML += `<option value="${m.id}">Mesa ${m.numero} (cap. ${m.capacidad})</option>`;
            });
    } catch {}
}

function abrirCrear() {
    reservaEditando = null;
    document.getElementById('modalTitulo').textContent = 'Nueva reserva';
    document.getElementById('formReserva').reset();
    document.getElementById('fecha').min = new Date().toISOString().split('T')[0];
    cargarMesasSelect();
    document.getElementById('modalReserva').classList.remove('oculto');
}

async function abrirEditar(id) {
    try {
        const datos = await apiFetch(`${API.reservas}/api/reservas/${id}`);
        if (!datos?.success) return;
        const r = datos.data;
        reservaEditando = id;
        document.getElementById('modalTitulo').textContent = 'Editar reserva';
        await cargarMesasSelect();
        document.getElementById('nombre_cliente').value    = r.nombre_cliente;
        document.getElementById('telefono_cliente').value  = r.telefono_cliente;
        document.getElementById('cantidad_personas').value = r.cantidad_personas;
        document.getElementById('fecha').value             = r.fecha;
        document.getElementById('hora').value              = r.hora;
        document.getElementById('mesa_id').value           = r.mesa_id;
        document.getElementById('observaciones').value     = r.observaciones || '';
        document.getElementById('modalReserva').classList.remove('oculto');
    } catch { mostrarToast('Error al cargar reserva', 'error'); }
}

function cerrarModal() {
    document.getElementById('modalReserva').classList.add('oculto');
}

async function guardarReserva() {
    const body = {
        nombre_cliente:    document.getElementById('nombre_cliente').value.trim(),
        telefono_cliente:  document.getElementById('telefono_cliente').value.trim(),
        cantidad_personas: parseInt(document.getElementById('cantidad_personas').value),
        fecha:             document.getElementById('fecha').value,
        hora:              document.getElementById('hora').value,
        mesa_id:           parseInt(document.getElementById('mesa_id').value),
        observaciones:     document.getElementById('observaciones').value.trim(),
    };

    if (!body.nombre_cliente || !body.telefono_cliente || !body.fecha || !body.hora || !body.mesa_id) {
        mostrarToast('Completa todos los campos obligatorios', 'error'); return;
    }

    const url    = reservaEditando ? `${API.reservas}/api/reservas/${reservaEditando}` : `${API.reservas}/api/reservas`;
    const method = reservaEditando ? 'PUT' : 'POST';

    try {
        const datos = await apiFetch(url, { method, body: JSON.stringify(body) });
        if (datos?.success) {
            mostrarToast(reservaEditando ? 'Reserva actualizada' : 'Reserva creada', 'exito');
            cerrarModal();
            cargarReservas();
        } else {
            mostrarToast(datos?.message || 'Error al guardar', 'error');
        }
    } catch { mostrarToast('Error de conexión', 'error'); }
}

async function cancelarReserva(id) {
    if (!confirm('¿Cancelar esta reserva?')) return;
    try {
        const datos = await apiFetch(`${API.reservas}/api/reservas/${id}/cancelar`, { method: 'PATCH' });
        if (datos?.success) { mostrarToast('Reserva cancelada', 'exito'); cargarReservas(); }
        else mostrarToast(datos?.message || 'Error', 'error');
    } catch { mostrarToast('Error de conexión', 'error'); }
}

function mostrarToast(msg, tipo) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${tipo} visible`;
    setTimeout(() => t.classList.remove('visible'), 3000);
}
