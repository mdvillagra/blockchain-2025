const snarkjs = require("snarkjs");
const fs = require("fs");

async function verificar() {
    const vKey = JSON.parse(fs.readFileSync("verification_key.json"));
    const proof = JSON.parse(fs.readFileSync("proof.json"));
    const publicSignals = JSON.parse(fs.readFileSync("public.json"));

    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    console.log("Verificación:", res ? "Válida" : "Inválida");
}

verificar();
