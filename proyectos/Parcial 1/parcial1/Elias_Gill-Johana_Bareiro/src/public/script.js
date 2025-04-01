document.getElementById("verifyButton").addEventListener("click", async () => {
    try {
        // Cargar la prueba y las señales públicas
        const proofResponse = await fetch("proof.json");
        const proof = await proofResponse.json();

        const publicSignalsResponse = await fetch("public.json");
        const publicSignals = await publicSignalsResponse.json();

        // Enviar la solicitud al servidor
        const response = await fetch("http://localhost:8080/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ proof, publicSignals }),
        });

        const result = await response.json();

        // Mostrar el resultado
        const resultElement = document.getElementById("result");
        if (result.isValid) {
            resultElement.textContent = "La prueba es válida.";
        } else {
            resultElement.textContent = "La prueba no es válida.";
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("result").textContent = "Error al verificar la prueba.";
    }
});
