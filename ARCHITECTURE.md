# 🚀 LocalCoder - Arquitectura Director-Developer

## 🎯 Nueva Arquitectura

LocalCoder ahora implementa una arquitectura avanzada de **Director-Developer con verificación por pasos**:

### Flujo de Trabajo

```
Usuario → Director (Planifica) → Developer (Ejecuta) → Director (Verifica) → ✓
```

1. **Director AI**: Analiza la solicitud del usuario y crea un plan detallado paso a paso
2. **Developer AI**: Ejecuta cada paso usando herramientas para interactuar con el workspace
3. **Director AI**: Verifica que cada paso se completó correctamente antes de continuar
4. **Resultado**: Código implementado y verificado automáticamente

### Componentes del Sistema

#### 🧠 Director AI
- **Rol**: Arquitecto de software senior
- **Responsabilidades**:
  - Analizar solicitudes del usuario
  - Crear planes de implementación detallados
  - Verificar el trabajo del Developer
  - Aprobar o rechazar pasos completados
- **Modelo**: qwen2.5-coder:3b (configurable)

#### 👨‍💻 Developer AI
- **Rol**: Programador experto
- **Responsabilidades**:
  - Ejecutar pasos del plan
  - Usar herramientas para modificar el workspace
  - Reportar resultados de cada acción
- **Modelo**: qwen2.5-coder:3b (configurable)
- **Herramientas disponibles**:
  - `read_file`: Leer archivos del workspace
  - `write_file`: Crear o modificar archivos
  - `list_files`: Listar estructura del proyecto
  - `search_code`: Buscar patrones en el código
  - `delete_file`: Eliminar archivos

#### 🔍 Sistema de Verificación
Después de cada paso, el Director:
1. Revisa los cambios realizados
2. Verifica que se cumplieron los requisitos del paso
3. Proporciona feedback detallado
4. Aprueba o solicita correcciones

## 📋 Ejemplo de Flujo

### Solicitud del Usuario
```
"Crea una función para calcular el factorial de un número"
```

### Plan del Director
```json
{
  "goal": "Implementar función factorial",
  "steps": [
    {
      "id": "step-1",
      "title": "Crear archivo utils/math.ts",
      "description": "Crear el archivo con la estructura base"
    },
    {
      "id": "step-2",
      "title": "Implementar función factorial",
      "description": "Escribir la función factorial con manejo de errores"
    },
    {
      "id": "step-3",
      "title": "Agregar tests",
      "description": "Crear tests unitarios para la función"
    }
  ]
}
```

### Ejecución del Developer
**Paso 1:**
```javascript
// Herramienta: write_file
// Parámetros: { path: "utils/math.ts", content: "..." }
// Resultado: ✓ Archivo creado
```

**Verificación del Director:**
```json
{
  "passed": true,
  "feedback": "Archivo creado correctamente con la estructura base"
}
```

**Paso 2:**
```javascript
// Herramienta: write_file
// Parámetros: { path: "utils/math.ts", content: "export function factorial..." }
// Resultado: ✓ Función implementada
```

**Verificación del Director:**
```json
{
  "passed": true,
  "feedback": "Función factorial implementada correctamente con manejo de errores"
}
```

## 🛠️ Herramientas del Developer

### read_file
Lee el contenido de un archivo del workspace.
```json
{
  "tool": "read_file",
  "parameters": {
    "path": "src/main.ts"
  }
}
```

