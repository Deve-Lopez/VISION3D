# VISION3D — Visor de modelos 3D

Prototipo de visor de modelos 3D construido con React + React Three Fiber + Cloudinary.

## Stack

- **React 18** + **Vite**
- **React Three Fiber** + **Drei** — renderizado 3D
- **Cloudinary** — almacenamiento de archivos (plan gratuito: 25 GB)
- **Vercel** — hosting gratuito

## Configurar Cloudinary

1. Crea una cuenta en https://cloudinary.com (gratis)
2. En tu dashboard ve a **Settings → Upload → Upload presets**
3. Crea un preset nuevo:
   - Signing mode: **Unsigned**
   - Resource type: **Raw** (importante para archivos 3D)
4. Abre `src/cloudinary.js` y rellena:

```js
const CLOUD_NAME = "tu_cloud_name";   // Panel principal de Cloudinary
const UPLOAD_PRESET = "tu_preset";    // Nombre del preset que creaste
```

## Instalar y ejecutar

```bash
pnpm install
pnpm dev
```

## Deploy en Vercel

1. Sube el proyecto a GitHub
2. Entra en https://vercel.com → New Project → importa el repo
3. Framework: **Vite** (lo detecta automáticamente)
4. Deploy → obtienes una URL pública que funciona en cualquier PC

## Formatos soportados

- `.glb` — recomendado (binario compacto)
- `.gltf` — también funciona

## Controles del visor

| Acción | Gesto |
|--------|-------|
| Rotar | Click + arrastrar |
| Zoom | Scroll |
| Pan | Shift + arrastrar |
