const snarkjs = require("snarkjs");
const fs = require("fs");

// Leer el archivo de la clave de verificación
const verificationKey = JSON.parse(fs.readFileSync("verification_key.json"));

// Leer los archivos de la prueba y los valores públicos
const proof = JSON.parse(fs.readFileSync("proof.json"));
const publicSignals = JSON.parse(fs.readFileSync("public.json"));

// Verificar la prueba
async function verifyProof() {
    const res = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
    if (res) {
        console.log("La prueba es válida.");
        console.log("Valor de c (salida pública):", publicSignals[0]);

    } else {
        console.log("La prueba no es válida.");
    }
}

verifyProof();

