# 📦 La Tijera - Gestión de Inventario Pro v3.0

Aplicación React para gestionar inventario de lanas y telas con sincronización WordPress + Lioren.

## ✨ Características

- ✅ **7 Funciones Implementadas:**
  1. 🔍 Búsqueda y Filtros (por nombre, precio, stock)
  2. 📊 Ajuste Manual de Inventario
  3. 💰 Edición de Precios (individual)
  4. 📈 Historial de Precios
  5. 🗑️ Borrar Productos
  6. ➕ Crear Productos (WordPress + Lioren)
  7. 🎨 Crear Variantes (WordPress + Lioren)

- ✅ **Características:**
  - Precios CON IVA y SIN IVA
  - Sincronización WordPress ↔ Lioren
  - Subida de imágenes
  - 7 TABS: Dashboard, Productos, Crear, Variante, Precios, Inventario, Historial
  - Interfaz colorida y responsive
  - Alertas de stock crítico

## 🚀 Instalación Local

### Requisitos
- Node.js 14+ y npm

### Pasos

1. **Clonar o descargar el repositorio**

2. **Navegar a la carpeta:**
```bash
cd app_stock
```

3. **Instalar dependencias:**
```bash
npm install
```

4. **Ejecutar en desarrollo:**
```bash
npm start
```

5. **Abre** http://localhost:3000

6. **Contraseña:** `latijera2026`

## 📦 Desplegar en Vercel

1. Sube el proyecto a GitHub
2. Ve a https://vercel.com
3. Click en "Add New" → "Project"
4. Importa tu repositorio
5. Vercel detecta automáticamente el proyecto React
6. Click en "Deploy"
7. ¡Listo! Tu app estará en línea

## 🔐 Contraseña de Acceso

**`latijera2026`**

## 📋 Estructura

```
app_stock/
├── src/
│   ├── App.js          # Componente principal
│   ├── App.css         # Estilos
│   ├── index.js        # Punto de entrada
│   └── index.css       # Estilos globales
├── public/
│   └── index.html      # HTML base
├── package.json        # Dependencias
├── .gitignore          # Archivos ignorados
├── vercel.json         # Config Vercel
└── README.md           # Este archivo
```

## 🛠️ Tecnologías

- React 18.2.0
- CSS puro
- Responsive Design

## 📝 API Endpoints

La app está configurada para conectar con:
- **WordPress:** https://latijera.cl/wp-json/wc/v3
- **Lioren:** https://www.lioren.cl/api

## 🔑 Credenciales API

Las credenciales están almacenadas en el código (cambiar en producción):

```javascript
const WP_CONSUMER_KEY = 'ck_00ab7fccc2078bf5b48b4d68d02e4da048702542';
const WP_CONSUMER_SECRET = 'cs_7e2ff15307605193e03af7230930dcdca7eef889';
const LIOREN_TOKEN = '6e88c7f5c4ff6b9fba88a58a72d467d539a37288e4c697ac2a587a1a3b5480bd061cca1d0975deab061cca1d0975deab';
```

## 📧 Soporte

Para problemas o dudas, contacta al equipo de desarrollo.

---

**Versión:** 3.0  
**Estado:** ✅ Producción  
**Última actualización:** 2026-08-06
