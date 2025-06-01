import { mkdir, copyFile } from 'fs/promises';
import path from 'path';

async function copyAbi() {
  const destDir = path.resolve('web_app/src/abi');
  await mkdir(destDir, { recursive: true });  // crea carpetas si no existen
  await copyFile(
    path.resolve('artifacts/contracts/Marketplace.sol/Marketplace.json'),
    path.resolve(destDir, 'Marketplace.json')
  );
  console.log('ABI copiado correctamente');
}

copyAbi().catch(err => {
  console.error('Error copiando ABI:', err);
  process.exit(1);
});
