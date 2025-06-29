import { mkdir, copyFile, readFile, writeFile } from 'fs/promises';
import path from 'path';

async function copyAbi() {
  try {
    console.log('🔄 Copiando ABIs al frontend...');
    
    // Crear directorio de destino
    const destDir = path.resolve('web_app/src/abi');
    await mkdir(destDir, { recursive: true });
    
    // Definir los contratos y sus rutas
    const contracts = [
      {
        name: 'LendingProtocol',
        sourcePath: 'artifacts/contracts/LendingProtocol.sol/LendingProtocol.json',
        destPath: path.resolve(destDir, 'LendingProtocol.json')
      },
      {
        name: 'CollateralToken',
        sourcePath: 'artifacts/contracts/CollateralToken.sol/CollateralToken.json',
        destPath: path.resolve(destDir, 'CollateralToken.json')
      },
      {
        name: 'LoanToken',
        sourcePath: 'artifacts/contracts/LoanToken.sol/LoanToken.json',
        destPath: path.resolve(destDir, 'LoanToken.json')
      }
    ];
    
    // Copiar cada contrato
    for (const contract of contracts) {
      try {
        // Leer el archivo de artifacts completo
        const artifactData = await readFile(path.resolve(contract.sourcePath), 'utf8');
        const artifact = JSON.parse(artifactData);
        
        // Extraer solo el ABI y datos relevantes
        const cleanContract = {
          contractName: contract.name,
          abi: artifact.abi,
          bytecode: artifact.bytecode,
          deployedBytecode: artifact.deployedBytecode
        };
        
        // Escribir el archivo limpio
        await writeFile(contract.destPath, JSON.stringify(cleanContract, null, 2));
        console.log(`✅ ${contract.name} ABI copiado correctamente`);
        
      } catch (error) {
        console.warn(`⚠️  No se pudo copiar ${contract.name}: ${error.message}`);
      }
    }
    
    // Crear archivo index.js para facilitar las importaciones
    const indexContent = `// ABIs de los contratos
export { default as LendingProtocolABI } from './LendingProtocol.json'
export { default as CollateralTokenABI } from './CollateralToken.json'
export { default as LoanTokenABI } from './LoanToken.json'

// Función helper para extraer solo el ABI
export const getABI = (contract) => contract.abi
`;
    
    await writeFile(path.resolve(destDir, 'index.js'), indexContent);
    console.log('✅ Archivo index.js creado para fácil importación');
    
    console.log('🎉 Todos los ABIs copiados exitosamente al frontend!');
    
  } catch (error) {
    console.error('❌ Error copiando ABIs:', error);
    process.exit(1);
  }
}

copyAbi(); 