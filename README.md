# LocalCoder - IDE con IA Local

Un entorno de desarrollo integrado (IDE) avanzado que utiliza una arquitectura **Director-Developer con verificación por pasos** para implementar código de alta calidad usando modelos de IA locales a través de Ollama.

## 🎯 Arquitectura Avanzada

LocalCoder implementa un flujo de trabajo profesional:

1. **🧠 Director AI**: Analiza tu solicitud y crea un plan detallado paso a paso
2. **👨‍💻 Developer AI**: Ejecuta cada paso usando herramientas reales para modificar el workspace
3. **🔍 Verificación**: El Director verifica que cada paso se completó correctamente
4. **✅ Resultado**: Código implementado y verificado automáticamente

```
Usuario → Director (Planifica) → Developer (Ejecuta con herramientas) → Director (Verifica) → ✓
```

## 🚀 Características

- **Arquitectura Director-Developer** con verificación por pasos
- **Herramientas reales** para el Developer (leer, escribir, buscar, eliminar archivos)
- **Gestión completa del workspace** - Crear, renombrar, eliminar archivos y carpetas
- **Workspace dinámico** - El explorador muestra en tiempo real todos los cambios
- **Workspace configurable** - Carga tu proyecto existente desde disco
- **Apertura automática** - Los archivos creados por el Developer se abren en el editor
- **Menú contextual** - Click derecho para gestionar archivos y carpetas
- **Editor de código profesional** con Monaco Editor (el mismo motor que VS Code)
- **Panel de Plan de Ejecución** en tiempo real con estado de cada paso
- **Chat con IA** con streaming de respuestas
- **Explorador de archivos** completamente funcional e interactivo
- **Terminal integrada** con logs detallados de cada acción
- **Configuración flexible** de modelos y parámetros
- **100% local** - Todos los datos permanecen en tu máquina
- **Interfaz moderna** inspirada en VS Code

## 🏗️ Arquitectura Detallada

### Director AI (qwen2.5-coder:3b)
- **Rol**: Arquitecto de software senior
- **Responsabilidades**:
  - Analizar solicitudes del usuario
  - Crear planes de implementación detallados
  - Verificar el trabajo del Developer después de cada paso
  - Aprobar o solicitar correcciones
- **Modelo**: Configurable en Settings

### Developer AI (qwen2.5-coder:3b)
- **Rol**: Programador experto
- **Responsabilidades**:
  - Ejecutar pasos del plan uno por uno
  - Usar herramientas para interactuar con el workspace
  - Reportar resultados de cada acción
- **Herramientas disponibles**:
  - `read_file`: Leer archivos del workspace
  - `write_file`: Crear o modificar archivos
  - `list_files`: Listar estructura del proyecto
  - `search_code`: Buscar patrones en el código
  - `delete_file`: Eliminar archivos

### Sistema de Verificación
Después de cada paso, el Director:
1. Revisa los cambios realizados por el Developer
2. Verifica que se cumplieron los requisitos del paso
3. Proporciona feedback detallado
4. Aprueba o solicita correcciones

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para más detalles.

## 📋 Requisitos Previos

### Ollama

