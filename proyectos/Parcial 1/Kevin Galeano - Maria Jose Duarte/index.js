const { exec } = require("child_process");

// Mostrar mensaje de confirmación
console.log("🚀 Iniciando el servidor...");

// Ejecutar el servidor en modo silencioso
const serverProcess = exec("http-server -p 8080 -a localhost -s");

serverProcess.stdout.on("data", (data) => {
  console.log(data); // Mostrar la salida del servidor
});

serverProcess.stderr.on("data", (data) => {
  console.error(data); // Mostrar errores del servidor
});

// Abrir el navegador en localhost
exec("opn http://localhost:8080");

// Mostrar mensaje personalizado
console.log("🚀 El servidor está activo en http://localhost:8080");
