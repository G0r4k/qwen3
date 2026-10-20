# 📂 Workspace y Explorador de Archivos

## 🎯 Explorador Dinámico

El explorador de archivos ahora muestra **dinámicamente** el workspace actual, reflejando todos los cambios realizados por el Developer AI en tiempo real.

### Características

1. **Nombre del Workspace**: Muestra el nombre del proyecto actual en el header
2. **Actualización en Tiempo Real**: Cuando el Developer crea/modifica archivos, el explorador se actualiza automáticamente
3. **Apertura Automática**: Los archivos creados por el Developer se abren automáticamente en el editor
4. **Estructura Completa**: Mantiene la jerarquía completa de carpetas y archivos

## 🔄 Flujo de Trabajo

### 1. Cargar un Proyecto Existente

```
Settings → Workspace → Upload Project Folder
```

- Selecciona la carpeta de tu proyecto
- Todos los archivos se cargan en el workspace
- El explorador muestra la estructura completa

### 2. Developer Modifica el Workspace

Cuando el Developer ejecuta un paso del plan:

```javascript
// Developer usa la herramienta write_file
{
  "tool": "write_file",
  "parameters": {
    "path": "src/utils/math.ts",
    "content": "export function factorial(n) { ... }"
  }
}
```

**Resultado:**
- ✅ El archivo se crea/modifica en el workspace
- ✅ El explorador se actualiza automáticamente
- ✅ El archivo se abre en el editor
- ✅ Puedes ver los cambios inmediatamente

### 3. Ver los Cambios

- **Explorador**: Muestra la nueva estructura de archivos
- **Editor**: Muestra el contenido del archivo modificado
- **Terminal**: Logs de las acciones del Developer
- **Plan Panel**: Estado de cada paso y herramientas usadas

## 🛠️ Herramientas del Developer

El Developer usa estas herramientas para interactuar con el workspace:

### write_file
Crea o actualiza un archivo y lo abre automáticamente en el editor.

```json
{
  "tool": "write_file",
  "parameters": {
    "path": "src/components/Button.tsx",
    "content": "export const Button = () => { ... }"
  }
}
```

**Efecto:**
- Crea el archivo en el workspace
- Actualiza el explorador
- Abre el archivo en el editor

### read_file
Lee el contenido de un archivo del workspace.

```json
{
  "tool": "read_file",
  "parameters": {
    "path": "src/App.tsx"
  }
}
```

### list_files
Lista todos los archivos y directorios.

```json
{
  "tool": "list_files",
  "parameters": {
    "path": "src" // opcional
  }
}
```

### search_code
Busca patrones en todo el código.

```json
{
  "tool": "search_code",
  "parameters": {
    "pattern": "function factorial"
  }
}
```

### delete_file
Elimina un archivo del workspace.

```json
{
  "tool": "delete_file",
  "parameters": {
    "path": "old-file.ts"
  }
}
```

## 📊 Ejemplo Completo

### Solicitud del Usuario
```
"Crea una calculadora simple con React"
```

### Plan del Director
```json
{
  "goal": "Implementar calculadora React",
  "steps": [
    {
      "title": "Crear componente Calculator",
      "description": "Crear src/components/Calculator.tsx con la lógica"
    },
    {
      "title": "Crear componente Display",
      "description": "Crear src/components/Display.tsx para mostrar resultados"
    },
    {
      "title": "Crear componente Button",
      "description": "Crear src/components/Button.tsx para los botones"
    },
    {
      "title": "Actualizar App.tsx",
      "description": "Importar y usar el componente Calculator"
    }
  ]
}
```

### Ejecución del Developer

**Paso 1:**
```javascript
// Herramienta: write_file
// Path: src/components/Calculator.tsx
// Resultado: ✓ Archivo creado
```

**Efecto visible:**
- 📁 Explorador: Aparece `src/components/Calculator.tsx`
- 📝 Editor: Se abre automáticamente el archivo
- 💻 Terminal: Log de la acción

**Paso 2:**
```javascript
// Herramienta: write_file
// Path: src/components/Display.tsx
// Resultado: ✓ Archivo creado
```

**Efecto visible:**
- 📁 Explorador: Aparece `src/components/Display.tsx`
- 📝 Editor: Se abre el nuevo archivo
- 💻 Terminal: Log de la acción

**Y así sucesivamente...**

### Verificación del Director

Después de cada paso, el Director verifica:
- ¿Se creó el archivo correctamente?
- ¿El código es válido?
- ¿Cumple con los requisitos del paso?

## 🎨 Interfaz

### Explorador
```
📁 my-project
  📁 src/
    📁 components/
      📄 Calculator.tsx  ← Nuevo
      📄 Display.tsx     ← Nuevo
      📄 Button.tsx      ← Nuevo
    📄 App.tsx           ← Modificado
  📄 package.json
```

### Editor
- Pestañas con los archivos abiertos
- Resaltado de sintaxis
- Edición en tiempo real
- Sincronización con el workspace

### Terminal
```
[Step 1/4] Crear componente Calculator
[Developer] write_file(src/components/Calculator.tsx)
[Director] ✓ Verified: Componente creado correctamente

[Step 2/4] Crear componente Display
[Developer] write_file(src/components/Display.tsx)
[Director] ✓ Verified: Display creado correctamente
```

## 💡 Ventajas

1. **Transparencia Total**: Ves exactamente qué archivos se crean/modifican
2. **Feedback Inmediato**: Los cambios se reflejan instantáneamente
3. **Control Completo**: Puedes editar manualmente cualquier archivo
4. **Contexto Visual**: El explorador muestra la estructura completa
5. **Apertura Automática**: No necesitas buscar los archivos creados

## 🔧 Configuración

### Cambiar el Nombre del Workspace
```
Settings → Workspace → Project Name
```

### Cargar un Proyecto Diferente
```
Settings → Workspace → Upload Project Folder
```

### Resetear el Workspace
```
Settings → Workspace → Reset (ícono X)
```

## 📝 Notas

- El workspace es virtual (en memoria del navegador)
- Los cambios no se guardan automáticamente en disco
- Usa "Download as ZIP" para exportar el proyecto
- El explorador se actualiza en tiempo real
- Los archivos creados por el Developer se abren automáticamente

---

**El explorador ahora es tu ventana al workspace, mostrando en tiempo real todo lo que el Developer AI está creando y modificando.** 🎉
