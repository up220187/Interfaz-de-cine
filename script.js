// Variables globales
let nombreUsuario = "";
let peliculasData = [];
let empleados = JSON.parse(localStorage.getItem('empleados')) || [];
let ventas = JSON.parse(localStorage.getItem('ventas')) || [];
let estadoAsientos = {};

// Credenciales de administrador
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

// Función para iniciar sesión
function iniciarSesion() {
    const user = document.getElementById("usuario").value;
    const pass = document.getElementById("contrasena").value;
    
    if (!user || !pass) {
        alert("Ingrese usuario y contraseña");
        return;
    }

    // Verificar si es admin
    if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
        iniciarSesionAdmin();
        return;
    }

    // Verificar si es empleado
    const empleado = empleados.find(emp => emp.usuario === user && emp.contrasena === pass);
    if (empleado) {
        iniciarSesionEmpleado(empleado);
        return;
    }

    // Usuario normal
    iniciarSesionUsuarioNormal(user);
}

function iniciarSesionAdmin() {
    ocultarTodosPaneles();
    document.getElementById("AdminScreen").style.display = "block";
    document.getElementById("logout").style.display = "block";
    actualizarListaEmpleados();
}

function iniciarSesionEmpleado(empleado) {
    ocultarTodosPaneles();
    document.getElementById("EmpleadoScreen").style.display = "block";
    document.getElementById("logout").style.display = "block";
    actualizarEstadisticas();
}

function iniciarSesionUsuarioNormal(user) {
    ocultarTodosPaneles();
    nombreUsuario = user;
    document.getElementById("salas").style.display = "block";
    document.getElementById("logout").style.display = "block";
}

function ocultarTodosPaneles() {
    document.getElementById("login").style.display = "none";
    ["AdminScreen", "EmpleadoScreen", "salas", "ticket"].forEach(id => {
        document.getElementById(id).style.display = "none";
    });
}

// Función para cerrar sesión
function cerrarSesion() {
    nombreUsuario = "";
    ocultarTodosPaneles();
    document.getElementById("login").style.display = "block";
    document.getElementById("usuario").value = "";
    document.getElementById("contrasena").value = "";
}

// Gestión de empleados
function crearEmpleado() {
    const nombre = document.getElementById("nombreEmpleado").value;
    const usuario = document.getElementById("usuarioEmpleado").value;
    const contrasena = document.getElementById("contrasenaEmpleado").value;

    if (!nombre || !usuario || !contrasena) {
        alert("Complete todos los campos");
        return;
    }

    if (empleados.some(emp => emp.usuario === usuario)) {
        alert("Este usuario ya existe");
        return;
    }

    const nuevoEmpleado = {
        id: Date.now(),
        nombre,
        usuario,
        contrasena,
        fechaRegistro: new Date().toLocaleString()
    };

    empleados.push(nuevoEmpleado);
    guardarEmpleados();
    actualizarListaEmpleados();
    
    // Limpiar formulario
    document.getElementById("nombreEmpleado").value = "";
    document.getElementById("usuarioEmpleado").value = "";
    document.getElementById("contrasenaEmpleado").value = "";
}

function eliminarEmpleado(id) {
    if (!confirm("¿Está seguro de eliminar este empleado?")) {
        return;
    }
    
    empleados = empleados.filter(emp => emp.id !== id);
    guardarEmpleados();
    actualizarListaEmpleados();
}

function guardarEmpleados() {
    localStorage.setItem('empleados', JSON.stringify(empleados));
}

function actualizarListaEmpleados() {
    const contenedor = document.getElementById("listaEmpleados");
    
    if (empleados.length === 0) {
        contenedor.innerHTML = "<p class='no-empleados'>No hay empleados registrados aún</p>";
        return;
    }

    let html = `
        <table class="tabla-empleados">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Usuario</th>
                    <th>Fecha Registro</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    empleados.forEach(empleado => {
        html += `
            <tr>
                <td>${empleado.nombre}</td>
                <td>${empleado.usuario}</td>
                <td>${empleado.fechaRegistro}</td>
                <td class="acciones">
                    <button onclick="eliminarEmpleado(${empleado.id})" class="btn-eliminar">
                        <i class="fas fa-trash-alt"></i> Eliminar
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    contenedor.innerHTML = html;
}

