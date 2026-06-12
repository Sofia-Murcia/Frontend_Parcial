let productoEditando = null;

async function cargarProductos() {
    const filtroCategoria = document.getElementById('filtroCategoria')?.value || '';
    let url = `${API.productos}/api/productos?`;
    if (filtroCategoria) url += `categoria_id=${filtroCategoria}`;

    try {
        const datos = await apiFetch(url);
        if (!datos?.success) return;
        const productos = datos.data;
        const tbody = document.getElementById('tablaProductos');

        if (productos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="vacio"><div class="icono-vacio">🍽️</div><p>No hay productos</p></div></td></tr>`;
            return;
        }

        tbody.innerHTML = productos.map(p => `
            <tr>
                <td><strong>${p.nombre}</strong><br/><small class="texto-secundario">${p.descripcion || ''}</small></td>
                <td>${p.categoria?.nombre || '—'}</td>
                <td>$${Number(p.precio).toLocaleString('es-CO')}</td>
                <td><span class="badge badge-${p.disponible ? 'activo' : 'inactivo'}">${p.disponible ? 'Disponible' : 'No disponible'}</span></td>
                <td class="acciones">
                    <button class="btn btn-secondary btn-sm" onclick="abrirEditar(${p.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${p.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    } catch { mostrarToast('Error al cargar productos', 'error'); }
}

async function cargarCategorias(selectId) {
    try {
        const datos = await apiFetch(`${API.productos}/api/categorias`);
        if (!datos?.success) return;
        const sel = document.getElementById(selectId);
        const primera = selectId === 'filtroCategoria' ? '<option value="">Todas las categorías</option>' : '<option value="">Seleccionar categoría</option>';
        sel.innerHTML = primera + datos.data.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    } catch {}
}

function abrirCrear() {
    productoEditando = null;
    document.getElementById('modalTitulo').textContent = 'Nuevo producto';
    document.getElementById('formProducto').reset();
    cargarCategorias('categoria_id');
    document.getElementById('modalProducto').classList.remove('oculto');
}

async function abrirEditar(id) {
    try {
        const datos = await apiFetch(`${API.productos}/api/productos/${id}`);
        if (!datos?.success) return;
        const p = datos.data;
        productoEditando = id;
        document.getElementById('modalTitulo').textContent = 'Editar producto';
        await cargarCategorias('categoria_id');
        document.getElementById('nombre').value       = p.nombre;
        document.getElementById('descripcion').value  = p.descripcion || '';
        document.getElementById('precio').value       = p.precio;
        document.getElementById('disponible').value   = p.disponible ? '1' : '0';
        document.getElementById('categoria_id').value = p.categoria_id;
        document.getElementById('modalProducto').classList.remove('oculto');
    } catch { mostrarToast('Error al cargar producto', 'error'); }
}

function cerrarModal() {
    document.getElementById('modalProducto').classList.add('oculto');
}

async function guardarProducto() {
    const body = {
        nombre:       document.getElementById('nombre').value.trim(),
        descripcion:  document.getElementById('descripcion').value.trim(),
        precio:       parseFloat(document.getElementById('precio').value),
        disponible:   document.getElementById('disponible').value === '1',
        categoria_id: parseInt(document.getElementById('categoria_id').value),
    };

    if (!body.nombre || !body.precio || !body.categoria_id) {
        mostrarToast('Completa todos los campos obligatorios', 'error'); return;
    }
    if (body.precio <= 0) { mostrarToast('El precio debe ser mayor a cero', 'error'); return; }

    const url    = productoEditando ? `${API.productos}/api/productos/${productoEditando}` : `${API.productos}/api/productos`;
    const method = productoEditando ? 'PUT' : 'POST';

    try {
        const datos = await apiFetch(url, { method, body: JSON.stringify(body) });
        if (datos?.success) {
            mostrarToast(productoEditando ? 'Producto actualizado' : 'Producto creado', 'exito');
            cerrarModal();
            cargarProductos();
        } else {
            mostrarToast(datos?.message || 'Error al guardar', 'error');
        }
    } catch { mostrarToast('Error de conexión', 'error'); }
}

async function eliminarProducto(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
        const datos = await apiFetch(`${API.productos}/api/productos/${id}`, { method: 'DELETE' });
        if (datos?.success) { mostrarToast('Producto eliminado', 'exito'); cargarProductos(); }
        else mostrarToast(datos?.message || 'Error', 'error');
    } catch { mostrarToast('Error de conexión', 'error'); }
}

function mostrarToast(msg, tipo) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${tipo} visible`;
    setTimeout(() => t.classList.remove('visible'), 3000);
}
