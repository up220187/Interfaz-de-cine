const API_URL = 'http://localhost:3000/api';
const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" };

// Variables globales
let nombreUsuario = "";
let peliculasData = [];
let empleados = [];
let ventas = [];
let estadoAsientos = {};

// Función mejorada para iniciar sesión
async function iniciarSesion() {
  const user = document.getElementById("usuario").value.trim();
  const pass = document.getElementById("contrasena").value.trim();

  if (!user || !pass) {
    mostrarError("Ingrese usuario y contraseña");
    return;
  }

  try {
    // 1. Verificar si es admin
    if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
      iniciarSesionAdmin();
      return;
    }

    // 2. Verificar si es empleado
    const empleados = await obtenerEmpleados();
    const empleado = empleados.find(emp => 
      emp.usuario === user && emp.contrasena === pass
    );

    if (empleado) {
      iniciarSesionEmpleado(empleado);
      return;
    }

    // 3. Usuario normal
    iniciarSesionUsuarioNormal(user);

  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    mostrarError("Error de conexión. Intente nuevamente.");
  }
}

async function obtenerEmpleados() {
  try {
    const response = await fetch(`${API_URL}/empleados`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [data]; // Asegurar que siempre sea array
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    throw error;
  }
}

// Función para iniciar sesión como administrador
function iniciarSesionAdmin() {
  console.log("Iniciando sesión como administrador");
  ocultarTodosPaneles();
  document.getElementById("AdminScreen").style.display = "block";
  document.getElementById("logout").style.display = "block";
  actualizarListaEmpleados();
}

// Función para iniciar sesión como empleado
function iniciarSesionEmpleado(empleado) {
  console.log(`Iniciando sesión como empleado: ${empleado.nombre}`);
  ocultarTodosPaneles();
  document.getElementById("EmpleadoScreen").style.display = "block";
  document.getElementById("logout").style.display = "block";
  actualizarEstadisticas();
}

// Función para iniciar sesión como usuario normal
function iniciarSesionUsuarioNormal(usuario) {
  console.log(`Iniciando sesión como usuario normal: ${usuario}`);
  ocultarTodosPaneles();
  nombreUsuario = usuario;
  document.getElementById("salas").style.display = "block";
  document.getElementById("logout").style.display = "block";
}

// Función para ocultar todos los paneles
function ocultarTodosPaneles() {
  const paneles = ["login", "AdminScreen", "EmpleadoScreen", "salas", "ticket"];
  paneles.forEach(id => {
    const panel = document.getElementById(id);
    if (panel) panel.style.display = "none";
  });
}
// Función genérica para obtener datos
async function obtenerDatos(endpoint) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error obteniendo ${endpoint}:`, error);
    throw error;
  }
}

// Carga inicial de datos
async function cargarDatosIniciales() {
  try {
    [peliculasData, empleados, ventas] = await Promise.all([
      obtenerDatos('/peliculas'),
      obtenerDatos('/empleados'),
      obtenerDatos('/ventas')
    ]);
  } catch (error) {
    console.error("Error cargando datos iniciales:", error);
  }
}

// Funciones de visualización
function mostrarPeliculaSegunSala() {
  const sala = document.getElementById("salaSelecion").value;
  const contenedor = document.getElementById("peliculasContainer");
  const pelicula = peliculasData.find(p => p.sala === sala);
  
  contenedor.innerHTML = pelicula ? `
    <h3>${pelicula.titulo}</h3>
    <p><strong>Categoría:</strong> ${pelicula.categoria}</p>
    <p><strong>Sala:</strong> ${pelicula.sala}</p>
  ` : "No hay película en esta sala";
}
// Inicialización al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  await cargarDatosIniciales();
  
  // Evento para cambiar de sala
  document.getElementById("salaSelecion")?.addEventListener("change", () => {
    mostrarPeliculaSegunSala();
    generarAsientos();
  });
});

// Carga todos los datos necesarios al inicio
async function cargarDatosIniciales() {
  await cargarPeliculas();
  await cargarEmpleados();
  await cargarVentas();
}

async function cargarPeliculas() {
  try {
    const response = await fetch(`${API_URL}/peliculas`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    peliculasData = await response.json();
    
    // Verifica que los datos tengan el formato correcto
    if (!Array.isArray(peliculasData)) {
      console.warn('Los datos de películas no son un array:', peliculasData);
      peliculasData = [];
    }
  } catch (error) {
    console.error("Error cargando películas:", error);
    mostrarError("Error al cargar cartelera");
    peliculasData = [];
  }
}

// Carga los empleados desde XML (convertido a JSON por Node.js)
async function cargarEmpleados() {
  try {
    const response = await fetch(`${API_URL}/empleados`);
    empleados = await response.json();
  } catch (error) {
    console.error("Error cargando empleados:", error);
    empleados = [];
  }
}

// Carga las ventas desde XML (convertido a JSON por Node.js)
async function cargarVentas() {
  try {
    const response = await fetch(`${API_URL}/ventas`);
    ventas = await response.json();
  } catch (error) {
    console.error("Error cargando ventas:", error);
    ventas = [];
  }
}

// Guarda los empleados (Node.js lo convierte a XML)
async function guardarEmpleados() {
  try {
    const response = await fetch(`${API_URL}/empleados`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(empleados),
    });
    if (!response.ok) throw new Error("Error al guardar empleados");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Guarda las ventas (Node.js lo convierte a XML)
async function guardarVentas() {
  try {
    const response = await fetch(`${API_URL}/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ventas),
    });
    if (!response.ok) throw new Error("Error al guardar ventas");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Añade un nuevo empleado y lo guarda en XML