// Funciones para películas y asientos
function cargarPeliculas() {
    fetch("peliculas.xml")
        .then(res => res.text())
        .then(str => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(str, "application/xml");
            const pelis = xml.getElementsByTagName("pelicula");
            peliculasData = [];
            
            for (let p of pelis) {
                peliculasData.push({
                    id: p.getAttribute("id"),
                    categoria: p.getAttribute("categoria"),
                    sala: p.getAttribute("sala"),
                    titulo: p.getElementsByTagName("titulo")[0].textContent
                });
            }
            
            mostrarPeliculaSegunSala();
        })
        .catch(error => {
            console.error("Error cargando películas:", error);
            document.getElementById("peliculasContainer").textContent = "Error cargando películas";
        });
}

function mostrarPeliculaSegunSala() {
    const salaSeleccionada = document.getElementById("salaSelecion").value;
    const cont = document.getElementById("peliculasContainer");
    cont.innerHTML = "";

    const pelicula = peliculasData.find(p => p.sala === salaSeleccionada);
    if (pelicula) {
        cont.innerHTML = `
            <h3>${pelicula.titulo}</h3>
            <p><strong>Categoría:</strong> ${pelicula.categoria}</p>
        `;
    } else {
        cont.textContent = "No hay película en esta sala";
    }
}

function generarAsientos() {
    const cont = document.getElementById("asientosContainer");
    cont.innerHTML = "";
    const salaSeleccionada = document.getElementById("salaSelecion").value;
    
    if (!estadoAsientos[salaSeleccionada]) {
        estadoAsientos[salaSeleccionada] = JSON.parse(localStorage.getItem(`asientos_${salaSeleccionada}`)) || {};
    }

    const filas = ["A", "B", "C", "D", "E"];
    
    for (let fila of filas) {
        for (let i = 1; i <= 5; i++) {
            const idAsiento = `${fila}_${i}`;
            const div = document.createElement("div");
            div.className = "asiento";
            div.dataset.fila = fila;
            div.dataset.numero = i;
            div.dataset.id = idAsiento;
            
            if (estadoAsientos[salaSeleccionada][idAsiento]) {
                div.classList.add("ocupado");
                div.style.cursor = "not-allowed";
            } else {
                div.classList.add("disponible");
                div.addEventListener("click", function() {
                    this.classList.toggle("reservado");
                });
            }
            
            cont.appendChild(div);
        }
        cont.appendChild(document.createElement("br"));
    }
}

function comprar() {
    const salaSeleccionada = document.getElementById("salaSelecion").value;
    const reservados = document.querySelectorAll(`.asiento.reservado`);
    
    if (reservados.length === 0) {
        alert("Selecciona al menos un asiento");
        return;
    }
    
    const tieneMembresia = confirm("¿El cliente tiene membresía? (Aceptar = Sí, Cancelar = No)");
    const precioUnitario = tieneMembresia ? 65 : 75;
    const total = reservados.length * precioUnitario;
    
    // Registrar venta
    const venta = {
        usuario: nombreUsuario,
        fecha: new Date().toISOString(),
        sala: salaSeleccionada,
        asientos: Array.from(reservados).map(a => `${a.dataset.fila}${a.dataset.numero}`),
        total: total,
        pelicula: peliculasData.find(p => p.sala === salaSeleccionada).titulo,
        conMembresia: tieneMembresia
    };
    
    ventas.push(venta);
    localStorage.setItem('ventas', JSON.stringify(ventas));
    
    // Actualizar asientos
    reservados.forEach(asiento => {
        const idAsiento = asiento.dataset.id;
        estadoAsientos[salaSeleccionada][idAsiento] = true;
        
        asiento.classList.remove("reservado", "disponible");
        asiento.classList.add("ocupado");
        asiento.style.cursor = "not-allowed";
        asiento.onclick = null;
    });
    
    localStorage.setItem(`asientos_${salaSeleccionada}`, JSON.stringify(estadoAsientos[salaSeleccionada]));
    
    // Mostrar ticket
    mostrarTicket(venta);
    
    // Actualizar estadísticas si es empleado
    if (document.getElementById("EmpleadoScreen").style.display === "block") {
        actualizarEstadisticas();
    }
}

