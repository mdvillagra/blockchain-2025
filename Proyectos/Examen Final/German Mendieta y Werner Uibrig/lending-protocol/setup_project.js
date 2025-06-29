const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para copiar ABIs del protocolo de préstamos
function copyABIs() {
    try {
        const contractsPath = path.join(__dirname, 'artifacts', 'contracts');
        const webAppPath = path.join(__dirname, 'web_app', 'src');
        
        // Crear directorio si no existe
        if (!fs.existsSync(webAppPath)) {
            fs.mkdirSync(webAppPath, { recursive: true });
        }
        
        const contracts = [
            { file: 'LendingProtocol.sol', name: 'LendingProtocol' },
            { file: 'CollateralToken.sol', name: 'CollateralToken' },
            { file: 'LoanToken.sol', name: 'LoanToken' },
            { file: 'MockERC20.sol', name: 'MockERC20' }
        ];
        
        let copiedCount = 0;
        contracts.forEach(contract => {
            const src = path.join(contractsPath, contract.file, `${contract.name}.json`);
            const dest = path.join(webAppPath, `${contract.name}ABI.json`);
            
            if (fs.existsSync(src)) {
                const artifact = JSON.parse(fs.readFileSync(src, 'utf8'));
                const abiOnly = { abi: artifact.abi };
                fs.writeFileSync(dest, JSON.stringify(abiOnly.abi, null, 2));
                console.log(`[OK]: ABI de ${contract.name} copiado a web_app/src/`);
                copiedCount++;
            } else {
                console.warn(`[WARN]: No se encontró el ABI de ${contract.name} en ${src}`);
            }
        });
        
        if (copiedCount === 0) {
            throw new Error('No se pudieron copiar los ABIs. Verifica que los contratos estén compilados.');
        }
    } catch (error) {
        console.error('[ERROR]: Error copiando ABIs:', error.message);
        throw error;
    }
}

// Actualizar variables de entorno con las direcciones de los contratos
function updateEnvWithContracts(addresses) {
    try {
        // Update main .env file
        const envPath = path.join(__dirname, '.env');
        updateSingleEnvFile(envPath, addresses);
        
        // Update web_app .env file
        const webAppEnvPath = path.join(__dirname, 'web_app', '.env');
        updateSingleEnvFile(webAppEnvPath, addresses);
        
        console.log('[OK]: Variables de entorno actualizadas en ambos archivos .env');
    } catch (error) {
        console.error('[ERROR]: Error actualizando variables de entorno:', error.message);
        throw error;
    }
}

function updateSingleEnvFile(envPath, addresses) {
    let content = '';
    
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }
    
    // Actualizar o agregar direcciones de contratos
    Object.entries(addresses).forEach(([key, address]) => {
        const regex = new RegExp(`^\\s*${key}\\s*=.*`, 'm');
        if (regex.test(content)) {
            content = content.replace(regex, `${key}=${address}`);
        } else {
            content += `${key}=${address}\n`;
        }
    });
    
    // Agregar configuración de red local si no existe
    const defaultConfig = {
        'VITE_RPC_URL': 'http://127.0.0.1:8545',
        'VITE_CHAIN_ID': '31337'
    };
    
    Object.entries(defaultConfig).forEach(([key, value]) => {
        const regex = new RegExp(`^\\s*${key}\\s*=.*`, 'm');
        if (!regex.test(content)) {
            content += `${key}=${value}\n`;
        }
    });
    
    fs.writeFileSync(envPath, content, 'utf8');
}

// Función para verificar si el puerto está en uso
function isPortInUse(port) {
    return new Promise((resolve) => {
        const net = require('net');
        const server = net.createServer();
        
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(true);
            } else {
                resolve(false);
            }
        });
        
        server.once('listening', () => {
            server.close();
            resolve(false);
        });
        
        server.listen(port);
    });
}

