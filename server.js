const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Base de datos
const dbPath = path.join(__dirname, 'db', 'cine.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('❌ Error conectando a la base de datos:', err.message);
  console.log('✅ Conectado a la base de datos SQLite');
});

// Obtener películas
app.get('/api/peliculas', (req, res) => {
  db.all(`SELECT * FROM peliculas`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error cargando películas' });
    res.json(rows);
  });
});

// Crear usuario
app.post('/api/usuarios', async (req, res) => {
  const { nombre, usuario, contrasena, rol } = req.body;
  if (!nombre || !usuario || !contrasena || !rol)
    return res.status(400).json({ error: 'Faltan campos obligatorios' });

  const hashed = await bcrypt.hash(contrasena, 10);
  db.run(
    `INSERT INTO usuarios (nombre, usuario, contrasena, rol) VALUES (?, ?, ?, ?)`,
    [nombre, usuario, hashed, rol],
    function (err) {
      if (err) return res.status(500).json({ error: 'Usuario duplicado o error al crear' });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Obtener usuarios
app.get('/api/usuarios', (req, res) => {
  db.all(`SELECT id, nombre, usuario, rol FROM usuarios`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error cargando usuarios' });
    res.json(rows);
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { usuario, contrasena } = req.body;
  if (!usuario || !contrasena)
    return res.status(400).json({ error: 'Usuario o contraseña faltante' });

  db.get(`SELECT * FROM usuarios WHERE usuario = ?`, [usuario], async (err, user) => {
    if (err || !user) return res.json({ success: false, error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(contrasena, user.contrasena);
    if (!match) return res.json({ success: false, error: 'Contraseña incorrecta' });

    const usuarioSeguro = {
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      rol: user.rol,
    };
    res.json({ success: true, usuario: usuarioSeguro });
  });
});

// Registrar venta
app.post('/api/ventas', (req, res) => {
  const { usuario_id, pelicula, sala, asientos, total, fecha, membresia } = req.body;
  if (!pelicula || !sala || !asientos || !total || !fecha )
    return res.status(400).json({ error: 'Faltan datos de la venta' });

  const asientosTexto = Array.isArray(asientos) ? asientos.join(',') : asientos;

  db.run(
    `INSERT INTO ventas (usuario_id, pelicula, sala, asientos, total, fecha, membresia) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [usuario_id, pelicula, sala, asientosTexto, total, fecha, membresia],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error registrando venta' });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Obtener todas las ventas
app.get('/api/ventas', (req, res) => {
  db.all(`SELECT * FROM ventas`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error cargando ventas' });
    res.json(rows);
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
