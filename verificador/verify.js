const snarkjs = require("snarkjs");
const fs = require("fs");

async function main() {
    const vKey = JSON.parse(fs.readFileSync("../circuit/verification_key.json"));
    const publicSignals = JSON.parse(fs.readFileSync("../circuit/public.json"));
    const proof = JSON.parse(fs.readFileSync("../circuit/proof.json"));

    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (res) {
        console.log("Prueba válida");
    } else {
        console.log("Prueba inválida");
    }
}

main().catch((e) => {
    console.error("Error:", e);
});