function mostrarTicket(venta) {
    let detalles = `
        <strong>Usuario:</strong> ${venta.usuario}<br>
        <strong>Película:</strong> ${venta.pelicula}<br>
        <strong>Sala:</strong> ${venta.sala}<br>
        <strong>Asientos:</strong><br>
    `;
    
    venta.asientos.forEach(asiento => {
        detalles += `• ${asiento}<br>`;
    });
    
    detalles += `<strong>Total:</strong> $${venta.total}`;
    
    document.getElementById("detallesBoleto").innerHTML = detalles;
    document.getElementById("ticket").style.display = "block";
}

// Funciones de estadísticas para empleados
function actualizarEstadisticas() {
    if (ventas.length === 0) {
        // Si no hay ventas, poner ceros o guiones
        document.querySelectorAll("#EmpleadoScreen .card p").forEach(el => {
            el.textContent = "0";
        });
        return;
    }

    // 1. Total de ventas
    document.getElementById("ventasPorUsuario").textContent = ventas.length;

    // 2. Clientes atendidos (usuarios únicos)
    const clientesUnicos = [...new Set(ventas.map(v => v.usuario))];
    document.getElementById("clientesAtendidos").textContent = clientesUnicos.length;

    // 3. Ventas con membresía
    const conMembresia = ventas.filter(v => v.conMembresia).length;
    document.getElementById("ventasConMembresia").textContent = conMembresia;

    // 4. Ventas sin membresía
    document.getElementById("ventasSinMembresia").textContent = ventas.length - conMembresia;

    // 5. Boletos por película
    const boletosPorPelicula = {};
    ventas.forEach(v => {
        boletosPorPelicula[v.pelicula] = (boletosPorPelicula[v.pelicula] || 0) + v.asientos.length;
    });
    document.getElementById("boletosPorPelicula").textContent = Object.keys(boletosPorPelicula).length;

    // 6. Boletos por sala
    const boletosPorSala = {};
    ventas.forEach(v => {
        boletosPorSala[v.sala] = (boletosPorSala[v.sala] || 0) + v.asientos.length;
    });
    document.getElementById("boletosPorSala").textContent = Object.keys(boletosPorSala).length;

    // 7. Película más vendida
    const peliculasVentas = Object.entries(boletosPorPelicula);
    if (peliculasVentas.length > 0) {
        peliculasVentas.sort((a, b) => b[1] - a[1]);
        document.getElementById("peliculaMasVendida").textContent = peliculasVentas[0][0];
    }

    // 8. Película menos vendida
    if (peliculasVentas.length > 1) {
        document.getElementById("peliculaMenosVendida").textContent = 
            peliculasVentas[peliculasVentas.length-1][0];
    }
}

// Funciones para mostrar detalles al hacer clic
function mostrarVentasPorUsuario() {
    const ventasPorUsuario = {};
    ventas.forEach(v => {
        ventasPorUsuario[v.usuario] = (ventasPorUsuario[v.usuario] || 0) + v.asientos.length;
    });
    
    let contenido = "<h4>Ventas por Usuario</h4><ul>";
    for (const [usuario, cantidad] of Object.entries(ventasPorUsuario)) {
        contenido += `<li><strong>${usuario}:</strong> ${cantidad} boletos</li>`;
    }
    contenido += "</ul>";
    
    document.getElementById("ventasContainer").innerHTML = contenido;
}

function mostrarClientesAtendidos() {
    const clientesUnicos = [...new Set(ventas.map(v => v.usuario))];
    document.getElementById("ventasContainer").innerHTML = `
        <h4>Clientes Atendidos</h4>
        <p><strong>Total:</strong> ${clientesUnicos.length}</p>
        <ul>${clientesUnicos.map(c => `<li>${c}</li>`).join("")}</ul>
    `;
}

