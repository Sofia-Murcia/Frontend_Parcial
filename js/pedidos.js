let productosDisponibles = [];
let itemsCarrito = [];

async function cargarPedidos() {
    const filtroEstado = document.getElementById('filtroEstado')?.value || '';
    let url = `${API.pedidos}/api/pedidos?`;
    if (filtroEstado) url += `estado=${filtroEstado}`;

    try {
        const datos = await apiFetch(url);
        if (!datos?.success) return;
        const pedidos = datos.data;
        const tbody = document.getElementById('tablaPedidos');

        if (pedidos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="vacio"><div class="icono-vacio">🧾</div><p>No hay pedidos</p></div></td></tr>`;
            return;
        }

        tbody.innerHTML = pedidos.map(p => `
            <tr>
                <td>#${p.id}</td>
                <td>Mesa ${p.mesa_id}</td>
                <td>${p.fecha} ${p.hora}</td>
                <td>$${Number(p.total).toLocaleString('es-CO')}</td>
                <td><span class="badge badge-${p.estado}">${p.estado.replace('_', ' ')}</span></td>
                <td class="acciones">
                    <button class="btn btn-secondary btn-sm" onclick="verDetalle(${p.id})">Ver</button>
                    ${p.estado !== 'pagado' && p.estado !== 'cancelado' ? `
                        <button class="btn btn-secondary btn-sm" onclick="abrirCambioEstado(${p.id}, '${p.estado}')">Estado</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    } catch { mostrarToast('Error al cargar pedidos', 'error'); }
}

async function verDetalle(id) {
    try {
        const datos = await apiFetch(`${API.pedidos}/api/pedidos/${id}`);
        if (!datos?.success) return;
        const p = datos.data;

        document.getElementById('detalleContenido').innerHTML = `
            <div class="detalle-info">
                <strong>Pedido #${p.id}</strong> — Mesa ${p.mesa_id}
                <small>${p.fecha} ${p.hora}</small>
            </div>
            <table class="detalle-tabla">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th class="centro">Cant.</th>
                        <th class="derecha">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                ${p.detalles.map(d => `
                    <tr>
                        <td>${d.nombre_producto}</td>
                        <td class="centro">${d.cantidad}</td>
                        <td class="derecha">$${Number(d.subtotal).toLocaleString('es-CO')}</td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
            <div class="detalle-total">
                <span>Total</span>
                <span class="monto">$${Number(p.total).toLocaleString('es-CO')}</span>
            </div>
        `;
        document.getElementById('modalDetalle').classList.remove('oculto');
    } catch { mostrarToast('Error al cargar detalle', 'error'); }
}

let pedidoEstadoId = null;
function abrirCambioEstado(id, estadoActual) {
    pedidoEstadoId = id;
    document.getElementById('nuevoEstado').value = estadoActual;
    document.getElementById('modalEstado').classList.remove('oculto');
}

async function cambiarEstado() {
    const estado = document.getElementById('nuevoEstado').value;
    try {
        const datos = await apiFetch(`${API.pedidos}/api/pedidos/${pedidoEstadoId}/estado`, {
            method: 'PATCH', body: JSON.stringify({ estado })
        });
        if (datos?.success) {
            mostrarToast('Estado actualizado', 'exito');
            cerrarModal();
            cargarPedidos();
        } else mostrarToast(datos?.message || 'Error', 'error');
    } catch { mostrarToast('Error de conexión', 'error'); }
}

async function abrirCrear() {
    itemsCarrito = [];
    document.getElementById('formPedido').reset();
    renderCarrito();
    await cargarProductosSelect();
    await cargarMesasSelect();
    document.getElementById('modalCrear').classList.remove('oculto');
}

async function cargarProductosSelect() {
    try {
        const datos = await apiFetch(`${API.productos}/api/productos`);
        if (!datos?.success) return;
        productosDisponibles = datos.data.filter(p => p.disponible);
        const sel = document.getElementById('selectProducto');
        sel.innerHTML = '<option value="">Seleccionar producto</option>' +
            productosDisponibles.map(p => `<option value="${p.id}" data-precio="${p.precio}" data-nombre="${p.nombre}">
                ${p.nombre} — $${Number(p.precio).toLocaleString('es-CO')}
            </option>`).join('');
    } catch {}
}

async function cargarMesasSelect() {
    try {
        const datos = await apiFetch(`${API.reservas}/api/mesas`);
        if (!datos?.success) return;
        const sel = document.getElementById('mesa_id');
        sel.innerHTML = '<option value="">Seleccionar mesa</option>' +
            datos.data
                .filter(m => m.estado === 'ocupada' || m.estado === 'reservada')
                .map(m => `<option value="${m.id}">Mesa ${m.numero} (${m.estado})</option>`).join('');
    } catch {}
}

function agregarAlCarrito() {
    const sel      = document.getElementById('selectProducto');
    const cantidad = parseInt(document.getElementById('cantidadProducto').value);
    const opt      = sel.options[sel.selectedIndex];

    if (!sel.value || cantidad < 1) { mostrarToast('Selecciona producto y cantidad', 'error'); return; }

    const productoId = parseInt(sel.value);
    const nombre     = opt.dataset.nombre;
    const precio     = parseFloat(opt.dataset.precio);

    const existe = itemsCarrito.find(i => i.producto_id === productoId);
    if (existe) {
        existe.cantidad += cantidad;
        existe.subtotal = existe.precio_unitario * existe.cantidad;
    } else {
        itemsCarrito.push({ producto_id: productoId, nombre_producto: nombre, cantidad, precio_unitario: precio, subtotal: precio * cantidad });
    }

    renderCarrito();
    sel.value = '';
    document.getElementById('cantidadProducto').value = 1;
}

function quitarDelCarrito(idx) {
    itemsCarrito.splice(idx, 1);
    renderCarrito();
}

function renderCarrito() {
    const cont  = document.getElementById('carritoItems');
    const total = itemsCarrito.reduce((s, i) => s + i.subtotal, 0);

    if (itemsCarrito.length === 0) {
        cont.innerHTML = `<p class="carrito-vacio">Sin productos agregados</p>`;
    } else {
        cont.innerHTML = itemsCarrito.map((i, idx) => `
            <div class="carrito-item">
                <div>
                    <span class="carrito-item-nombre">${i.nombre_producto}</span>
                    <small class="carrito-item-sub">x${i.cantidad} — $${Number(i.precio_unitario).toLocaleString('es-CO')}</small>
                </div>
                <div class="carrito-item-der">
                    <span class="carrito-item-precio">$${Number(i.subtotal).toLocaleString('es-CO')}</span>
                    <button onclick="quitarDelCarrito(${idx})" class="carrito-quitar">×</button>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('totalCarrito').textContent = `$${total.toLocaleString('es-CO')}`;
}

async function crearPedido() {
    const mesaId = parseInt(document.getElementById('mesa_id').value);
    if (!mesaId) { mostrarToast('Selecciona una mesa', 'error'); return; }
    if (itemsCarrito.length === 0) { mostrarToast('Agrega al menos un producto', 'error'); return; }

    try {
        const datos = await apiFetch(`${API.pedidos}/api/pedidos`, {
            method: 'POST',
            body: JSON.stringify({ mesa_id: mesaId, productos: itemsCarrito })
        });
        if (datos?.success) {
            mostrarToast('Pedido creado correctamente', 'exito');
            cerrarModal();
            cargarPedidos();
        } else mostrarToast(datos?.message || 'Error', 'error');
    } catch { mostrarToast('Error de conexión', 'error'); }
}

function cerrarModal() {
    document.getElementById('modalCrear').classList.add('oculto');
    document.getElementById('modalDetalle').classList.add('oculto');
    document.getElementById('modalEstado').classList.add('oculto');
}

function mostrarToast(msg, tipo) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${tipo} visible`;
    setTimeout(() => t.classList.remove('visible'), 3000);
}