async function crearEmpleado() {
  const nombre = document.getElementById("nombreEmpleado").value;
  const usuario = document.getElementById("usuarioEmpleado").value;
  const contrasena = document.getElementById("contrasenaEmpleado").value;

  if (!nombre || !usuario || !contrasena) {
    alert("Complete todos los campos");
    return;
  }

  if (empleados.some((emp) => emp.usuario === usuario)) {
    alert("Este usuario ya existe");
    return;
  }

  const nuevoEmpleado = {
    id: Date.now(),
    nombre,
    usuario,
    contrasena,
    fechaRegistro: new Date().toLocaleString(),
  };

  empleados.push(nuevoEmpleado);
  await guardarEmpleados();
  actualizarListaEmpleados();

  // Limpiar el formulario
  document.getElementById("nombreEmpleado").value = "";
  document.getElementById("usuarioEmpleado").value = "";
  document.getElementById("contrasenaEmpleado").value = "";
}

// Elimina un empleado y actualiza el XML
async function eliminarEmpleado(id) {
  if (!confirm("¿Está seguro de eliminar este empleado?")) return;

  empleados = empleados.filter((emp) => emp.id !== id);
  await guardarEmpleados();
  actualizarListaEmpleados();
}

// Muestra la lista de empleados en la tabla
function actualizarListaEmpleados() {
  const contenedor = document.getElementById("listaEmpleados");
  contenedor.innerHTML = empleados.length === 0
    ? "<p class='no-empleados'>No hay empleados registrados</p>"
    : `
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
          ${empleados.map(
            (emp) => `
            <tr>
              <td>${emp.nombre}</td>
              <td>${emp.usuario}</td>
              <td>${emp.fechaRegistro}</td>
              <td>
                <button onclick="eliminarEmpleado(${emp.id})" class="btn-eliminar">
                  Eliminar
                </button>
              </td>
            </tr>
          `
          ).join("")}
        </tbody>
      </table>
    `;
}

// Procesa la compra de boletos y guarda en XML
async function comprar() {
  const salaSeleccionada = document.getElementById("salaSelecion").value;
  const reservados = document.querySelectorAll(".asiento.reservado");

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
    asientos: Array.from(reservados).map((a) => `${a.dataset.fila}${a.dataset.numero}`),
    total,
    pelicula: peliculasData.find((p) => p.sala === salaSeleccionada).titulo,
    conMembresia: tieneMembresia,
  };

  ventas.push(venta);
  await guardarVentas();

  // Actualizar estado de asientos (localStorage temporal)
  reservados.forEach((asiento) => {
    const idAsiento = asiento.dataset.id;
    if (!estadoAsientos[salaSeleccionada]) estadoAsientos[salaSeleccionada] = {};
    estadoAsientos[salaSeleccionada][idAsiento] = true;

    asiento.classList.remove("reservado", "disponible");
    asiento.classList.add("ocupado");
    asiento.style.cursor = "not-allowed";
    asiento.onclick = null;
  });

  localStorage.setItem(`asientos_${salaSeleccionada}`, JSON.stringify(estadoAsientos[salaSeleccionada]));

  mostrarTicket(venta);

  if (document.getElementById("EmpleadoScreen").style.display === "block") {
    actualizarEstadisticas();
  }
}

// Muestra el ticket de compra
function mostrarTicket(venta) {
  const detalles = `
    <strong>Usuario:</strong> ${venta.usuario}<br>
    <strong>Película:</strong> ${venta.pelicula}<br>
    <strong>Sala:</strong> ${venta.sala}<br>
    <strong>Asientos:</strong><br>
    ${venta.asientos.map((asiento) => `• ${asiento}<br>`).join("")}
    <strong>Total:</strong> $${venta.total}
  `;

  document.getElementById("detallesBoleto").innerHTML = detalles;
  document.getElementById("ticket").style.display = "block";
}

