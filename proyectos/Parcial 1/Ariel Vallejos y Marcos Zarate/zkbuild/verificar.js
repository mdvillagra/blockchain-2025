const snarkjs = require("snarkjs");
const fs = require("fs");

async function main() {
    console.log(" Verificando prueba...");

    const vKey = JSON.parse(fs.readFileSync("verification_key.json"));
    const publicSignals = JSON.parse(fs.readFileSync("public.json"));
    const proof = JSON.parse(fs.readFileSync("proof.json"));

    // Mostrar valores públicos
    const p = publicSignals[1];
    const c = publicSignals[0];

    console.log(` Input público p = ${p}`);
    console.log(` Output público c = ${c}`);

    // Medir tiempo de verificación
    const startTime = Date.now();
    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    if (res) {
        console.log(" ¡Prueba válida! :)");
    } else {
        console.log(" ¡Prueba inválida! :(");
    }

    console.log(` Tiempo de verificación: ${elapsedTime}ms`);

    process.exit();
}

main();
