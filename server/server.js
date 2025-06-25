const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const xml2js = require('xml2js');

const app = express();
const PORT = 3000;

// Configuración
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rutas de archivos
const DATA_DIR = path.join(__dirname, 'data');
const EMPLEADOS_XML = path.join(DATA_DIR, 'empleados.xml');
const VENTAS_XML = path.join(DATA_DIR, 'ventas.xml');
const PELICULAS_XML = path.join(DATA_DIR, 'peliculas.xml');

// Inicializar archivos si no existen
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(EMPLEADOS_XML)) fs.writeFileSync(EMPLEADOS_XML, '<?xml version="1.0"?><empleados></empleados>');
if (!fs.existsSync(VENTAS_XML)) fs.writeFileSync(VENTAS_XML, '<?xml version="1.0"?><ventas></ventas>');
if (!fs.existsSync(PELICULAS_XML)) fs.writeFileSync(PELICULAS_XML, '<?xml version="1.0"?><peliculas></peliculas>');

// Helper: Leer XML y convertir a JSON
async function readXmlToJson(filePath) {
  try {
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
    const result = await parser.parseStringPromise(xmlData);
    return result;
  } catch (error) {
    console.error(`Error leyendo ${filePath}:`, error);
    return null;
  }
}

// Helper: Convertir JSON a XML y guardar
function writeJsonToXml(filePath, jsonData, rootElement) {
  const builder = new xml2js.Builder();
  const xml = builder.buildObject({ [rootElement]: jsonData });
  fs.writeFileSync(filePath, xml);
}

// Rutas API
app.get('/api/peliculas', async (req, res) => {
  try {
    const data = await readXmlToJson(PELICULAS_XML);
    const peliculas = data?.peliculas?.pelicula || [];
    res.json(Array.isArray(peliculas) ? peliculas : [peliculas]);
  } catch (error) {
    res.status(500).json({ error: 'Error cargando películas' });
  }
});

app.get('/api/empleados', async (req, res) => {
  try {
    const data = await readXmlToJson(EMPLEADOS_XML);
    const empleados = data?.empleados?.empleado || [];
    res.json(Array.isArray(empleados) ? empleados : [empleados]);
  } catch (error) {
    res.status(500).json({ error: 'Error cargando empleados' });
  }
});

app.post('/api/empleados', async (req, res) => {
  try {
    writeJsonToXml(EMPLEADOS_XML, req.body, 'empleados');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error guardando empleados' });
  }
});

app.get('/api/ventas', async (req, res) => {
  try {
    const data = await readXmlToJson(VENTAS_XML);
    const ventas = data?.ventas?.venta || [];
    res.json(Array.isArray(ventas) ? ventas : [ventas]);
  } catch (error) {
    res.status(500).json({ error: 'Error cargando ventas' });
  }
});

app.post('/api/ventas', async (req, res) => {
  try {
    writeJsonToXml(VENTAS_XML, req.body, 'ventas');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error guardando ventas' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});