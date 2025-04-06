const { execSync } = require('child_process');
const fs = require('fs');

// Función auxiliar para ejecutar comandos
function runCommand(command) {
  try {
    console.log(`\n[Ejecutando]: ${command}`);
    execSync(command, { stdio: 'inherit' });
    console.log('[OK]: Comando ejecutado correctamente.');
  } catch (error) {
    console.error(`[ERROR]: Falló el comando "${command}".`);
    console.error(error.message);
    process.exit(1);
  }
}

// Función para verificar si un archivo existe
function checkFileExists(fileName) {
  if (!fs.existsSync(fileName)) {
    console.error(`[ERROR]: No se encontró el archivo "${fileName}". Asegúrate de que los pasos previos se ejecutaron correctamente.`);
    process.exit(1);
  }
}

// Configuración y flujo de trabajo
(function setupCircuit() {
  console.log("== INICIANDO CONFIGURACIÓN DEL CIRCUITO ==");

  // 1. Compilar el circuito
  console.log("\n>> Compilando el circuito...");
  runCommand('circom mod_sum_square.circom --r1cs --wasm --sym');
  checkFileExists('mod_sum_square.r1cs');
  checkFileExists('mod_sum_square.sym');
  checkFileExists('mod_sum_square_js/mod_sum_square.wasm'); // Verificar archivo dentro de la carpeta

  // 2. Configurar Powers of Tau
  console.log("\n>> Generando Powers of Tau...");
  runCommand('snarkjs powersoftau new bn128 12 pot12_0000.ptau -v');
  runCommand('snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v');
  checkFileExists('pot12_0001.ptau');

  // 3. Preparar Phase 2
  console.log("\n>> Preparando Phase 2...");
  runCommand('snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v');
  checkFileExists('pot12_final.ptau');

  // 4. Configurar la clave final de Groth16
  console.log("\n>> Configurando clave de Groth16...");
  runCommand('snarkjs groth16 setup mod_sum_square.r1cs pot12_final.ptau mod_sum_square_0000.zkey');
  runCommand('snarkjs zkey contribute mod_sum_square_0000.zkey mod_sum_square_final.zkey --name="Contributor" -v');
  checkFileExists('mod_sum_square_final.zkey');

  // 5. Exportar clave de verificación
  console.log("\n>> Exportando clave de verificación...");
  runCommand('snarkjs zkey export verificationkey mod_sum_square_final.zkey verification_key.json');
  checkFileExists('verification_key.json');
  runCommand('snarkjs zkey export solidityverifier mod_sum_square_final.zkey verifier.sol');
  checkFileExists('verifier.sol');

  console.log("\n== CONFIGURACIÓN COMPLETA: Todo está listo para generar y verificar pruebas. ==");
})();
