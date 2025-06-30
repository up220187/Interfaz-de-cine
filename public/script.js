let usuarioActual = null;
let peliculas = [];
let asientosSeleccionados = [];

// Revisar sesión al cargar
function checkSesion() {
  const usuarioJSON = sessionStorage.getItem('usuario');
  if (usuarioJSON) {
    usuarioActual = JSON.parse(usuarioJSON);
    mostrarPanelPorRol(usuarioActual.rol);
  } else {
    mostrarLogin();
  }
  cargarPeliculas();
}

function mostrarLogin() {
  document.getElementById('login').style.display = 'block';
  document.getElementById('salas').style.display = 'none';
  document.getElementById('AdminScreen').style.display = 'none';
  document.getElementById('EmpleadoScreen').style.display = 'none';
  document.getElementById('casetaEmpleado').style.display = 'none';
  document.getElementById('ticket').style.display = 'none';
}

function mostrarPanelPorRol(rol) {
  document.getElementById("login").style.display = "none";

  if (rol === "admin") {
    document.getElementById("AdminScreen").style.display = "block";
    cargarEmpleados();
  } else if (rol === "empleado") {
    document.getElementById("EmpleadoScreen").style.display = "block";
    document.getElementById("casetaEmpleado").style.display = "block";
    cargarPeliculasParaCaseta();
    generarAsientosCaseta();                
    cargarEstadisticas(); 
  } else {
    document.getElementById("salas").style.display = "block";
  }
}

async function iniciarSesion() {
  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contrasena }),
  });

  const data = await res.json();

  if (!data.success) {
    document.getElementById('login').style.display = 'none';
    document.getElementById('salas').style.display = 'block';
    document.getElementById('AdminScreen').style.display = 'none';
    document.getElementById('EmpleadoScreen').style.display = 'none';
    document.getElementById('casetaEmpleado').style.display = 'none';
    document.getElementById('ticket').style.display = 'none';
    return;
  }

  usuarioActual = data.usuario;
  sessionStorage.setItem("usuario", JSON.stringify(usuarioActual));
  mostrarPanelPorRol(usuarioActual.rol);
}

function cerrarSesion() {
  usuarioActual = null;
  sessionStorage.removeItem("usuario");
  location.reload();
}

// Cargar empleados (solo admin)
async function cargarEmpleados() {
  try {
    const res = await fetch("/api/usuarios");
    const lista = document.getElementById("listaEmpleados");
    const usuarios = await res.json();

    lista.innerHTML = '<table><tr><th>Nombre</th><th>Usuario</th><th>Rol</th></tr>';
    usuarios.forEach(u => {
      if (u.rol === 'empleado' || u.rol === 'admin') {
        lista.innerHTML += `<tr><td>${u.nombre}</td><td>${u.usuario}</td><td>${u.rol}</td></tr>`;
      }
    });
    lista.innerHTML += '</table>';
  } catch (err) {
    console.error("Error cargando empleados", err);
  }
}

// Crear empleado
async function crearEmpleado() {
  const nombre = document.getElementById("nombreEmpleado").value.trim();
  const usuario = document.getElementById("usuarioEmpleado").value.trim();
  const contrasena = document.getElementById("contrasenaEmpleado").value.trim();

  if (!nombre || !usuario || !contrasena) {
    return alert("Completa todos los campos.");
  }

  const res = await fetch("/api/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, usuario, contrasena, rol: "empleado" }),
  });

  const data = await res.json();

  if (data.success) {
    alert("Empleado creado con éxito");
    cargarEmpleados();
  } else {
    alert(data.error || "Error al crear el empleado");
  }
}

// Cargar películas
async function cargarPeliculas() {
  try {
    const res = await fetch("/api/peliculas");
    peliculas = await res.json();

    const container = document.getElementById("peliculasContainer");
    if (container) {
      container.innerHTML = "";
      peliculas.forEach(p => {
        const div = document.createElement("div");
        div.innerText = `${p.titulo} (${p.genero})`;
        container.appendChild(div);
      });
    }
  } catch (err) {
    console.error("Error cargando películas", err);
  }
}

async function cargarPeliculasParaCaseta() {
  try {
    const select = document.getElementById("peliculaCaseta");
    select.innerHTML = "<option value=''>Selecciona</option>";

    const res = await fetch("/api/peliculas");
    const data = await res.json();
    data.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.titulo;
      opt.textContent = p.titulo;
      select.appendChild(opt);
    });

    // Llamar a generar asientos automáticamente al cargar
    select.addEventListener("change", generarAsientosCaseta);
  } catch (err) {
    console.error("Error al cargar películas para caseta:", err);
  }
}


