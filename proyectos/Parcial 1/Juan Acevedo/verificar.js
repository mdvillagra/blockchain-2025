const fs = require('fs');
const { execSync } = require('child_process');

// Contar cuántos archivos públicos hay (publico_0.json, publico_1.json, etc.)
const publicFiles = fs.readdirSync('publicos').filter(file => file.startsWith('publico_'));

// Verificar cada prueba
publicFiles.forEach(publicFile => {
    const index = publicFile.split('_')[1].split('.')[0]; // Extraer el número (0, 1, 2...)
    const proofFile = `pruebas/prueba_${index}.json`;

    console.log(`🔍 Verificando prueba ${index}...`);
    try {
        execSync(
            `snarkjs groth16 verify claves.json publicos/${publicFile} pruebas/prueba_${index}.json`,
            { stdio: 'inherit' }
        );
        console.log(`✅ Prueba ${index} válida.`);
    } catch (error) {
        console.error(`❌ Prueba ${index} inválida.`);
    }
});

console.log('🔹 Todas las pruebas verificadas.');
