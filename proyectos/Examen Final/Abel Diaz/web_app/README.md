# DeFi Lend - Frontend

Frontend profesional para el protocolo de préstamos descentralizados DeFi Lend, construido con React + Vite + Tailwind CSS + ethers.js.

## 🎨 Características del Diseño

- **Diseño Profesional**: Inspirado en plataformas DeFi reales como Aave, Compound y Venus
- **Modo Oscuro**: Tema oscuro por defecto con glassmorphism y efectos visuales modernos
- **Responsive**: Totalmente responsive para desktop, tablet y móvil
- **UX Intuitiva**: Interfaz clara con feedback visual y notificaciones en tiempo real
- **Componentes Modulares**: Arquitectura de componentes reutilizables

## 🚀 Tecnologías Utilizadas

- **React 19** - Framework de UI
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos utility-first
- **ethers.js 5.7** - Interacción con blockchain
- **Lucide React** - Iconos modernos
- **MetaMask** - Integración de wallet

## 📦 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Variables de entorno:**

Las variables se configuran en el archivo `.env` de la raíz del proyecto (no en web_app).
Vite está configurado para leer desde `../env`.

```env
# En el archivo .env de la raíz del proyecto
VITE_LENDING_PROTOCOL_ADDRESS=0x...
VITE_COLLATERAL_TOKEN_ADDRESS=0x...
VITE_LOAN_TOKEN_ADDRESS=0x...
VITE_RPC_URL=https://rpc.ephemery.dev
```

3. **Ejecutar en desarrollo:**
```bash
npm run dev
```

4. **Build para producción:**
```bash
npm run build
```

## 🏗️ Arquitectura de Componentes

```
src/
├── components/
│   ├── WalletConnection.jsx    # Conexión y gestión de wallet
│   ├── UserDashboard.jsx       # Dashboard con métricas del usuario
│   └── ActionPanel.jsx         # Panel de acciones (depositar, préstamo, etc.)
├── App.jsx                     # Componente principal
├── main.jsx                    # Punto de entrada
└── index.css                   # Estilos globales con Tailwind
```

## 🎯 Funcionalidades

### 💰 Dashboard de Usuario
- **Métricas en tiempo real**: Colateral, deuda, interés acumulado
- **Factor de salud**: Visualización del ratio de colateralización
- **Alertas inteligentes**: Notificaciones cuando el ratio está en riesgo
- **Cálculos automáticos**: Disponible para préstamo y retiro

### 🔄 Panel de Acciones
- **Depositar Colateral**: Interface intuitiva para depositar cUSD
- **Pedir Préstamo**: Solicitud de préstamos con validaciones en tiempo real
- **Pagar Préstamo**: Pago completo de deuda + interés
- **Retirar Colateral**: Retiro seguro cuando no hay deuda

### 🔗 Integración con Blockchain
- **Conexión automática**: Detecta MetaMask y conecta automáticamente si está autorizado
- **Gestión de transacciones**: Approval automático de tokens cuando es necesario
- **Feedback visual**: Indicadores de carga y notificaciones de estado
- **Manejo de errores**: Mensajes específicos para diferentes tipos de error

## 🎨 Sistema de Diseño

### Colores
- **Fondo principal**: Dark 950 (`#020617`)
- **Tarjetas**: Dark 900 con transparencia y blur
- **Texto principal**: Dark 100
- **Texto secundario**: Dark 400
- **Primario**: Blue 600-500 (gradiente)
- **Éxito**: Green 600-500
- **Error**: Red 600-500
- **Advertencia**: Yellow 600-500

### Tipografía
- **Fuente principal**: Inter (Google Fonts)
- **Fuente monospace**: JetBrains Mono

### Efectos Visuales
- **Glassmorphism**: Tarjetas con efecto de vidrio
- **Gradientes**: Botones y elementos destacados
- **Animaciones**: Hover states y transiciones suaves
- **Iconografía**: Lucide React icons consistentes

## 🔒 Seguridad y Validaciones

- **Validación de inputs**: Solo números y decimales válidos
- **Verificación de balance**: Comprobación antes de transacciones
- **Approval inteligente**: Solo solicita approval cuando es necesario
- **Manejo de errores**: Captura y muestra errores específicos del contrato

## 📱 Responsive Design

- **Mobile First**: Diseño optimizado para móviles
- **Breakpoints**: sm (640px), md (768px), lg (1024px)
- **Navegación**: Adaptable a diferentes tamaños de pantalla
- **Grid system**: Layout flexible con CSS Grid y Flexbox

## 🛠️ Scripts Disponibles

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build para producción
npm run preview   # Preview del build
npm run lint      # Linting con ESLint
```

## 🌐 Despliegue

Para desplegar en producción:

1. **Build el proyecto:**
```bash
npm run build
```

2. **Desplegar la carpeta `dist/`** en tu servicio de hosting preferido (Vercel, Netlify, etc.)

## 🔧 Configuración Adicional

### Variables de Entorno Requeridas
- `VITE_LENDING_PROTOCOL_ADDRESS`: Dirección del contrato principal
- `VITE_COLLATERAL_TOKEN_ADDRESS`: Dirección del token cUSD
- `VITE_LOAN_TOKEN_ADDRESS`: Dirección del token dDAI
- `VITE_RPC_URL`: URL del RPC de Ephemery

### MetaMask
- Asegúrate de tener la red Ephemery Testnet configurada
- Tokens cUSD y dDAI añadidos a la wallet para visualización

## 🎯 Próximas Mejoras

- [ ] Modo claro/oscuro toggle
- [ ] Historial de transacciones
- [ ] Gráficos de métricas históricas
- [ ] Notificaciones push
- [ ] Múltiples idiomas
- [ ] Tests unitarios con Vitest

## 📄 Licencia

Este proyecto es parte del curso de Blockchain y es solo para fines educativos.