// Generar asientos con ocupados desde DB y selección
async function generarAsientos() {
  const cont = document.getElementById("asientosContainer");
  cont.innerHTML = "";
  asientosSeleccionados = [];

  const sala = document.getElementById("salaSelecion").value;
  if (!sala) return;

  // 1. Obtener ventas y marcar ocupados
  const res = await fetch("/api/ventas");
  const ventas = await res.json();
  const ocupados = [];

  ventas.forEach(v => {
    if (v.sala === parseInt(sala)) {
      const asientos = v.asientos.split(',');
      ocupados.push(...asientos.map(a => a.trim()));
    }
  });

  const filas = ["A", "B", "C", "D"];
  let contador = 0;
  for (let fila of filas) {
    for (let i = 1; i <= 5; i++) {
      const id = `${fila}${i}`;
      const div = document.createElement("div");
      div.className = "asiento";
      div.textContent = id;
      div.dataset.id = id;

      if (ocupados.includes(id)) {
        div.classList.add("ocupado");
      } else {
        div.classList.add("disponible");
        div.onclick = () => toggleSeleccionAsiento(div);
      }

      cont.appendChild(div);
      contador++;
      if (contador >= 20) break;
    }
    cont.appendChild(document.createElement("br"));
    if (contador >= 20) break;
  }
}

function toggleSeleccionAsiento(div) {
  const id = div.dataset.id;

  if (div.classList.contains("seleccionado")) {
    div.classList.remove("seleccionado");
    asientosSeleccionados = asientosSeleccionados.filter(a => a !== id);
  } else {
    div.classList.add("seleccionado");
    asientosSeleccionados.push(id);
  }
}

// Comprar boletos
async function comprar() {
  const reservados = document.querySelectorAll(".asiento.seleccionado");
  const sala = document.getElementById("salaSelecion").value;
  const pelicula = peliculas[0]?.titulo || "Película desconocida";
  const fecha = new Date().toISOString();

  if (!sala || reservados.length === 0) {
    return alert("Selecciona una sala y al menos un asiento.");
  }

  const tieneMembresia = confirm("¿El cliente tiene membresía?");
  const descuento = tieneMembresia ? 0.15 : 0;
  const precioBase = 75;
  const total = reservados.length * precioBase * (1 - descuento);
  const asientos = Array.from(reservados).map(div => div.dataset.id);
  const usuario_id = usuarioActual ? usuarioActual.id : null;

  try {
    const res = await fetch("/api/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id,
        pelicula,
        sala,
        asientos,
        total,
        fecha,
        membresia: tieneMembresia ? 1 : 0
      })
    });

    const data = await res.json();
    if (!data.success) return alert(data.error || "Error en la compra.");

    let detalles = `Usuario: ${usuarioActual?.nombre || "Invitado"}<br>`;
    reservados.forEach(a => {
      const id = a.dataset.id;
      const fila = id.charAt(0);
      const numero = id.slice(1);
      detalles += `Fila ${fila}, Asiento ${numero}<br>`;
      a.classList.remove("seleccionado");
      a.classList.add("ocupado");
      a.onclick = null;
    });

    if (tieneMembresia) {
      detalles += `<br><strong>Se aplicó un 15% de descuento por membresía.</strong>`;
    }

    document.getElementById("detallesBoleto").innerHTML = detalles;
    document.getElementById("totalPago").textContent = "Total: $" + total.toFixed(2);
    document.getElementById("ticket").style.display = "block";

    // actualizar estadísticas si está visible
    if (usuarioActual?.rol === 'admin' || usuarioActual?.rol === 'empleado') {
      cargarEstadisticas();
    }
  } catch (err) {
    console.error("Error al comprar:", err);
    alert("Error de servidor");
  }
}

