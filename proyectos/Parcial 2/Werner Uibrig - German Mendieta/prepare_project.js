const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Paso extra: Copiar el ABI actualizado si es necesario
function copyABI() {
    const src = path.join(__dirname, 'artifacts', 'contracts', 'Marketplace.sol', 'Marketplace.json');
    const dest = path.join(__dirname, 'web_app', 'src', 'MarketplaceABI.json');
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('[OK]: ABI actualizado en web_app/src/MarketplaceABI.json');
    } else {
        console.warn('[WARN]: No se encontró el ABI para copiar.');
    }
}

// Busca y reemplaza VITE_CONTRACT_ADDRESS en todos los .env del proyecto
function updateEnvWithContract(newAddress) {

    const root = __dirname;
    function findEnvFiles(dir) {
        let results = [];
        fs.readdirSync(dir).forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                results = results.concat(findEnvFiles(filePath));
            } else if (file === '.env') {
                results.push(filePath);
            }
        });
        return results;
    }

    const envFiles = findEnvFiles(root);
    console.log(`Cantidad de envs>`, envFiles);
    envFiles.forEach(envPath => {
        let content = fs.readFileSync(envPath, 'utf8');
        if (/^\s*VITE_CONTRACT_ADDRESS\s*=.*/m.test(content)) {
            content = content.replace(/^\s*VITE_CONTRACT_ADDRESS\s*=.*/m, `VITE_CONTRACT_ADDRESS=${newAddress}`);
        } else {
            content = `VITE_CONTRACT_ADDRESS=${newAddress}\n` + content;
        }
        fs.writeFileSync(envPath, content, 'utf8');
        console.log(`[OK]: Actualizado VITE_CONTRACT_ADDRESS en ${envPath}`);
    });
}

// Pasos del script en orden correcto
const steps = [
    // 1. Compilar contratos
    { cmd: 'npx', args: ['hardhat', 'compile'], wait: 1000 },
    // 2. Copiar ABI
    { custom: copyABI, wait: 1000 },
    // 3. Lanzar hardhat node en background (detached)
    {
        custom: () => {
            console.log('\n==> Ejecutando: npx hardhat node (en background)');
            const nodeProc = spawn('npx', ['hardhat', 'node'], {
                stdio: 'ignore',
                detached: true,
                shell: true
            });
            nodeProc.unref();
        }, wait: 3000
    },
    // 4. Deploy del contrato y actualizar .env con la nueva dirección
    {
        cmd: 'npx',
        args: ['hardhat', 'run', 'scripts/deploy.js', '--network', 'ephemery'],
        wait: 2000,
        captureOutput: true,  
        after: (output) => {
            console.log('[INFO]: Output capturado del deploy:\n', output);
            const match = output.match(/Marketplace deployed to:\s*(0x[a-fA-F0-9]{40})/);
            if (match) {
                const address = match[1];
                updateEnvWithContract(address);
            } else {
                console.warn('[WARN]: No se pudo encontrar la dirección del contrato en el output.');
            }
        }
    },
    // 5. Copiar ABI nuevamente por si cambió tras el deploy
    { custom: copyABI, wait: 1000 },
    // 6. Mintear NFTs iniciales
    { cmd: 'npx', args: ['hardhat', 'run', './scripts/mintInitialBatch.js', '--network', 'ephemery'], wait: 2000 },
    // 7. Levantar el frontend
    {
        cmd: 'npm',
        args: ['run', 'dev'],
        wait: 0,
        cwd: path.join(__dirname, '/web_app')
    }
];

function runStep(index) {
    if (index >= steps.length) return;
    const step = steps[index];

    if (step.custom) {
        step.custom();
        setTimeout(() => runStep(index + 1), step.wait);
        return;
    }

    const { cmd, args, wait, cwd, after, captureOutput } = step;
    console.log(`\n==> Ejecutando: ${cmd} ${args.join(' ')}`);

    if (captureOutput) {
        const proc = spawn(cmd, args, { shell: true, cwd });
        let output = '';

        proc.stdout.on('data', (data) => {
            output += data.toString();
            process.stdout.write(data); // sigue mostrando en consola
        });

        proc.stderr.on('data', (data) => {
            output += data.toString();
            process.stderr.write(data);
        });

        proc.on('close', (code) => {
            if (code !== 0) {
                console.error(`El comando "${cmd} ${args.join(' ')}" falló con código ${code}`);
                process.exit(code);
            }
            if (after) {
                after(output);
            }
            setTimeout(() => runStep(index + 1), wait);
        });
    } else {
        const proc = spawn(cmd, args, { stdio: 'inherit', shell: true, cwd });

        proc.on('close', (code) => {
            if (code !== 0) {
                console.error(`El comando "${cmd} ${args.join(' ')}" falló con código ${code}`);
                process.exit(code);
            }
            runStep(index + 1);
        });

        // último paso no necesita avanzar
    }

    if (index === 2) {
        process.on('SIGINT', () => {
            console.log('\n¿Deseas cerrar el proceso hardhat node en segundo plano? (s/n)');
            process.stdin.setEncoding('utf8');
            process.stdin.once('data', (input) => {
                if (input.trim().toLowerCase() === 's') {
                    // Buscar y matar procesos hardhat node
                    const ps = spawn('ps', ['-ef'], { shell: true });
                    let psOutput = '';
                    ps.stdout.on('data', data => psOutput += data.toString());
                    ps.on('close', () => {
                        psOutput.split('\n').forEach(line => {
                            if (line.includes('hardhat') && line.includes('node')) {
                                const cols = line.trim().split(/\s+/);
                                const pid = cols[1];
                                if (pid && !isNaN(pid)) {
                                    try {
                                        process.kill(pid, 'SIGTERM');
                                        console.log(`[OK]: Proceso hardhat node (${pid}) terminado.`);
                                    } catch (e) {
                                        console.warn(`[WARN]: No se pudo terminar el proceso ${pid}: ${e.message}`);
                                    }
                                }
                            }
                        });
                        process.exit();
                    });
                } else {
                    process.exit();
                }
            });
        });
    }
}


runStep(0);

module.exports = { updateEnvWithContract };