// Actualiza las estadísticas de ventas
function actualizarEstadisticas() {
  if (ventas.length === 0) {
    document.querySelectorAll("#EmpleadoScreen .card p").forEach((el) => {
      el.textContent = "0";
    });
    return;
  }

  // Total de ventas
  document.getElementById("ventasPorUsuario").textContent = ventas.length;

  // Clientes únicos
  const clientesUnicos = [...new Set(ventas.map((v) => v.usuario))];
  document.getElementById("clientesAtendidos").textContent = clientesUnicos.length;

  // Ventas con/sin membresía
  const conMembresia = ventas.filter((v) => v.conMembresia).length;
  document.getElementById("ventasConMembresia").textContent = conMembresia;
  document.getElementById("ventasSinMembresia").textContent = ventas.length - conMembresia;

  // Boletos por película/sala
  const boletosPorPelicula = {};
  const boletosPorSala = {};
  ventas.forEach((v) => {
    boletosPorPelicula[v.pelicula] = (boletosPorPelicula[v.pelicula] || 0) + v.asientos.length;
    boletosPorSala[v.sala] = (boletosPorSala[v.sala] || 0) + v.asientos.length;
  });

  document.getElementById("boletosPorPelicula").textContent = Object.keys(boletosPorPelicula).length;
  document.getElementById("boletosPorSala").textContent = Object.keys(boletosPorSala).length;

  // Película más/menos vendida
  const peliculasVentas = Object.entries(boletosPorPelicula);
  if (peliculasVentas.length > 0) {
    peliculasVentas.sort((a, b) => b[1] - a[1]);
    document.getElementById("peliculaMasVendida").textContent = peliculasVentas[0][0];
    if (peliculasVentas.length > 1) {
      document.getElementById("peliculaMenosVendida").textContent =
        peliculasVentas[peliculasVentas.length - 1][0];
    }
  }
}

async function iniciarSesion() {
  const user = document.getElementById("usuario").value.trim();
  const pass = document.getElementById("contrasena").value.trim();
  
  if (!user || !pass) {
    mostrarError("Ingrese usuario y contraseña");
    return;
  }

  try {
    // Mostrar carga
    const btnLogin = document.querySelector("#login button");
    btnLogin.disabled = true;
    btnLogin.textContent = "Verificando...";

    // 1. Verificar si es admin
    if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
      iniciarSesionAdmin();
      return;
    }

    // 2. Verificar si es empleado
    const response = await fetch(`${API_URL}/empleados`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    
    const empleados = await response.json();
    const empleado = empleados.find(emp => 
      emp.usuario === user && emp.contrasena === pass
    );
    
    if (empleado) {
      iniciarSesionEmpleado(empleado);
      return;
    }

    // 3. Usuario normal
    iniciarSesionUsuarioNormal(user);
    
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    mostrarError("Credenciales incorrectas o error de conexión");
  } finally {
    const btnLogin = document.querySelector("#login button");
    if (btnLogin) {
      btnLogin.disabled = false;
      btnLogin.textContent = "Entrar";
    }
  }
}

function mostrarError(mensaje) {
  const errorDiv = document.getElementById("error-login") || document.createElement("div");
  errorDiv.id = "error-login";
  errorDiv.style.color = "red";
  errorDiv.style.marginTop = "10px";
  errorDiv.textContent = mensaje;
  
  const loginDiv = document.getElementById("login");
  if (!document.getElementById("error-login")) {
    loginDiv.appendChild(errorDiv);
  }
}

// Cierra la sesión
function cerrarSesion() {
  nombreUsuario = "";
  ocultarTodosPaneles();
  document.getElementById("login").style.display = "block";
  document.getElementById("usuario").value = "";
  document.getElementById("contrasena").value = "";
}

// Oculta todos los paneles
function ocultarTodosPaneles() {
  document.getElementById("login").style.display = "none";
  ["AdminScreen", "EmpleadoScreen", "salas", "ticket"].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });
}

function generarAsientos() {
  const salaSeleccionada = document.getElementById("salaSelecion").value;
  const contenedor = document.getElementById("asientosContainer");
  
  if (!salaSeleccionada) {
    contenedor.innerHTML = "<p>Selecciona una sala primero</p>";
    return;
  }

  // Limpiar contenedor
  contenedor.innerHTML = "";

  // Inicializar estado de asientos si no existe
  if (!estadoAsientos[salaSeleccionada]) {
    estadoAsientos[salaSeleccionada] = JSON.parse(
      localStorage.getItem(`asientos_${salaSeleccionada}`)
    ) || {};
  }

  // Crear asientos (5 filas A-E, 5 asientos por fila)
  const filas = ['A', 'B', 'C', 'D', 'E'];
  
  filas.forEach(fila => {
    for (let numero = 1; numero <= 5; numero++) {
      const idAsiento = `${fila}_${numero}`;
      const asiento = document.createElement("div");
      
      // Configurar atributos del asiento
      asiento.className = "asiento";
      asiento.dataset.fila = fila;
      asiento.dataset.numero = numero;
      asiento.dataset.id = idAsiento;
      asiento.textContent = `${fila}${numero}`;

      // Verificar estado del asiento
      if (estadoAsientos[salaSeleccionada][idAsiento]) {
        asiento.classList.add("ocupado");
        asiento.style.cursor = "not-allowed";
      } else {
        asiento.classList.add("disponible");
        asiento.addEventListener("click", function() {
          this.classList.toggle("seleccionado");
        });
      }

      contenedor.appendChild(asiento);
    }
    contenedor.appendChild(document.createElement("br"));
  });
}