async function cargarEstadisticas() {
  try {
    const res = await fetch('/api/ventas');
    const ventas = await res.json();
    if (!Array.isArray(ventas)) return;

    const estadisticas = {
      totalVentas: 0,
      clientes: new Set(),
      conMembresia: 0,
      sinMembresia: 0,
      porPelicula: {},
      porSala: {},
    };

    ventas.forEach(v => {
      estadisticas.totalVentas += v.total;
      if (v.usuario_id) estadisticas.clientes.add(v.usuario_id);

      const conMembresia = Number(v.membresia) === 1;
if (conMembresia) estadisticas.conMembresia++;
else estadisticas.sinMembresia++;

      estadisticas.porPelicula[v.pelicula] = (estadisticas.porPelicula[v.pelicula] || 0) + v.asientos.split(',').length;
      estadisticas.porSala[v.sala] = (estadisticas.porSala[v.sala] || 0) + v.asientos.split(',').length;
    });

    const peliculaMasVendida = Object.entries(estadisticas.porPelicula).reduce((a, b) => a[1] > b[1] ? a : b, ["", 0]);
    const peliculaMenosVendida = Object.entries(estadisticas.porPelicula).reduce((a, b) => a[1] < b[1] ? a : b, ["", Infinity]);

    const contenedor = document.getElementById('ventasContainer');
    contenedor.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><h4>Total Ventas</h4><p>$${estadisticas.totalVentas.toFixed(2)}</p></div>
        <div class="stat-card"><h4>Clientes Atendidos</h4><p>${estadisticas.clientes.size}</p></div>
        <div class="stat-card"><h4>Ventas con Membresía</h4><p>${estadisticas.conMembresia}</p></div>
        <div class="stat-card"><h4>Ventas sin Membresía</h4><p>${estadisticas.sinMembresia}</p></div>
        <div class="stat-card"><h4>Película más vendida</h4><p>${peliculaMasVendida[0]}</p></div>
        <div class="stat-card"><h4>Película menos vendida</h4><p>${peliculaMenosVendida[0]}</p></div>
      </div>

      <h3>Boletos vendidos por película:</h3>
      <ul>
        ${Object.entries(estadisticas.porPelicula).map(([titulo, cant]) => `<li>${titulo}: ${cant}</li>`).join('')}
      </ul>

      <h3>Boletos vendidos por sala:</h3>
      <ul>
        ${Object.entries(estadisticas.porSala).map(([sala, cant]) => `<li>Sala ${sala}: ${cant}</li>`).join('')}
      </ul>
    `;
  } catch (err) {
    console.error('Error cargando estadísticas:', err);
  }
}


// Mostrar boleto
async function venderDesdeCaseta() {
  const pelicula = document.getElementById("peliculaCaseta").value;
  const nombreCliente = document.getElementById("nombreClienteCaseta").value.trim();
  const fecha = new Date().toISOString();
  const sala = 1; // Sala fija o definida internamente
  const precioBase = 75;
  const asientos = asientosSeleccionados;

  if (!pelicula || asientos.length === 0 || !nombreCliente) {
    return alert("Completa todos los campos para registrar la venta.");
  }

  const tieneMembresia = confirm("¿El cliente tiene membresía?");
  const descuento = tieneMembresia ? 0.15 : 0;
  const total = asientos.length * precioBase * (1 - descuento);

  const venta = {
    usuario_id: usuarioActual.id,
    pelicula,
    sala,
    asientos,
    total,
    fecha,
    membresia: tieneMembresia ? 1 : 0
  };

  try {
    const res = await fetch("/api/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(venta)
    });

    const data = await res.json();
    if (data.success) {
      let detalles = `Empleado: ${usuarioActual.nombre}<br>`;
      detalles += `Cliente: ${nombreCliente}<br>`;
      detalles += `Película: ${pelicula}<br>Sala: ${sala}<br>Asientos: ${asientos.join(", ")}<br>`;
      detalles += `Fecha: ${new Date(fecha).toLocaleString()}<br>`;
      if (tieneMembresia) {
        detalles += `<br><strong>Se aplicó un 15% de descuento por membresía.</strong>`;
      }
      document.getElementById("detallesBoleto").innerHTML = detalles;
      document.getElementById("totalPago").textContent = "Total: $" + total.toFixed(2);
      document.getElementById("ticket").style.display = "block";

      alert("Venta registrada correctamente.");

      if (usuarioActual?.rol === 'admin' || usuarioActual?.rol === 'empleado') {
        cargarEstadisticas();
      }

      generarAsientosCaseta();
    } else {
      alert(data.error || "Error en la venta");
    }
  } catch (err) {
    console.error("Error registrando venta:", err);
    alert("Error de servidor");
  }
}

function generarAsientosCaseta() {
  const contenedor = document.getElementById("asientosCasetaContainer");
  contenedor.innerHTML = "";
  asientosSeleccionados = [];

  const peliculaSeleccionada = document.getElementById("peliculaCaseta").value;
  if (!peliculaSeleccionada) {
    contenedor.innerHTML = "<p style='text-align:center;'>Selecciona una película primero.</p>";
    return;
  }

  fetch("/api/ventas")
    .then(res => res.json())
    .then(ventas => {
      const ocupados = new Set();

      ventas.forEach(v => {
        if (v.pelicula === peliculaSeleccionada) {
          const asientos = v.asientos.split(',');
          asientos.forEach(a => ocupados.add(a.trim()));
        }
      });

      const filas = ["A", "B", "C", "D"];
      const columnas = 5;

      const grid = document.createElement("div");
      grid.id = "contenedor-asientos";
      grid.style.display = "flex";
      grid.style.flexWrap = "wrap";
      grid.style.justifyContent = "center";
      grid.style.maxWidth = "300px";
      grid.style.margin = "0 auto";

      filas.forEach(fila => {
        for (let i = 1; i <= columnas; i++) {
          const id = `${fila}${i}`;
          const div = document.createElement("div");
          div.className = "asiento";
          div.dataset.fila = fila;
          div.dataset.numero = i;
          div.dataset.id = id;
          div.textContent = id;

          if (ocupados.has(id)) {
            div.classList.add("ocupado");
          } else {
            div.classList.add("disponible");
            div.addEventListener("click", () => toggleSeleccionAsiento(div));
          }

          grid.appendChild(div);
        }
      });

      contenedor.appendChild(grid);
    })
    .catch(err => {
      console.error("Error generando asientos para caseta:", err);
      contenedor.innerHTML = "<p>Error al cargar asientos.</p>";
    });
}
