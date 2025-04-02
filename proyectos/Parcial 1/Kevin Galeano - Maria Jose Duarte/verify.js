const snarkjs = require("snarkjs");

// Función para verificar la prueba
async function verifyProof() {
  try {
    // Cargar la clave de verificación, las señales públicas y la prueba
    const verificationKey = require("./verification_key.json");
    const publicSignals = require("./public.json");
    const proof = require("./prueba.json");

    // Verificar la prueba
    const isValid = await snarkjs.groth16.verify(
      verificationKey,
      publicSignals,
      proof
    );

    // Devolver el resultado
    return isValid;
  } catch (error) {
    console.error("Error al verificar la prueba:", error);
    return false;
  }
}

// Ejecutar la verificación y mostrar el resultado
verifyProof().then((isValid) => {
  if (isValid) {
    console.log("✅ La prueba es válida.");
  } else {
    console.log("❌ La prueba no es válida.");
  }
});
