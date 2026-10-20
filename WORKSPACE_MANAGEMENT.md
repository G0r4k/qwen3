# 📂 Gestión del Workspace

## 🎯 Funcionalidades Completas

El explorador de archivos ahora permite gestionar completamente el workspace con las siguientes operaciones:

### ✅ Operaciones Disponibles

1. **Crear archivos** - En la raíz o dentro de carpetas
2. **Crear carpetas** - En la raíz o dentro de otras carpetas
3. **Renombrar** - Archivos y carpetas
4. **Eliminar** - Archivos y carpetas
5. **Cargar proyectos** - Desde el sistema de archivos
6. **Resetear workspace** - Limpiar todo el contenido

## 🖱️ Cómo Usar

### Crear Archivos y Carpetas

#### En la Raíz del Workspace

1. **Crear archivo**: Haz clic en el ícono 📄 (FilePlus) en el header del explorador
2. **Crear carpeta**: Haz clic en el ícono 📁 (FolderPlus) en el header del explorador
3. Escribe el nombre y presiona Enter

#### Dentro de una Carpeta

1. **Click derecho** en la carpeta
2. Selecciona "New File" o "New Folder"
3. Escribe el nombre y presiona Enter

### Renombrar Archivos/Carpetas

1. **Click derecho** en el archivo o carpeta
2. Selecciona "Rename"
3. El nombre se vuelve editable
4. Escribe el nuevo nombre y presiona Enter (o Escape para cancelar)

### Eliminar Archivos/Carpetas

1. **Click derecho** en el archivo o carpeta
2. Selecciona "Delete"
3. Confirma la eliminación

### Cargar un Proyecto Completo

1. Ve a **Settings** (ícono de engranaje)
2. En la sección **Workspace**, haz clic en **Upload Project Folder**
3. Selecciona la carpeta de tu proyecto
4. Todos los archivos se cargarán automáticamente
5. El nombre del proyecto se detecta automáticamente

### Resetear el Workspace

1. Ve a **Settings**
2. En la sección **Workspace**, haz clic en el ícono **X**
3. Confirma que quieres resetear
4. El workspace quedará vacío

## 🎨 Menú Contextual

El menú contextual (click derecho) muestra diferentes opciones según el tipo de elemento:

### Para Carpetas:
- 📄 **New File** - Crear un nuevo archivo dentro de la carpeta
- 📁 **New Folder** - Crear una nueva subcarpeta
- ✏️ **Rename** - Renombrar la carpeta
- 🗑️ **Delete** - Eliminar la carpeta y todo su contenido

### Para Archivos:
- ✏️ **Rename** - Renombrar el archivo
- 🗑️ **Delete** - Eliminar el archivo

## 💡 Ejemplos de Uso

### Ejemplo 1: Crear un Proyecto desde Cero

1. Inicia LocalCoder
2. El workspace está vacío
3. Haz clic en 📁 para crear una carpeta "src"
4. Click derecho en "src" → "New File" → "main.ts"
5. Click derecho en "src" → "New File" → "utils.ts"
6. Haz clic en 📄 en el header para crear "package.json" en la raíz
7. ¡Tu proyecto está listo!

### Ejemplo 2: Cargar un Proyecto Existente

1. Ve a Settings → Workspace → Upload Project Folder
2. Selecciona la carpeta de tu proyecto
3. El explorador muestra toda la estructura
4. Puedes editar cualquier archivo
5. Puedes crear nuevos archivos/carpetas
6. Puedes renombrar o eliminar lo que necesites

### Ejemplo 3: Reorganizar un Proyecto

1. Click derecho en un archivo → "Rename"
2. Cambia el nombre de "old-name.ts" a "new-name.ts"
3. Click derecho en una carpeta → "New Folder"
4. Crea una carpeta "components"
5. Arrastra archivos (futuro) o recrea los archivos en la nueva ubicación

## 🔧 Funcionalidades Técnicas

### Estructura de IDs

Cada archivo/carpeta tiene un ID único basado en su path:
- Archivo en raíz: `main.ts`
- Archivo en carpeta: `src/main.ts`
- Carpeta en raíz: `src`
- Carpeta anidada: `src/components`

### Actualización en Tiempo Real

- Los cambios se reflejan inmediatamente en el explorador
- Los archivos creados por el Developer AI aparecen automáticamente
- Los archivos eliminados se cierran en el editor si estaban abiertos

### Integración con Developer AI

Cuando el Developer AI crea archivos:
1. Los archivos aparecen en el explorador inmediatamente
2. Se abren automáticamente en el editor
3. Puedes editarlos manualmente después
4. Puedes renombrarlos o moverlos (recrear en nueva ubicación)

## 🎯 Casos de Uso Comunes

### Desarrollo Web
```
📁 my-project/
  📁 src/
    📁 components/
      📄 Button.tsx
      📄 Header.tsx
    📁 utils/
      📄 helpers.ts
    📄 App.tsx
    📄 main.tsx
  📁 public/
    📄 index.html
  📄 package.json
  📄 tsconfig.json
```

### API Backend
```
📁 api-project/
  📁 src/
    📁 routes/
      📄 users.ts
      📄 auth.ts
    📁 middleware/
      📄 auth.ts
    📁 models/
      📄 user.ts
    📄 server.ts
    📄 app.ts
  📄 package.json
  📄 .env
```

### Proyecto Python
```
📁 python-project/
  📁 src/
    📄 __init__.py
    📄 main.py
    📄 utils.py
  📁 tests/
    📄 test_main.py
  📄 requirements.txt
  📄 README.md
```

## ⚠️ Notas Importantes

1. **Workspace Virtual**: Los archivos existen solo en memoria del navegador
2. **No hay Undo**: No hay función de deshacer, ten cuidado al eliminar
3. **Confirmación**: Se pide confirmación antes de eliminar
4. **IDs Únicos**: Los IDs se basan en el path, no los cambies manualmente
5. **Exportar**: Usa "Download as ZIP" para guardar tu trabajo

## 🚀 Tips y Trucos

### Organizar Eficientemente
- Crea la estructura de carpetas primero
- Luego crea los archivos dentro de cada carpeta
- Usa nombres descriptivos
- Mantén una jerarquía lógica

### Trabajar con Developer AI
- Deja que el Developer cree la estructura inicial
- Revisa y ajusta los nombres si es necesario
- Puedes agregar archivos manualmente después
- El Developer puede modificar tus archivos existentes

### Navegación Rápida
- Click en una carpeta para expandir/colapsar
- Click en un archivo para abrirlo en el editor
- Usa el menú contextual para operaciones rápidas
- Los archivos abiertos aparecen en pestañas

## 📊 Estado del Workspace

El explorador muestra:
- **Nombre del proyecto** en el header
- **Estructura completa** de archivos y carpetas
- **Iconos diferentes** según el tipo de archivo
- **Estado expandido/colapsado** de carpetas
- **Archivo activo** resaltado

## 🔒 Seguridad

- Los archivos solo existen en tu navegador
- No se envían a ningún servidor
- Al cerrar la pestaña, se pierden los cambios no exportados
- Usa "Download as ZIP" regularmente para guardar tu trabajo

---

**El explorador ahora es un gestor completo de archivos para tu workspace, permitiéndote crear, organizar y mantener tu proyecto de forma intuitiva.** 🎉
