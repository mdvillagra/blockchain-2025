const snarkjs = require("snarkjs");

async function verify() {
    try {
        const verificationKey = require("./outputs/verification_key.json");
        const public = require("./outputs/public.json");
        const proof = require("./outputs/proof.json");

        const isValid = await snarkjs.groth16.verify(verificationKey, public, proof);
        console.log(isValid ? "✅ Prueba VÁLIDA" : "❌ Prueba INVÁLIDA");
        process.exit(0); // Terminar el proceso con éxito
    } catch (error) {
        console.error("❌ Error en verificación:", error);
        process.exit(1); // Terminar el proceso con error
    }
}

verify();