// Función para verificar prerrequisitos
function checkPrerequisites() {
    console.log('==> Verificando prerrequisitos...');
    
    // Verificar archivos esenciales
    const requiredFiles = [
        'package.json',
        'hardhat.config.js',
        'scripts/deploy.js',
        'contracts/LendingProtocol.sol'
    ];
    
    for (const file of requiredFiles) {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Archivo requerido no encontrado: ${file}`);
        }
    }
    
    console.log('[OK]: Archivos esenciales encontrados');
}

// Función para verificar si un contrato está desplegado
async function verifyContractDeployment(address, rpcUrl = 'http://127.0.0.1:8545') {
    try {
        const { ethers } = require('ethers');
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const code = await provider.getCode(address);
        return code !== '0x';
    } catch (error) {
        console.error(`Error verificando contrato en ${address}:`, error.message);
        return false;
    }
}

// Función para ejecutar comando y capturar output
function executeCommand(cmd, args, options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`[CMD]: ${cmd} ${args.join(' ')}`);
        
        const proc = spawn(cmd, args, { 
            shell: true, 
            stdio: ['inherit', 'pipe', 'pipe'],
            ...options 
        });
        
        let stdout = '';
        let stderr = '';
        
        proc.stdout.on('data', (data) => {
            const text = data.toString();
            stdout += text;
            if (!options.silent) process.stdout.write(text);
        });
        
        proc.stderr.on('data', (data) => {
            const text = data.toString();
            stderr += text;
            if (!options.silent) process.stderr.write(text);
        });
        
        proc.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr, code });
            } else {
                reject({ stdout, stderr, code, message: `Command failed with code ${code}` });
            }
        });
        
        proc.on('error', (error) => {
            reject({ stdout, stderr, code: -1, message: error.message });
        });
    });
}

// Función para esperar a que el nodo esté disponible
async function waitForNode(maxRetries = 10, delay = 2000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const { ethers } = require('ethers');
            const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
            await provider.getNetwork();
            console.log('[OK]: Nodo local disponible');
            return true;
        } catch (error) {
            console.log(`[INFO]: Esperando nodo... intento ${i + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Timeout esperando que el nodo esté disponible');
}

// Función para verificar la limpieza
async function verifyCleanState() {
    console.log('\n==> Verificando estado limpio...');
    
    const checks = [
        {
            name: 'Puerto 8545 libre',
            check: async () => !(await isPortInUse(8545))
        },
        {
            name: 'Sin artifacts',
            check: () => !fs.existsSync(path.join(__dirname, 'artifacts'))
        },
        {
            name: 'Sin cache',
            check: () => !fs.existsSync(path.join(__dirname, 'cache'))
        },
        {
            name: 'ABIs limpiados',
            check: () => {
                const abiPath = path.join(__dirname, 'web_app', 'src', 'LendingProtocolABI.json');
                return !fs.existsSync(abiPath);
            }
        }
    ];
    
    let allClean = true;
    
    for (const { name, check } of checks) {
        try {
            const result = await check();
            if (result) {
                console.log(`[OK]: ${name}`);
            } else {
                console.warn(`[WARN]: ${name} - no completamente limpio`);
                allClean = false;
            }
        } catch (error) {
            console.warn(`[WARN]: Error verificando ${name}:`, error.message);
            allClean = false;
        }
    }
    
    return allClean;
}

// Función de limpieza rápida (solo para desarrollo)
async function quickClean() {
    console.log('\n🧹 Limpieza rápida...');
    
    try {
        await executeCommand('npx', ['hardhat', 'clean']);
        await killExistingNodes();
        console.log('[OK]: Limpieza rápida completada');
        return true;
    } catch (error) {
        console.error('[ERROR]: Error en limpieza rápida:', error.message);
        return false;
    }
}



// Función para iniciar el frontend
function startFrontend() {
    return new Promise((resolve, reject) => {
        console.log('\n==> Iniciando frontend...');
        
        const webAppPath = path.join(__dirname, 'web_app');
        
        if (!fs.existsSync(webAppPath)) {
            reject(new Error('Directorio web_app no encontrado'));
            return;
        }
        
        console.log('🌐 Iniciando servidor de desarrollo...');
        const frontendProc = spawn('npm', ['run', 'dev'], {
            cwd: webAppPath,
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true,
            detached: true
        });
        
        let started = false;
        let output = '';
        
        frontendProc.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            process.stdout.write(`[Frontend]: ${text}`);
            
            // Detectar cuando el servidor está listo
            if ((text.includes('Local:') || text.includes('localhost') || text.includes('ready')) && !started) {
                started = true;
                console.log('\n[OK]: Frontend iniciado exitosamente');
                resolve(frontendProc);
            }
        });
        
        frontendProc.stderr.on('data', (data) => {
            const text = data.toString();
            output += text;
            process.stderr.write(`[Frontend Error]: ${text}`);
        });
        
        frontendProc.on('error', (error) => {
            reject(new Error(`Error iniciando frontend: ${error.message}`));
        });
        
        // Timeout si no inicia en 30 segundos
        setTimeout(() => {
            if (!started) {
                console.log('\n[INFO]: Frontend tardando en iniciar, pero continuando...');
                resolve(frontendProc);
            }
        }, 30000);
        
        // Evitar que el proceso padre termine
        frontendProc.unref();
    });
}

