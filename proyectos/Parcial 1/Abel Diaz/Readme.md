# ZK-Proof para Operaciones Aritméticas

Este proyecto implementa un circuito ZK-SNARK que verifica la operación `c = (a² + b²) % p` sin revelar los valores de `a` y `b`.

## 🛠 Instalación y Requisitos
Asegúrate de tener instalados:
- Node.js 
- Circom [Guía de instalación](https://docs.circom.io/getting-started/installation/).  
- Snarkjs  

**Instalar dependencias:**  
   ```bash
   npm install
   ```      
## 🚀 Uso

1. **Ejecuta el script** :
   ```bash
   chmod +x run_verifier.sh
   ./run_verifier.sh
   ```
    
2. **Para verificación en Node** :  
La verificación se ejecuta automáticamente al correr el script.  
Para ejecutarla manualmente:
    ```bash
   node verify.js
   ```
3. **Para verificación en navegador, abre** :
http://localhost:8000/browser-verifier.html

**Limpiar archivos generados** :
   ```bash
   ./clean.sh
   ```