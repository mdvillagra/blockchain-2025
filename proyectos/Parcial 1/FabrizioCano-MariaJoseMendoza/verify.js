const snarkjs = require("snarkjs");
const { readFileSync } = require("fs");
const path = require("path");

async function verifyProof(inputName) {
    try {
        console.log(`\nVerificando prueba para ${inputName}...`);
        
        // Cargar archivos (rutas relativas al directorio actual)
        const verificationKey = JSON.parse(readFileSync("./circuito_js/verification_key.json", "utf-8"));
        const proof = JSON.parse(readFileSync(`./proof_${inputName}.json`, "utf-8"));
        const publicSignals = JSON.parse(readFileSync(`./public_${inputName}.json`, "utf-8"));

        console.log("Archivos cargados correctamente.");

        // Verificar prueba
        const isValid = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
        
        if (isValid) {
            console.log("¡Prueba válida!");
        } else {
            console.log("¡Prueba inválida!");
        }
        
        return isValid;
    } catch (error) {
        console.error(`Error verificando ${inputName}:`, error.message);
        return false;
    }
}

// Verificar todos los inputs (ej: ["input1", "input2"])
async function verifyAllProofs(inputs) {
    const results = {};
    for (const input of inputs) {
        results[input] = await verifyProof(input);
    }
    console.log("\nResumen de verificaciones:");
    console.table(results);
}

// Ejecutar
const inputsToVerify = ["input1", "input2"];  // Nombres sin extensión .json
verifyAllProofs(inputsToVerify);