### write_file
Crea o actualiza un archivo.
```json
{
  "tool": "write_file",
  "parameters": {
    "path": "src/utils.ts",
    "content": "export function add(a, b) { return a + b; }"
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
Elimina un archivo.
```json
{
  "tool": "delete_file",
  "parameters": {
    "path": "old-file.ts"
  }
}
```

## 📂 Workspace

### Cargar Proyecto Existente

1. Ve a **Settings** (ícono de engranaje)
2. En la sección **Workspace**, haz clic en **Upload Project Folder**
3. Selecciona la carpeta de tu proyecto
4. Todos los archivos se cargarán en el workspace virtual

### Estructura del Workspace

El workspace mantiene la estructura completa de tu proyecto:
```
my-project/
├── src/
│   ├── main.ts
│   ├── app.ts
│   └── utils/
│       └── math.ts
├── tests/
│   └── math.test.ts
└── package.json
```

### Exportar Proyecto

Puedes exportar el workspace como ZIP:
- Botón en la barra de título
- Botón en el explorador de archivos

## 🎨 Interfaz

### Panel de Plan de Ejecución

Muestra en tiempo real:
- Lista de pasos del plan
- Estado de cada paso (pendiente, en progreso, completado, verificado, fallido)
- Herramientas usadas por el Developer
- Resultados de verificación del Director
- Feedback detallado

### Terminal

Muestra logs en tiempo real:
- Acciones del Director
- Acciones del Developer
- Uso de herramientas
- Resultados de verificación

### Chat

Mensajes del sistema:
- Plan de implementación
- Resumen de ejecución
- Resultados finales

## ⚙️ Configuración

### Modelos

Puedes usar modelos diferentes para Director y Developer:

```json
{
  "directorModel": "qwen2.5-coder:7b",  // Más capacidad de análisis
  "executorModel": "qwen2.5-coder:3b"   // Más rápido para ejecución
}
```

### Temperatura

- **Director**: 0.3-0.5 (más preciso para planificación)
- **Developer**: 0.5-0.7 (balance para generación de código)

## 🔧 Comandos Avanzados

### Ejecutar con modelos diferentes

```bash
# Usar modelo más grande para Director
ollama pull qwen2.5-coder:7b

# Configurar en Settings:
# Director: qwen2.5-coder:7b
# Developer: qwen2.5-coder:3b
```

### Workspace personalizado

1. Carga tu proyecto desde Settings
2. El Director analizará tu código existente
3. El Developer modificará solo lo necesario
4. La verificación considerará el contexto completo

## 📊 Métricas

El sistema proporciona:
- Tiempo de ejecución por paso
- Número de herramientas usadas
- Tasa de éxito de verificación
- Logs detallados de cada acción

## 🎯 Casos de Uso

### 1. Crear nueva funcionalidad
```
"Agrega autenticación con JWT al proyecto"
```
- Director: Planifica los pasos (crear middleware, rutas, etc.)
- Developer: Implementa cada componente
- Director: Verifica que todo funcione junto

### 2. Refactorizar código
```
"Refactoriza el código para usar patrones de diseño"
```
- Director: Identifica áreas de mejora
- Developer: Aplica los cambios paso a paso
- Director: Verifica que no se rompió nada

### 3. Agregar tests
```
"Agrega tests unitarios para todas las funciones"
```
- Director: Lista las funciones a testear
- Developer: Crea tests para cada una
- Director: Verifica cobertura y calidad

### 4. Corregir bugs
```
"El cálculo de impuestos es incorrecto, corrígelo"
```
- Director: Analiza el problema
- Developer: Identifica y corrige el código
- Director: Verifica que el bug está resuelto

## 🚀 Ventajas

1. **Calidad superior**: La verificación por pasos asegura que cada parte funcione
2. **Transparencia**: Puedes ver exactamente qué se hizo en cada paso
3. **Control**: El Director actúa como supervisor de calidad
4. **Flexibilidad**: El Developer usa herramientas reales para modificar código
5. **Contexto**: El workspace completo está disponible para ambos modelos

## 📝 Notas Técnicas

- Los modelos se ejecutan localmente vía Ollama
- El workspace es virtual (en memoria del navegador)
- Las herramientas modifican el estado del workspace
- La verificación usa el estado actualizado del workspace
- Todo el proceso es streaming (tiempo real)

## 🔄 Diferencias con la versión anterior

### Versión Anterior
- Director planifica
- Developer ejecuta todo de una vez
- Sin verificación intermedia
- Sin herramientas
- Workspace estático

### Versión Actual
- Director planifica paso a paso
- Developer ejecuta paso a paso con herramientas
- Verificación después de cada paso
- Herramientas reales para modificar archivos
- Workspace dinámico y configurable
- Carga de proyectos existentes

---

**Esta arquitectura simula un equipo de desarrollo real con arquitecto, desarrollador y revisor de código.** 🎉