Necesitas tener [Ollama](https://ollama.ai/) instalado y corriendo en tu sistema.

**Instalación:**

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Descarga desde https://ollama.ai/download
```

**⚠️ IMPORTANTE: Configurar CORS para la aplicación web**

Por defecto, Ollama no permite peticiones desde navegadores web. Debes configurar la variable de entorno `OLLAMA_ORIGINS` antes de iniciar Ollama:

**Opción 1: Ejecutar con CORS habilitado (temporal)**

```bash
OLLAMA_ORIGINS="*" ollama serve
```

**Opción 2: Configurar permanentemente**

**macOS/Linux:**
```bash
# Añade a tu ~/.bashrc o ~/.zshrc
export OLLAMA_ORIGINS="*"

# Luego recarga la configuración
source ~/.bashrc  # o source ~/.zshrc
```

**Windows:**
1. Abre "Variables de entorno del sistema"
2. Añade una nueva variable de entorno:
   - Nombre: `OLLAMA_ORIGINS`
   - Valor: `*`
3. Reinicia Ollama

**Descargar el modelo:**

```bash
ollama pull qwen2.5-coder:3b
```

### Node.js

- Node.js 18+ y npm instalados

## 🔧 Instalación

1. **Clonar o descargar el proyecto:**

```bash
cd localcoder
```

2. **Instalar dependencias:**

```bash
npm install
```

3. **Iniciar el servidor de desarrollo:**

```bash
npm run dev
```

4. **Abrir en el navegador:**

La aplicación estará disponible en `http://localhost:5173`

## 📦 Dependencias

### Dependencias de Producción

| Paquete | Versión | Descripción |
|---------|---------|-------------|
| `react` | ^18.2.0 | Biblioteca principal de UI |
| `react-dom` | ^18.2.0 | Renderizado de React en el DOM |
| `@monaco-editor/react` | ^4.7.0 | Editor de código profesional (Motor de VS Code) |
| `zustand` | ^5.0.15 | Gestión de estado global ligera y rápida |
| `lucide-react` | ^0.294.0 | Iconos modernos y consistentes |
| `uuid` | ^9.0.1 | Generación de identificadores únicos |
| `framer-motion` | ^11.16.1 | Animaciones fluidas y transiciones |
| `date-fns` | ^2.30.0 | Utilidades modernas para manejo de fechas |
| `recharts` | ^2.10.0 | Gráficos y visualizaciones de datos |
| `react-router-dom` | ^6.8.0 | Enrutamiento para aplicaciones React |
| `@dnd-kit/core` | ^6.1.0 | Drag and drop accesible |
| `@dnd-kit/sortable` | ^8.0.0 | Funcionalidad de ordenamiento |
| `@dnd-kit/utilities` | ^3.2.2 | Utilidades para dnd-kit |
| `@supabase/supabase-js` | ^2.98.0 | Cliente de Supabase (opcional para backend) |
| `canvas-confetti` | ^1.9.3 | Efectos de confeti para celebraciones |
| `jszip` | ^3.10.2 | Creación y manipulación de archivos ZIP |
| `file-saver` | ^2.0.5 | Guardado de archivos en el navegador |
| `@types/file-saver` | ^2.0.7 | Tipos TypeScript para file-saver |

### Dependencias de Desarrollo

| Paquete | Versión | Descripción |
|---------|---------|-------------|
| `vite` | ^6.3.5 | Build tool ultrarrápido |
| `@vitejs/plugin-react` | ^4.3.4 | Plugin de React para Vite |
| `typescript` | ^5.7.0 | Lenguaje de programación tipado |
| `tailwindcss` | ^4.1.7 | Framework CSS utility-first |
| `@tailwindcss/vite` | ^4.1.7 | Integración de Tailwind con Vite |
| `@types/react` | ^18.2.0 | Tipos TypeScript para React |
| `@types/react-dom` | ^18.2.0 | Tipos TypeScript para React DOM |
| `@types/uuid` | ^9.0.7 | Tipos TypeScript para uuid |
| `@types/canvas-confetti` | ^1.6.4 | Tipos TypeScript para canvas-confetti |

## 📁 Estructura del Proyecto

```
localcoder/
├── src/
│   ├── components/
│   │   ├── Chat.tsx          # Panel de chat con IA
│   │   ├── Editor.tsx        # Editor de código Monaco
│   │   ├── Settings.tsx      # Panel de configuración
│   │   ├── Sidebar.tsx       # Explorador de archivos
│   │   └── Terminal.tsx      # Terminal integrada
│   ├── hooks/
│   │   └── useOllama.ts      # Hook para comunicación con Ollama
│   ├── utils/
│   │   └── exportZip.ts      # Utilidad para exportar proyectos
│   ├── App.tsx               # Componente principal
│   ├── store.ts              # Estado global con Zustand
│   ├── types.ts              # Definiciones de tipos TypeScript
│   ├── main.tsx              # Punto de entrada
│   └── index.css             # Estilos globales y Tailwind
├── public/                   # Archivos estáticos
├── index.html                # HTML principal
├── package.json              # Dependencias y scripts
├── vite.config.js            # Configuración de Vite
├── tsconfig.json             # Configuración de TypeScript
└── README.md                 # Este archivo
```

## 🎯 Uso

### Configuración Inicial

1. Asegúrate de que Ollama esté corriendo:
   ```bash
   ollama serve
   ```

2. Abre la aplicación en el navegador

3. Ve a **Settings** (ícono de engranaje) y configura:
   - **Ollama Base URL**: `http://localhost:11434` (por defecto)
   - **Director Model**: `qwen2.5-coder:3b`
   - **Executor Model**: `qwen2.5-coder:3b`
   - **Temperature**: 0.7 (balance entre precisión y creatividad)
   - **Max Tokens**: 4096

### Flujo de Trabajo

1. **Crear o abrir archivos** en el explorador (panel izquierdo)
2. **Escribir código** en el editor central
3. **Solicitar asistencia de IA** en el panel de chat (derecha)
4. El **Director** analiza tu solicitud y crea un plan
5. El **Executor** implementa el código según el plan
6. **Revisar y aceptar** los cambios sugeridos

### Comandos de Terminal

La terminal integrada soporta los siguientes comandos:

- `help` - Mostrar comandos disponibles
- `clear` - Limpiar la terminal
- `status` - Mostrar estado del sistema
- `models` - Listar modelos configurados
- `ollama-status` - Verificar conexión con Ollama

### Exportar Proyecto

Puedes descargar todo el workspace como un archivo ZIP usando el botón de descarga en:
- La barra de título (botón "ZIP")
- El header del explorador de archivos

## ⚙️ Configuración Avanzada

### Usar Modelos Diferentes

Puedes usar modelos diferentes para Director y Executor:

```bash
# Descargar modelos adicionales
ollama pull qwen2.5-coder:7b
ollama pull codellama:7b
```

Luego configura en Settings:
- Director: `qwen2.5-coder:7b` (más capacidad de análisis)
- Executor: `qwen2.5-coder:3b` (más rápido para generación)

### Ajustar Temperatura

- **0.0 - 0.3**: Código más preciso y determinista
- **0.4 - 0.7**: Balance recomendado
- **0.8 - 1.0**: Más creativo y variado
- **1.0 - 2.0**: Altamente creativo (puede ser menos coherente)

### Conexión Remota

Si Ollama corre en otra máquina:

1. Configurar Ollama para aceptar conexiones externas:
   ```bash
   OLLAMA_HOST=0.0.0.0 ollama serve
   ```

2. En Settings, cambiar la URL:
   ```
   http://IP_REMOTA:11434
   ```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo

# Producción
npm run build        # Construir para producción
npm run preview      # Previsualizar build de producción

# Verificación
npm run typecheck    # Verificar tipos TypeScript
```

## 🌐 Compatibilidad de Navegadores

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 🐛 Solución de Problemas

### "Cannot connect to Ollama" o Error de CORS

**Síntoma:** La aplicación muestra "Not connected" o errores de CORS.

**Causa:** El navegador bloquea las peticiones a Ollama por políticas de seguridad CORS.

**Solución:**

1. **Detén Ollama** (Ctrl+C en la terminal donde está corriendo)

2. **Reinicia con CORS habilitado:**
   ```bash
   OLLAMA_ORIGINS="*" ollama serve
   ```

3. **Verifica la conexión** en Settings → Check

**Configuración permanente:**

- **macOS/Linux**: Añade `export OLLAMA_ORIGINS="*"` a tu `~/.bashrc` o `~/.zshrc`
- **Windows**: Añade la variable de entorno `OLLAMA_ORIGINS` con valor `*` en las variables del sistema

**Verificar que Ollama está corriendo:**

```bash
# Debería mostrar los modelos instalados
curl http://localhost:11434/api/tags
```

Si el comando anterior funciona pero la aplicación web no, es definitivamente un problema de CORS.

### El modelo no responde

1. Verifica que el modelo esté instalado: `ollama pull qwen2.5-coder:3b`
2. Aumenta el timeout en la configuración
3. Reduce `maxTokens` para respuestas más rápidas
4. Verifica la memoria disponible (los modelos requieren RAM)

### El editor no carga

1. Limpia la caché del navegador
2. Verifica la conexión a internet (Monaco se carga desde CDN)
3. Revisa la consola del navegador para errores

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Soporte

Para reportar problemas o solicitar características, abre un issue en el repositorio del proyecto.

## 🙏 Agradecimientos

- [Ollama](https://ollama.ai/) - Por hacer accesible la IA local
- [Qwen](https://github.com/QwenLM/Qwen) - Por el modelo de código
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Por el editor profesional
- [React](https://reactjs.org/) - Por el framework de UI
- [Vite](https://vitejs.dev/) - Por el build tool ultrarrápido

---

**Desarrollado con ❤️ para desarrolladores que valoran la privacidad y el control local**
