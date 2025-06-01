const fs = require('fs');
const { execSync } = require('child_process');

const TEST_CASES_FILE = 'test_cases.json';

if (!fs.existsSync(TEST_CASES_FILE)) {
  console.error(`No se encontró el archivo ${TEST_CASES_FILE}. Por favor, crea un archivo test_cases.json con las pruebas.`);
  process.exit(1);
}

const testCases = JSON.parse(fs.readFileSync(TEST_CASES_FILE, 'utf-8'));

console.log(`Iniciando la ejecución para ${testCases.length} casos de prueba...\n`);

testCases.forEach((testCase, index) => {
  try {
    console.log(`Procesando prueba #${index + 1}...`);
    const inputFile = `input_${index}.json`;
    fs.writeFileSync(inputFile, JSON.stringify(testCase));

    const witnessFile = `witness_${index}.wtns`;
    execSync(`node mod_sum_square_js/generate_witness.js mod_sum_square_js/mod_sum_square.wasm ${inputFile} ${witnessFile}`);

    const proofFile = `proof_${index}.json`;
    const publicFile = `public_${index}.json`;
    execSync(`snarkjs groth16 prove mod_sum_square_final.zkey ${witnessFile} ${proofFile} ${publicFile}`);

    const verificationResult = execSync(`snarkjs groth16 verify verification_key.json ${publicFile} ${proofFile}`);
    console.log(`Resultado de prueba #${index + 1}: ${verificationResult.toString().trim()}`);

    fs.unlinkSync(inputFile);
    fs.unlinkSync(witnessFile);
  } catch (error) {
    console.error(`Error procesando prueba #${index + 1}:`, error.message);
  }
});

console.log("\nTodas las pruebas han sido procesadas.");
