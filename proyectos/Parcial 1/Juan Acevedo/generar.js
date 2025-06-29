const fs = require('fs');
const { execSync } = require('child_process');

// Crear directorios si no existen
const directorios = ['pruebas', 'publicos'];
directorios.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        console.log(`Directorio ${dir} creado.`);
    }
});

// Leer entradas.json
const entradas = JSON.parse(fs.readFileSync('entradas.json', 'utf-8'));

// Procesar cada entrada
entradas.forEach((entrada, index) => {
    // Guardar entrada temporal
    fs.writeFileSync('temp_input.json', JSON.stringify(entrada));

    // Ejecutar snarkjs
    execSync(
        `snarkjs groth16 fullprove temp_input.json corto_js/corto.wasm claves.zkey pruebas/prueba_${index}.json publicos/publico_${index}.json`,
        { stdio: 'inherit' }
    );

    console.log(`Prueba ${index} generada.`);
});

// Limpiar archivo temporal
fs.unlinkSync('temp_input.json');
console.log('✅ Todas las pruebas generadas.');
console.log(`Los archivos de prueba se guardaron en: /pruebas/`);
console.log(`Los archivos públicos se guardaron en: /publicos/`);
