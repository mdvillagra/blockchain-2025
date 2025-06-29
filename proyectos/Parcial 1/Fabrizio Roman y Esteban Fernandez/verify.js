const snarkjs = require("snarkjs");
const fs = require("fs");

async function verificar() {
  try {
    // Leemos la clave de verificación, la prueba y las señales públicas
    const vKey = JSON.parse(fs.readFileSync("verification_key.json", "utf8"));
    const proof = JSON.parse(fs.readFileSync("proof.json", "utf8"));
    const publicSignals = JSON.parse(fs.readFileSync("public.json", "utf8"));

    // Verificamos la prueba utilizando snarkjs
    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (res === true) {
      console.log("Prueba válida");

    } else {
      console.log("Prueba inválida");
    }
  } catch (error) {
    console.error("Error al verificar la prueba:", error);
  }
}

verificar().then(() => process.exit(0));
