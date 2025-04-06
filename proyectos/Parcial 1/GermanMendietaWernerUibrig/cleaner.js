const fs = require('fs');
const path = require('path');

// Función para eliminar un archivo si existe
function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`[OK]: Archivo eliminado -> ${filePath}`);
  } else {
    console.log(`[INFO]: El archivo no existe -> ${filePath}`);
  }
}

// Función para eliminar todos los archivos generados
(function cleanGeneratedFiles() {
  console.log("== LIMPIANDO ARCHIVOS GENERADOS ==");

  // Archivos generados por Circom
  deleteFile('mod_sum_square.r1cs');
  deleteFile('mod_sum_square.sym');

  // Archivo wasm generado en la carpeta
  const wasmPath = path.join('mod_sum_square_js', 'mod_sum_square.wasm');
  deleteFile(wasmPath);

  // Archivos generados por snarkjs
  deleteFile('pot12_0000.ptau');
  deleteFile('pot12_0001.ptau');
  deleteFile('pot12_final.ptau');
  deleteFile('mod_sum_square_0000.zkey');
  deleteFile('mod_sum_square_final.zkey');
  deleteFile('verification_key.json');
  deleteFile('verifier.sol');

  // Archivos temporales de pruebas
  for (let i = 0; i < 10; i++) {
    deleteFile(`input_${i}.json`);
    deleteFile(`witness_${i}.wtns`);
    deleteFile(`proof_${i}.json`);
    deleteFile(`public_${i}.json`);
  }

  console.log("\n== LIMPIEZA COMPLETA: Todos los archivos generados han sido eliminados. ==");
})();