function mostrarVentasConMembresia() {
    const conMembresia = ventas.filter(v => v.conMembresia);
    document.getElementById("ventasContainer").innerHTML = `
        <h4>Ventas con Membresía</h4>
        <p><strong>Total:</strong> ${conMembresia.length}</p>
        <p><strong>Ingresos:</strong> $${conMembresia.reduce((sum, v) => sum + v.total, 0)}</p>
    `;
}

function mostrarVentasSinMembresia() {
    const sinMembresia = ventas.filter(v => !v.conMembresia);
    document.getElementById("ventasContainer").innerHTML = `
        <h4>Ventas sin Membresía</h4>
        <p><strong>Total:</strong> ${sinMembresia.length}</p>
        <p><strong>Ingresos:</strong> $${sinMembresia.reduce((sum, v) => sum + v.total, 0)}</p>
    `;
}

function mostrarBoletosPorPelicula() {
    const boletosPorPelicula = {};
    ventas.forEach(v => {
        boletosPorPelicula[v.pelicula] = (boletosPorPelicula[v.pelicula] || 0) + v.asientos.length;
    });
    
    let contenido = "<h4>Boletos por Película</h4><ul>";
    for (const [pelicula, cantidad] of Object.entries(boletosPorPelicula)) {
        contenido += `<li><strong>${pelicula}:</strong> ${cantidad} boletos</li>`;
    }
    contenido += "</ul>";
    
    document.getElementById("ventasContainer").innerHTML = contenido;
}

function mostrarBoletosPorSala() {
    const boletosPorSala = {};
    ventas.forEach(v => {
        boletosPorSala[v.sala] = (boletosPorSala[v.sala] || 0) + v.asientos.length;
    });
    
    let contenido = "<h4>Boletos por Sala</h4><ul>";
    for (const [sala, cantidad] of Object.entries(boletosPorSala)) {
        contenido += `<li><strong>Sala ${sala}:</strong> ${cantidad} boletos</li>`;
    }
    contenido += "</ul>";
    
    document.getElementById("ventasContainer").innerHTML = contenido;
}

function mostrarPeliculaMasVendida() {
    const boletosPorPelicula = {};
    ventas.forEach(v => {
        boletosPorPelicula[v.pelicula] = (boletosPorPelicula[v.pelicula] || 0) + v.asientos.length;
    });
    
    const peliculasVentas = Object.entries(boletosPorPelicula);
    if (peliculasVentas.length > 0) {
        peliculasVentas.sort((a, b) => b[1] - a[1]);
        document.getElementById("ventasContainer").innerHTML = `
            <h4>Película Más Vendida</h4>
            <p><strong>${peliculasVentas[0][0]}:</strong> ${peliculasVentas[0][1]} boletos</p>
        `;
    }
}

function mostrarPeliculaMenosVendida() {
    const boletosPorPelicula = {};
    ventas.forEach(v => {
        boletosPorPelicula[v.pelicula] = (boletosPorPelicula[v.pelicula] || 0) + v.asientos.length;
    });
    
    const peliculasVentas = Object.entries(boletosPorPelicula);
    if (peliculasVentas.length > 1) {
        peliculasVentas.sort((a, b) => b[1] - a[1]);
        document.getElementById("ventasContainer").innerHTML = `
            <h4>Película Menos Vendida</h4>
            <p><strong>${peliculasVentas[peliculasVentas.length-1][0]}:</strong> ${peliculasVentas[peliculasVentas.length-1][1]} boletos</p>
        `;
    }
}

// Inicialización
window.onload = function() {
    cargarPeliculas();
    document.getElementById("salaSelecion").addEventListener("change", function() {
        mostrarPeliculaSegunSala();
        generarAsientos();
    });
    
    // Cargar ventas existentes
    ventas = JSON.parse(localStorage.getItem('ventas')) || [];
};

// Para eliminar los boletos vendidos en el localStorage (f12) 
// Eliminar (//)
// localStorage.removeItem('ventas'); 
// for (let i = 1; i <= 3; i++) { 
// localStorage.removeItem(`asientos_${i}`);
// localStorage.removeItem(`asientosOcupados_${i}`);}
// location.reload();