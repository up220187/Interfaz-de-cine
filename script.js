    let nombreUsuario = "";

   function iniciarSesion() {
    const user = document.getElementById("usuario").value;
    const pass = document.getElementById("contrasena").value;
    if (user && pass) {
        nombreUsuario = user;
        document.getElementById("login").style.display = "none";
        document.getElementById("salas").style.display = "block";
        document.getElementById("logout").style.display = "block";
    } else {
        alert("Ingrese usuario y contraseña");
    }
}

function cerrarSesion() {
    nombreUsuario = "";
    document.getElementById("login").style.display = "block";
    document.getElementById("salas").style.display = "none";
    document.getElementById("logout").style.display = "none";
    document.getElementById("ticket").style.display = "none";
    document.getElementById("usuario").value = "";
    document.getElementById("contrasena").value = "";
}


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
            mostrarPeliculaSegunSala(); // mostrar la pelicula inicial (sala 1)
        });
}

    function mostrarPeliculaSegunSala() {
        const salaSeleccionada = document.getElementById("salaSelecion").value;
        const cont = document.getElementById("peliculasContainer");
        cont.innerHTML = "";

        const pelicula = peliculasData.find(p => p.sala === salaSeleccionada);
        if (pelicula) {
            cont.textContent = `Película: ${pelicula.titulo} (${pelicula.categoria})`;
        } else {
            cont.textContent = "No hay película asignada a esta sala.";
        }
    }

function mostrarPeliculaSegunSala() {
    const salaSeleccionada = document.getElementById("salaSelecion").value;
    const cont = document.getElementById("peliculasContainer");
    cont.innerHTML = "";

    const pelicula = peliculasData.find(p => p.sala === salaSeleccionada);
    if (pelicula) {
        cont.textContent = `Película: ${pelicula.titulo} (${pelicula.categoria})`;
    } else {
        cont.textContent = "No hay película asignada a esta sala.";
    }
}

document.getElementById("salaSelecion").addEventListener("change", () => {
    mostrarPeliculaSegunSala();
    generarAsientos();
});


    function generarAsientos() {
    const cont = document.getElementById("asientosContainer");
    cont.innerHTML = "";
    const filas = ["A", "B", "C", "D"];
    let contador = 0;
    for (let fila of filas) {
        for (let i = 1; i <= 5; i++) {
        const div = document.createElement("div");
        div.className = "asiento disponible";
        div.dataset.fila = fila;
        div.dataset.numero = i;
        div.onclick = () => {
            if (!div.classList.contains("ocupado")) {
            div.classList.toggle("reservado");
            }
        };
        cont.appendChild(div);
        contador++;
        if (contador >= 20) break;
        }
        if (contador >= 20) break;
        cont.appendChild(document.createElement("br"));
    }
    }
    
    function comprar() {
    const reservados = document.querySelectorAll(".asiento.reservado");
    let total = reservados.length * 75;
    let detalles = "Usuario: " + nombreUsuario + "<br>";
    reservados.forEach(a => {
        detalles += `Fila ${a.dataset.fila}, Asiento ${a.dataset.numero}<br>`;
        a.classList.remove("reservado");
        a.classList.add("ocupado");
    });
    document.getElementById("detallesBoleto").innerHTML = detalles;
    document.getElementById("totalPago").textContent = "Total: $" + total;
    document.getElementById("ticket").style.display = "block";
    }


    