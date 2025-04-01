const express = require("express");
const { verifyProof } = require("./verifier.js");

const app = express();
const port = 8080;

// Middleware para parsear JSON
app.use(express.json());

// Ruta para verificar la prueba
app.post("/verify", async (req, res) => {
    try {
        const { proof, publicSignals } = req.body;

        // Verificar la prueba
        const isValid = await verifyProof(proof, publicSignals);

        // Devolver el resultado
        res.json({ isValid });
    } catch (error) {
        console.error("Error al verificar la prueba:", error);
        res.status(500).json({ error: "Error al verificar la prueba" });
    }
});

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static("public"));

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
