import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dotenv from 'dotenv'

if (!process.env.VERCEL) {
  // Solo cargar dotenv si estamos localmente
  import('dotenv').then(dotenv => {
    dotenv.config({ path: '../.env' });
  });
}

export default defineConfig({
  plugins: [react()],
})