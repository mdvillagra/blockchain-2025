import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function postCompile() {
  try {
    console.log('🔨 Post-compilación: Copiando ABIs al frontend...')
    
    // Ejecutar el script de copia de ABIs
    await execAsync('node scripts/copyAbi.js')
    
    console.log('✅ Post-compilación completada exitosamente!')
    
  } catch (error) {
    console.error('❌ Error en post-compilación:', error.message)
    // No hacer exit(1) para no interrumpir el flujo principal
  }
}

postCompile() 