// Pasos del script mejorados
async function runSetup() {
    let frontendProcess = null;
    
    try {
        console.log('🚀 Iniciando configuración del protocolo de préstamos...\n');
        
        // 0. Verificar prerrequisitos
        checkPrerequisites();
        
        // 1. Instalar dependencias si es necesario
        console.log('\n==> Verificando dependencias...');
        if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
            console.log('Instalando dependencias del protocolo...');
            await executeCommand('npm', ['install']);
        } else {
            console.log('[OK]: Dependencias ya instaladas');
        }
        
        // 3. Copiar ABIs
        console.log('\n==> Copiando ABIs...');
        copyABIs();
        
        // 4. Verificar red local
        console.log('\n==> Verificando red local...');
        const portInUse = await isPortInUse(8545);
        
        if (!portInUse) {
            console.log('Iniciando red local de Hardhat...');
            const nodeProc = spawn('npx', ['hardhat', 'node'], {
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: true,
                shell: true
            });
            
            nodeProc.stdout.on('data', (data) => {
                process.stdout.write(`[Hardhat Node]: ${data}`);
            });
            
            nodeProc.stderr.on('data', (data) => {
                process.stderr.write(`[Hardhat Node Error]: ${data}`);
            });
            
            nodeProc.unref();
            
            // Esperar a que el nodo esté listo
            console.log('Esperando a que el nodo esté listo...');
            await waitForNode();
        } else {
            console.log('[INFO]: Red local ya está corriendo en puerto 8545');
        }
        
        // 5. Desplegar contratos con reintentos
        console.log('\n==> Desplegando contratos...');
        let deploySuccess = false;
        let addresses = {};
        
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`[INFO]: Intento de despliegue ${attempt}/3`);
                
                const deployResult = await executeCommand('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost']);
                const output = deployResult.stdout + deployResult.stderr;
                
                console.log('\n[INFO]: Output del deploy:');
                console.log(output);
                
                // Extraer direcciones con función mejorada
                addresses = extractContractAddresses(output);
                
                // Verificar que se encontraron las direcciones principales
                const requiredAddresses = ['VITE_LENDING_PROTOCOL_ADDRESS'];
                const foundRequired = requiredAddresses.every(key => addresses[key]);
                
                if (foundRequired && Object.keys(addresses).length > 0) {
                    // Verificar que los contratos estén realmente desplegados
                    console.log('\n==> Verificando despliegue de contratos...');
                    let allVerified = true;
                    
                    for (const [key, address] of Object.entries(addresses)) {
                        const isDeployed = await verifyContractDeployment(address);
                        if (isDeployed) {
                            console.log(`[OK]: ${key.replace('VITE_', '')} verificado en ${address}`);
                        } else {
                            console.error(`[ERROR]: ${key.replace('VITE_', '')} NO encontrado en ${address}`);
                            allVerified = false;
                        }
                    }
                    
                    if (allVerified) {
                        deploySuccess = true;
                        break;
                    }
                }
                
                console.warn(`[WARN]: Intento ${attempt} falló la verificación`);
                
            } catch (deployError) {
                console.error(`[ERROR]: Intento ${attempt} falló:`, deployError.stderr || deployError.message);
                
                if (attempt < 3) {
                    console.log('Reintentando despliegue...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }
        
        if (!deploySuccess) {
            throw new Error('No se pudieron desplegar los contratos después de 3 intentos');
        }
        
        // 6. Actualizar variables de entorno
        console.log('\n==> Actualizando variables de entorno...');
        updateEnvWithContracts(addresses);
        
        // 7. Copiar ABIs nuevamente después del deploy
        console.log('\n==> Copiando ABIs actualizados...');
        copyABIs();
        
        // 8. Instalar dependencias del frontend
        console.log('\n==> Verificando dependencias del frontend...');
        const webAppPath = path.join(__dirname, 'web_app');
        if (fs.existsSync(webAppPath)) {
            if (!fs.existsSync(path.join(webAppPath, 'node_modules'))) {
                console.log('Instalando dependencias del frontend...');
                await executeCommand('npm', ['install'], { cwd: webAppPath });
            } else {
                console.log('[OK]: Dependencias del frontend ya instaladas');
            }
            
            // 9. Iniciar el frontend
            try {
                frontendProcess = await startFrontend();
                console.log('\n🎉 ¡Frontend iniciado exitosamente!');
            } catch (frontendError) {
                console.warn('[WARN]: Error iniciando frontend automáticamente:', frontendError.message);
                console.log('Puedes iniciarlo manualmente con: cd web_app && npm run dev');
            }
        } else {
            console.warn('[WARN]: Directorio web_app no encontrado');
        }
        console.log('\n⏳ Finalizando configuración...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('\n🎉 ¡Configuración completada exitosamente!');
        console.log('\n📋 Resumen de direcciones:');
        Object.entries(addresses).forEach(([key, address]) => {
            console.log(`   ${key}: ${address}`);
        });
        console.log('\n🌐 Frontend: http://localhost:3000 (o el puerto mostrado arriba)');
        console.log('⛓️  Red local: http://127.0.0.1:8545');
        console.log('📋 Revisa los archivos .env para las direcciones completas');
        
        // Mantener el script vivo si el frontend está corriendo
        if (frontendProcess) {
            console.log('\n⏳ Presiona Ctrl+C para detener el frontend y salir');
            
            // Mantener el proceso vivo
            process.stdin.resume();
        }
        
    } catch (error) {
        console.error('\n❌ Error durante la configuración:', error.message || error);
        console.error('\nVerifica que:');
        console.error('1. Node.js y npm están instalados');
        console.error('2. Tienes un archivo scripts/deploy.js válido');
        console.error('3. Los contratos se compilan correctamente');
        console.error('4. La configuración de Hardhat es correcta');
        console.error('5. No hay otros procesos usando el puerto 8545');
        
        if (error.stdout) console.error('\nSTDOUT:', error.stdout);
        if (error.stderr) console.error('\nSTDERR:', error.stderr);
        
        // Limpiar frontend si estaba corriendo
        if (frontendProcess) {
            try {
                process.kill(frontendProcess.pid);
            } catch (e) {
                // Ignorar errores al matar el proceso
            }
        }
        
        process.exit(1);
    }
}

// Función mejorada para extraer direcciones del deploy
function extractContractAddresses(deployOutput) {
    const addresses = {};
    
    // Patrones más robustos para capturar direcciones
    const patterns = [
        { key: 'VITE_LENDING_PROTOCOL_ADDRESS', patterns: [
            /LendingProtocol.*?(?:deployed to|address|contract).*?(0x[a-fA-F0-9]{40})/i,
            /(?:deployed|address).*?LendingProtocol.*?(0x[a-fA-F0-9]{40})/i,
            /LendingProtocol:\s*(0x[a-fA-F0-9]{40})/i
        ]},
        { key: 'VITE_COLLATERAL_TOKEN_ADDRESS', patterns: [
            /CollateralToken.*?(?:deployed to|address|contract).*?(0x[a-fA-F0-9]{40})/i,
            /(?:deployed|address).*?CollateralToken.*?(0x[a-fA-F0-9]{40})/i,
            /CollateralToken:\s*(0x[a-fA-F0-9]{40})/i
        ]},
        { key: 'VITE_LOAN_TOKEN_ADDRESS', patterns: [
            /LoanToken.*?(?:deployed to|address|contract).*?(0x[a-fA-F0-9]{40})/i,
            /(?:deployed|address).*?LoanToken.*?(0x[a-fA-F0-9]{40})/i,
            /LoanToken:\s*(0x[a-fA-F0-9]{40})/i
        ]}
    ];
    
    patterns.forEach(({ key, patterns: patternList }) => {
        for (const pattern of patternList) {
            const match = deployOutput.match(pattern);
            if (match && match[1]) {
                addresses[key] = match[1];
                console.log(`[FOUND]: ${key} = ${match[1]}`);
                break; // Found address, move to next contract
            }
        }
        
        if (!addresses[key]) {
            console.warn(`[WARN]: No se pudo extraer ${key} del output`);
        }
    });
    
    return addresses;
}

// Función para limpiar red local y redesplegar
async function cleanAndRedeploy() {
    console.log('\n==> Limpiando y preparando para redespliegue...');
    
    // Usar limpieza completa
    const cleanSuccess = await cleanProject();
    
    if (!cleanSuccess) {
        console.warn('[WARN]: Limpieza completa falló, intentando limpieza rápida...');
        await quickClean();
    }
    
    // Verificar estado limpio
    const isClean = await verifyCleanState();
    if (!isClean) {
        console.warn('[WARN]: Sistema no completamente limpio, pero continuando...');
    }
    
    // Recompilar
    try {
        console.log('==> Recompilando contratos...');
        await executeCommand('npx', ['hardhat', 'compile']);
        console.log('[OK]: Contratos recompilados');
        return true;
    } catch (error) {
        console.error('[ERROR]: Error recompilando:', error.message);
        return false;
    }
}


// Manejo de cierre del script
process.on('SIGINT', () => {
    console.log('\n⏹️  Cerrando el script de configuración...');
    process.exit(0);
});

// Ejecutar setup
runSetup();

module.exports = { updateEnvWithContracts, copyABIs, verifyContractDeployment };