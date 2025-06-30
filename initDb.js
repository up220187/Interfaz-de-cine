const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const DBSOURCE = path.join(__dirname, 'db', 'cine.sqlite');
const db = new sqlite3.Database(DBSOURCE);

async function init() {
  // Crear tablas si no existen
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        usuario TEXT UNIQUE,
        contrasena TEXT,
        rol TEXT CHECK(rol IN ('admin', 'empleado', 'usuario'))
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS peliculas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT,
        duracion INTEGER,
        genero TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        pelicula TEXT,
        sala INTEGER,
        asientos TEXT,
        total REAL,
        fecha TEXT,
        membresia INTEGER DEFAULT 0,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);
  });

  // Insertar admin si no existe
  const hashed = await bcrypt.hash('admin123', 10);
  db.get(`SELECT * FROM usuarios WHERE usuario = 'admin'`, (err, row) => {
    if (!row) {
      db.run(
        `INSERT INTO usuarios (nombre, usuario, contrasena, rol) VALUES (?, ?, ?, ?)`,
        ['Administrador', 'admin', hashed, 'admin'],
        () => console.log('✅ Admin creado: usuario "admin", contraseña "admin123"')
      );
    }
  });

  const usuariosNormales = [
    ['Reyna del Carmen', 'reyna', hashed],
    ['Anahí Valera', 'anahi', hashed],
    ['Carmen ', 'carmen', hashed]
  ];
   usuariosNormales.forEach(([nombre, usuario, pass]) => {
    db.get(`SELECT * FROM usuarios WHERE usuario = ?`, [usuario], (err, row) => {
      if (!row) {
        db.run(
          `INSERT INTO usuarios (nombre, usuario, contrasena, rol) VALUES (?, ?, ?, 'usuario')`,
          [nombre, usuario, pass],
          () => console.log(`✅ Usuario creado: ${usuario} / contraseña: 123`)
        );
      }
    });
  });

  // Insertar películas si no existen
  const peliculas = [
    ['Rápidos y furiosos 9', 120, 'Accion'],
    ['Un jefe en pañales', 180, 'Animada'],
    ['El conjuro 3', 90, 'Terror'],
  ];

  peliculas.forEach(([titulo, duracion, genero]) => {
    db.get(`SELECT * FROM peliculas WHERE titulo = ?`, [titulo], (err, row) => {
      if (!row) {
        db.run(
          `INSERT INTO peliculas (titulo, duracion, genero) VALUES (?, ?, ?)`,
          [titulo, duracion, genero]
        );
      }
    });
  });
}

init();
