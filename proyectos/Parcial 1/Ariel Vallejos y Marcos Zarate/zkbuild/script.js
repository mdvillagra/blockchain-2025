async function verificar() {
    const resultadoEl = document.getElementById("resultado");
    resultadoEl.innerText = "🔍 Verificando prueba...";

    try {
        // ⏱️ Empezamos a medir el tiempo
        const inicio = performance.now();

        // Cargamos los archivos JSON
        const vKeyResp = await fetch("./verification_key.json");
        const vKey = await vKeyResp.json();

        const proofResp = await fetch("./proof.json");
        const proof = await proofResp.json();

        const publicResp = await fetch("./public.json");
        const publicSignals = await publicResp.json();

        // Mostrar valores públicos
        const c = publicSignals[0];
        const p = publicSignals[1];

        console.log(`📌 Input público p = ${p}`);
        console.log(`📌 Output público c = ${c}`);

        // Ejecutamos la verificación con snarkjs
        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

        const fin = performance.now();
        const tiempo = (fin - inicio).toFixed(2);

        if (res) {
            resultadoEl.innerText =
                `📌 Input público p = ${p}\n` +
                `📌 Output público c = ${c}\n` +
                `✅ ¡Prueba válida!\n` +
                `⏱️ Tiempo de verificación: ${tiempo}ms`;
        } else {
            resultadoEl.innerText = "❌ Prueba inválida.";
        }

    } catch (err) {
        resultadoEl.innerText = "❌ Error: " + err.message;
        console.error(err);
    }
}
