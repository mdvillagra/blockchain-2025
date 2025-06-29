const snarkjs = require("snarkjs");

// Cargar la clave de verificación
const vKey = require("./artifacts/circuit_js/verification_key.json");

// Función para verificar la prueba
async function verifyProof(proof, publicSignals) {
    return await snarkjs.groth16.verify(vKey, publicSignals, proof);
}

module.exports = { verifyProof };
