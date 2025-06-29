import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dotenv from 'dotenv'

// Solo cargar dotenv en desarrollo local
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../.env' })
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Exponer las variables necesarias al frontend
    'process.env.VITE_COLLATERAL_TOKEN_ADDRESS': JSON.stringify(process.env.VITE_COLLATERAL_TOKEN_ADDRESS),
    'process.env.VITE_LOAN_TOKEN_ADDRESS': JSON.stringify(process.env.VITE_LOAN_TOKEN_ADDRESS),
    'process.env.VITE_LENDING_PROTOCOL_ADDRESS': JSON.stringify(process.env.VITE_LENDING_PROTOCOL_ADDRESS),
    'process.env.VITE_RPC_URL': JSON.stringify(process.env.VITE_RPC_URL)
  }
})
