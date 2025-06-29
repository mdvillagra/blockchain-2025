# DeFi Lending Protocol

Un protocolo de préstamos descentralizados (DeFi) completo construido con Solidity y React, que permite a los usuarios depositar garantías y pedir préstamos con una relación de colateralización del 150% y una tasa de interés del 5% semanal.

## 🛠️ Instalación y Configuración (Backend)

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

Crear archivo `.env` con:

```env
PRIVATE_KEY=your_private_key_here
```

### 3. Compilar contratos

```bash
pnpm compile
```

### 4. Ejecutar pruebas

```bash
pnpm test
```

### 5. Verificar cobertura de pruebas

```bash
pnpm coverage
```

## 🚀 Despliegue

### Despliegue en Sepolia Testnet

```bash
pnpm deploy:sepolia
```

### Ejecutar aplicación web (Frontend)

```bash
cd frontend
pnpm install
pnpm run dev
```

## Direcciones

La direcciónes son:

```
LENDING -> 0xE1E44BF826C5B6d9e274d2E5c1FFbbD48aa39954
COLLATERAL -> 0xfBb2902bd3C4A73F72FCc81439646dbe45D1d0AD
LOAN -> 0x06f6038c9cD8088b2a965E54A07059a7c61fC70a
```
